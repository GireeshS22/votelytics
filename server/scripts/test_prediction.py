"""
Test script - Generate prediction for ONE constituency to verify setup
"""
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.constituency import Constituency
from app.config import settings
from app.services.prediction_generator import (
    load_alliance_config,
    load_trends_summary,
    generate_prediction_for_constituency
)
import json

print("=" * 80)
print("PREDICTION GENERATION TEST")
print("=" * 80)
print()

# Check API key
if not settings.OPENAI_API_KEY:
    print("ERROR: OPENAI_API_KEY not found!")
    sys.exit(1)
print("✓ API key found")

# Load config files
print("Loading configuration files...")
try:
    alliance_config = load_alliance_config("data/alliance_config_2026.json")
    trends_summary = load_trends_summary("data/trends_2026_compiled.txt")
    print(f"✓ Loaded alliance config ({len(alliance_config['alliances'])} alliances)")
    print(f"✓ Loaded trends summary ({len(trends_summary)} chars)")
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)

print()

# Get a test constituency
db = SessionLocal()
constituency = db.query(Constituency).filter(Constituency.ac_number == 1).first()

if not constituency:
    print("ERROR: Could not find test constituency")
    sys.exit(1)

print(f"Testing with: {constituency.name} (AC #{constituency.ac_number})")
print(f"District: {constituency.district}")
print()

# Generate prediction
print("Calling ChatGPT to generate prediction...")
print("(This will take ~10-15 seconds)")
print()

prediction_data = generate_prediction_for_constituency(
    constituency_id=constituency.id,
    db=db,
    alliance_config=alliance_config,
    trends_summary=trends_summary,
    api_key=settings.OPENAI_API_KEY,
    model="gpt-5"
)

print()
print("=" * 80)
print("RESULT")
print("=" * 80)

if prediction_data:
    print("✓ SUCCESS! Prediction generated:")
    print()
    print(json.dumps(prediction_data, indent=2))
    print()
    print("=" * 80)
    print("TEST PASSED!")
    print("=" * 80)
    print()
    print("You can now run the full generation script:")
    print("poetry run python scripts/generate_predictions.py --constituency-ids 1,2,3")
else:
    print("✗ FAILED - Could not generate prediction")
    print("Check the error messages above")

db.close()
