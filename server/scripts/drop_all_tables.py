"""
Drop all existing database tables
"""
from app.database import engine, Base

def drop_all_tables():
    """Drop all tables"""
    print("Dropping all existing tables...")
    Base.metadata.drop_all(bind=engine)
    print("[OK] All tables dropped successfully!")

if __name__ == "__main__":
    drop_all_tables()
