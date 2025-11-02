"""
Check existing constituencies in database
"""
from app.database import SessionLocal
from app.models.constituency import Constituency

db = SessionLocal()
constituencies = db.query(Constituency).all()

print(f'Existing constituencies in database: {len(constituencies)}\n')
for c in constituencies:
    print(f'  - {c.name} (Code: {c.code}, District: {c.district})')

db.close()
