"""
Load GeoJSON boundary data into constituencies table
"""
import sys
import json
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models.constituency import Constituency


def load_geojson_to_db():
    """Load GeoJSON data into database"""

    print("=" * 80)
    print("LOADING GEOJSON BOUNDARIES INTO DATABASE")
    print("=" * 80)

    # Load GeoJSON file
    print("\n[1/4] Loading GeoJSON file...")
    with open('data/tn_ac_2021.geojson') as f:
        geojson_data = json.load(f)

    print(f"  Loaded {len(geojson_data['features'])} constituency boundaries")

    # Create mapping by AC_NO
    print("\n[2/4] Creating AC number to GeoJSON mapping...")
    geojson_by_ac = {}
    for feature in geojson_data['features']:
        ac_no = feature['properties']['AC_NO']
        geojson_by_ac[ac_no] = feature

    print(f"  Mapped {len(geojson_by_ac)} constituencies")

    # Update database
    print("\n[3/4] Updating constituencies in database...")
    db = SessionLocal()

    try:
        constituencies = db.query(Constituency).all()
        updated_count = 0
        unmatched = []

        for constituency in constituencies:
            ac_no = constituency.ac_number

            if ac_no in geojson_by_ac:
                feature = geojson_by_ac[ac_no]

                # Update geojson field with the full feature
                constituency.geojson = feature

                # Update district if not set
                if not constituency.district or constituency.district == "Unknown":
                    constituency.district = feature['properties'].get('DIST_NAME', 'Unknown')

                updated_count += 1
            else:
                unmatched.append(f"AC {ac_no}: {constituency.name}")

        db.commit()

        print(f"  Updated {updated_count} constituencies with GeoJSON boundaries")

        if unmatched:
            print(f"\n  WARNING: {len(unmatched)} constituencies could not be matched:")
            for item in unmatched:
                print(f"    - {item}")

        # Verification
        print("\n[4/4] Verification...")
        with_geojson = db.query(Constituency).filter(Constituency.geojson.isnot(None)).count()
        total = db.query(Constituency).count()

        print(f"  Constituencies with GeoJSON: {with_geojson}/{total}")
        print(f"  Coverage: {with_geojson/total*100:.1f}%")

        print("\n" + "=" * 80)
        print("[SUCCESS] GeoJSON boundaries loaded successfully!")
        print("=" * 80)

    except Exception as e:
        print(f"\n[ERROR] Failed to load GeoJSON: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    load_geojson_to_db()
