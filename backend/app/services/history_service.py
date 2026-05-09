from app.core.database import supabase
import json

def save_history(abstract: str, analysis: dict):
    supabase.table("history").insert({
        "abstract": str(abstract),
        "analysis": json.loads(json.dumps(analysis))  # sanitize JSON
    }).execute()


def get_history():
    response = supabase.table("history") \
        .select("*") \
        .order("created_at", desc=True) \
        .execute()

    return response.data