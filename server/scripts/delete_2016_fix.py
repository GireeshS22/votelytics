"""Delete 2016 election data to reload with corrected script"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models.election import Election, ElectionResult

db = SessionLocal()

try:
    election_2016 = db.query(Election).filter(Election.year == 2016).first()

    if election_2016:
        # Delete all results first
        results_deleted = db.query(ElectionResult).filter(
            ElectionResult.election_id == election_2016.id
        ).delete()

        # Delete election record
        db.delete(election_2016)
        db.commit()

        print(f'[OK] Deleted {results_deleted} results and 1 election record for 2016')
    else:
        print('No 2016 election found')
finally:
    db.close()
