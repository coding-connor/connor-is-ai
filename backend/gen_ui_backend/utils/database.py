# database.py
from sqlmodel import create_engine, Session
import os

DATABASE_URL = f"postgresql://postgres.nltyxnhugyvgzoqypewh:{os.environ.get('DB_PASSWORD')}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

engine = create_engine(DATABASE_URL)


def get_session():
    with Session(engine) as session:
        yield session
