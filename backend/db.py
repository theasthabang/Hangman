"""
A minimal Postgres connection helper. No ORM here on purpose —
this project only ever needs two simple queries (upsert stats,
read leaderboard), so raw SQL via psycopg2 is simpler than pulling
in SQLAlchemy for two queries.
"""

import os

import psycopg2

DATABASE_URL = os.getenv("DATABASE_URL", "")


def get_connection():
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is not set. Copy your Postgres connection "
            "string from the Render dashboard into your environment "
            "variables."
        )
    return psycopg2.connect(DATABASE_URL)


def ensure_schema():
    """
    Creates the stats table if it doesn't already exist. Safe to call
    every time the app starts — CREATE TABLE IF NOT EXISTS is a no-op
    once the table is already there.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                create table if not exists stats (
                    user_id text primary key,
                    username text not null,
                    games_played int not null default 0,
                    games_won int not null default 0,
                    current_streak int not null default 0,
                    best_streak int not null default 0,
                    updated_at timestamptz not null default now()
                )
                """
            )
        conn.commit()
    finally:
        conn.close()