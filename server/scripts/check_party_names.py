"""Quick check of party names in database"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models.election import Election, ElectionResult

db = SessionLocal()

print('=' * 60)
print('CHECKING PARTY NAMES IN DATABASE')
print('=' * 60)

for year in [2011, 2016, 2021]:
    election = db.query(Election).filter(Election.year == year).first()

    admk_count = db.query(ElectionResult).filter(
        ElectionResult.election_id == election.id,
        ElectionResult.party == 'ADMK'
    ).count()

    aiadmk_count = db.query(ElectionResult).filter(
        ElectionResult.election_id == election.id,
        ElectionResult.party == 'AIADMK'
    ).count()

    print(f'\n{year}:')
    print(f'  ADMK: {admk_count} results')
    print(f'  AIADMK: {aiadmk_count} results')

# Test API query
print('\n' + '=' * 60)
print('TESTING API QUERIES')
print('=' * 60)

election_2021 = db.query(Election).filter(Election.year == 2021).first()

results_admk = db.query(ElectionResult).filter(
    ElectionResult.election_id == election_2021.id,
    ElectionResult.party == 'ADMK'
).limit(5).all()

results_aiadmk = db.query(ElectionResult).filter(
    ElectionResult.election_id == election_2021.id,
    ElectionResult.party == 'AIADMK'
).limit(5).all()

print(f'\n2021 Election (ID: {election_2021.id}):')
print(f'  ADMK results: {len(results_admk)}')
print(f'  AIADMK results: {len(results_aiadmk)}')

if results_aiadmk:
    print(f'\nSample AIADMK result:')
    r = results_aiadmk[0]
    print(f'  AC {r.ac_number} - {r.ac_name}')
    print(f'  Candidate: {r.candidate_name}')
    print(f'  Party: "{r.party}"')

db.close()
