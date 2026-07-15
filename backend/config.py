"""
config.py — Supabase client initialization.
Reads credentials from the .env file.
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

supabase: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"WARNING: Failed to initialize Supabase client: {e}")
        print("   Please check your SUPABASE_URL and SUPABASE_SERVICE_KEY in .env")
        supabase = None
