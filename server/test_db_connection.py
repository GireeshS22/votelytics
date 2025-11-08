"""
Test different database connection strings to find what works
"""
import psycopg2
from urllib.parse import quote_plus
import sys

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Password (URL encoded)
password = "neO2Q26fgvZkUf%40f"
password_raw = "neO2Q26fgvZkUf@f"

# Different connection strings to try
connection_strings = [
    {
        "name": "Direct Connection - username: postgres",
        "url": f"postgresql://postgres:{password}@db.mksoocqeoylprohcbwtr.supabase.co:5432/postgres"
    },
    {
        "name": "Direct Connection - username: postgres.mksoocqeoylprohcbwtr",
        "url": f"postgresql://postgres.mksoocqeoylprohcbwtr:{password}@db.mksoocqeoylprohcbwtr.supabase.co:5432/postgres"
    },
    {
        "name": "Pooler Transaction Mode - port 6543",
        "url": f"postgresql://postgres.mksoocqeoylprohcbwtr:{password}@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"
    },
    {
        "name": "Pooler Session Mode - port 5432 (current)",
        "url": f"postgresql://postgres.mksoocqeoylprohcbwtr:{password}@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
    },
    {
        "name": "Direct Connection - postgres (double URL encoded)",
        "url": f"postgresql://postgres:{quote_plus(password_raw)}@db.mksoocqeoylprohcbwtr.supabase.co:5432/postgres"
    },
    {
        "name": "Direct Connection - postgres.project (double URL encoded)",
        "url": f"postgresql://postgres.mksoocqeoylprohcbwtr:{quote_plus(password_raw)}@db.mksoocqeoylprohcbwtr.supabase.co:5432/postgres"
    },
]

print("=" * 80)
print("TESTING DATABASE CONNECTIONS")
print("=" * 80)
print()

working_connections = []

for i, config in enumerate(connection_strings, 1):
    print(f"\n[{i}/{len(connection_strings)}] Testing: {config['name']}")
    print(f"URL: {config['url'][:50]}...")

    try:
        # Try to connect with 10 second timeout
        conn = psycopg2.connect(config['url'], connect_timeout=10)
        cursor = conn.cursor()

        # Test with a simple query
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]

        # Test with actual table query
        cursor.execute("SELECT COUNT(*) FROM constituencies;")
        count = cursor.fetchone()[0]

        cursor.close()
        conn.close()

        print(f"✅ SUCCESS!")
        print(f"   PostgreSQL Version: {version[:50]}...")
        print(f"   Constituencies count: {count}")

        working_connections.append(config)

    except Exception as e:
        error_msg = str(e)
        if "password authentication failed" in error_msg:
            print(f"❌ FAILED: Wrong password/username")
        elif "max clients reached" in error_msg:
            print(f"❌ FAILED: Max clients reached (pooler saturated)")
        elif "timeout" in error_msg.lower():
            print(f"❌ FAILED: Connection timeout")
        else:
            print(f"❌ FAILED: {error_msg[:100]}")

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)

if working_connections:
    print(f"\n✅ Found {len(working_connections)} working connection(s):\n")
    for i, config in enumerate(working_connections, 1):
        print(f"{i}. {config['name']}")
        print(f"   URL: {config['url']}\n")

    print("\n🎯 RECOMMENDED CONNECTION STRING:")
    print(working_connections[0]['url'])
else:
    print("\n❌ NO WORKING CONNECTIONS FOUND")
    print("\nPossible issues:")
    print("1. Password is incorrect")
    print("2. Database is not accessible from your network")
    print("3. All pooler connections are exhausted")
    print("\nNext steps:")
    print("- Reset database password in Supabase dashboard")
    print("- Wait 5-10 minutes for pooler connections to clear")
    print("- Check Supabase dashboard for connection status")

print("\n" + "=" * 80)
