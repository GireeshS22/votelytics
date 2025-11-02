"""
Validate the downloaded GeoJSON file
"""
import json

# Load GeoJSON
with open('data/tn_ac_2021.geojson') as f:
    data = json.load(f)

# Get AC numbers
ac_nos = sorted([f['properties']['AC_NO'] for f in data['features']])

print(f'AC Numbers range: {ac_nos[0]} to {ac_nos[-1]}')
print(f'Total: {len(ac_nos)}')

# Check for missing numbers
missing = [i for i in range(1, 235) if i not in ac_nos]
print(f'Missing AC numbers: {missing if missing else "None - Perfect!"}')

print(f'\nFirst 10 constituencies:')
for f in data['features'][:10]:
    print(f'  AC {f["properties"]["AC_NO"]}: {f["properties"]["AC_NAME"]} ({f["properties"]["DIST_NAME"]})')
