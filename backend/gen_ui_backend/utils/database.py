# database.py
from sqlmodel import create_engine, Session
import os

DATABASE_URL = f"postgresql://{os.environ.get('DB_USER')}:{os.environ.get('DB_PASSWORD')}@{os.environ.get('DB_HOST')}:6543/postgres"

engine = create_engine(DATABASE_URL)


def get_session():
    with Session(engine) as session:
        yield session
