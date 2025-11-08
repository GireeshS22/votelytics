"""
Test script to figure out gpt-5-mini parameters
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from openai import OpenAI
from app.config import settings

print("Testing gpt-5-mini API call...")
print(f"API Key present: {bool(settings.OPENAI_API_KEY)}")
print()

client = OpenAI(api_key=settings.OPENAI_API_KEY)

# Test 1: Simplest possible call
print("=" * 80)
print("TEST 1: Absolute simplest call - just say hi")
print("=" * 80)
try:
    response = client.chat.completions.create(
        model="gpt-5-mini",
        messages=[
            {"role": "user", "content": "Say hi"}
        ]
    )

    print(f"SUCCESS!")
    print(f"Response: {response.choices[0].message.content}")
    print(f"Response type: {type(response.choices[0].message.content)}")
    print()
except Exception as e:
    print(f"FAILED: {e}")
    print()

# Test 2: With max_completion_tokens
print("=" * 80)
print("TEST 2: With max_completion_tokens")
print("=" * 80)
try:
    response = client.chat.completions.create(
        model="gpt-5-mini",
        messages=[
            {"role": "user", "content": "Say hi"}
        ],
        max_completion_tokens=50
    )

    print(f"SUCCESS!")
    print(f"Response: {response.choices[0].message.content}")
    print()
except Exception as e:
    print(f"FAILED: {e}")
    print()

# Test 3: Ask for JSON
print("=" * 80)
print("TEST 3: Ask for JSON (no forced mode)")
print("=" * 80)
try:
    response = client.chat.completions.create(
        model="gpt-5-mini",
        messages=[
            {
                "role": "user",
                "content": "Return this as JSON: name is 'test', value is 123. Return ONLY JSON, no markdown."
            }
        ],
        max_completion_tokens=100
    )

    print(f"SUCCESS!")
    print(f"Response: {response.choices[0].message.content}")
    print()
except Exception as e:
    print(f"FAILED: {e}")
    print()

# Test 4: System message
print("=" * 80)
print("TEST 4: With system message")
print("=" * 80)
try:
    response = client.chat.completions.create(
        model="gpt-5-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say hi"}
        ],
        max_completion_tokens=50
    )

    print(f"SUCCESS!")
    print(f"Response: {response.choices[0].message.content}")
    print()
except Exception as e:
    print(f"FAILED: {e}")
    print()

print("=" * 80)
print("ALL TESTS COMPLETE")
print("=" * 80)
