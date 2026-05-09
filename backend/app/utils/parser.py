import json
import re

def safe_parse_json(raw_text: str):
    try:
        return json.loads(raw_text)
    except:
        match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if match:
            return json.loads(match.group())
    return {}