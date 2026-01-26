"""Compare v1 vs v2 predictions to check for bias"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from app.database import SessionLocal
from app.models.prediction import Prediction
from sqlalchemy import func

db = SessionLocal()

# Count predictions by version
v1_count = db.query(func.count(Prediction.id)).filter(Prediction.version == 1).scalar()
v2_count = db.query(func.count(Prediction.id)).filter(Prediction.version == 2).scalar()
print(f"V1 predictions: {v1_count}")
print(f"V2 predictions: {v2_count}")

if v2_count == 0:
    print("No v2 predictions to compare")
    db.close()
    sys.exit(0)

# Get v1 and v2 for comparison
v1_preds = {p.constituency_id: p for p in db.query(Prediction).filter(Prediction.version == 1).all()}
v2_preds = {p.constituency_id: p for p in db.query(Prediction).filter(Prediction.version == 2).all()}

# Compare
changed_winner = []
same_winner = []
margin_changes = []

for cid, v2 in v2_preds.items():
    v1 = v1_preds.get(cid)
    if not v1:
        continue

    v1_alliance = v1.extra_data.get('predicted_winner_alliance') if v1.extra_data else v1.predicted_winner_party
    v2_alliance = v2.extra_data.get('predicted_winner_alliance') if v2.extra_data else v2.predicted_winner_party

    if v1_alliance != v2_alliance:
        changed_winner.append({
            'id': cid,
            'v1_alliance': v1_alliance,
            'v2_alliance': v2_alliance,
            'v1_margin': v1.predicted_margin_pct or 0,
            'v2_margin': v2.predicted_margin_pct or 0,
            'v1_confidence': v1.confidence_level,
            'v2_confidence': v2.confidence_level
        })
    else:
        same_winner.append(cid)

    # Track margin changes
    margin_diff = (v2.predicted_margin_pct or 0) - (v1.predicted_margin_pct or 0)
    if abs(margin_diff) > 1:
        margin_changes.append({
            'id': cid,
            'alliance': v2_alliance,
            'v1_margin': v1.predicted_margin_pct or 0,
            'v2_margin': v2.predicted_margin_pct or 0,
            'diff': margin_diff
        })

print(f"\n{'='*60}")
print("COMPARISON SUMMARY")
print(f"{'='*60}")
print(f"Winner CHANGED: {len(changed_winner)}")
print(f"Winner SAME: {len(same_winner)}")
print(f"Margin shifts >1%: {len(margin_changes)}")

if changed_winner:
    print(f"\n{'='*60}")
    print("WINNER CHANGES")
    print(f"{'='*60}")
    for c in changed_winner:
        print(f"  Constituency {c['id']}: {c['v1_alliance']} -> {c['v2_alliance']}")
        print(f"    Margin: {c['v1_margin']:.1f}% -> {c['v2_margin']:.1f}%")
        print(f"    Confidence: {c['v1_confidence']} -> {c['v2_confidence']}")
        print()

if margin_changes:
    print(f"\n{'='*60}")
    print("SIGNIFICANT MARGIN SHIFTS (>1%)")
    print(f"{'='*60}")
    # Sort by absolute change
    for c in sorted(margin_changes, key=lambda x: abs(x['diff']), reverse=True)[:15]:
        direction = "+" if c['diff'] > 0 else ""
        print(f"  ID {c['id']} ({c['alliance']}): {c['v1_margin']:.1f}% -> {c['v2_margin']:.1f}% ({direction}{c['diff']:.1f}%)")

# Alliance distribution
print(f"\n{'='*60}")
print("ALLIANCE DISTRIBUTION (V2)")
print(f"{'='*60}")
alliance_counts = {}
for p in v2_preds.values():
    alliance = p.extra_data.get('predicted_winner_alliance') if p.extra_data else p.predicted_winner_party
    alliance_counts[alliance] = alliance_counts.get(alliance, 0) + 1

for alliance, count in sorted(alliance_counts.items(), key=lambda x: -x[1]):
    print(f"  {alliance}: {count} seats")

db.close()
