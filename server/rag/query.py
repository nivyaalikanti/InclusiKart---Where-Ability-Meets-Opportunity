import os
import json
import chromadb
from sentence_transformers import SentenceTransformer
import sys
import re

# -------------------------
# CONFIG
# -------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_DIR = os.path.join(BASE_DIR, "rag", "chroma_db")
KB_DIR = os.path.join(BASE_DIR, "kb")
PROMPT_DIR = os.path.join(BASE_DIR, "prompts")

COLLECTION_NAME = "inclusikart_voice_kb"
SYSTEM_PROMPT_FILE = os.path.join(PROMPT_DIR, "system_prompt.txt")

# -------------------------
# LOAD MODEL
# -------------------------
model = SentenceTransformer("all-MiniLM-L6-v2")

# -------------------------
# LOAD CHROMA DB
# -------------------------
client = chromadb.PersistentClient(path=DB_DIR)
collection = client.get_collection(name=COLLECTION_NAME)

# -------------------------
# LOAD SYSTEM PROMPT
# -------------------------
with open(SYSTEM_PROMPT_FILE, "r", encoding="utf-8") as f:
    SYSTEM_PROMPT = f.read()

# -------------------------
# LOAD UI ELEMENTS MAP (for direct input parsing)
# -------------------------
UI_ELEMENTS_FILE = os.path.join(KB_DIR, "ui_elements.json")
try:
    with open(UI_ELEMENTS_FILE, "r", encoding="utf-8") as f:
        UI_ELEMENTS_MAP = json.load(f)
except Exception:
    UI_ELEMENTS_MAP = {}

# create a normalized lookup for quick matching
UI_ELEMENTS_KEYS_NORMALIZED = {" ".join(k.lower().split()): v for k, v in UI_ELEMENTS_MAP.items()}

# -------------------------
# HELPER: CLEAN SPOKEN TEXT
# -------------------------
def normalize_spoken_text(text: str) -> str:
    text = text.lower()
    text = text.replace(" at the rate ", "@")
    text = text.replace(" dot ", ".")
    text = text.replace(" underscore ", "_")
    text = text.replace(" dash ", "-")
    return text.strip()

# -------------------------
# CORE QUERY FUNCTION
# -------------------------
def process_voice_command(user_command: str, user_role: str = "guest"):
    """
    Input:
      - user_command: text from voice input
      - user_role: guest | buyer | seller | admin | ngo

    Output:
      - Action JSON (dict)
    """

    command = normalize_spoken_text(user_command)

    # =========================
    # 1️⃣ INPUT HANDLING (NEW)
    # =========================
    if command.startswith("enter ") or command.startswith("type "):
        # Improved parsing: try to match multi-word field names against known UI elements.
        words = command.split()
        # remove the leading verb (enter/type)
        if len(words) < 3:
            return {"type": "error", "message": "Invalid input command"}

        tokens = words[1:]

        # Greedy match: try longest possible field name from tokens against UI_ELEMENTS_KEYS_NORMALIZED
        field_target = None
        field_name = None
        for i in range(len(tokens) - 1, 0, -1):
            candidate = " ".join(tokens[:i]).lower()
            candidate_norm = " ".join(candidate.split())
            if candidate_norm in UI_ELEMENTS_KEYS_NORMALIZED:
                field_name = candidate_norm
                field_target = UI_ELEMENTS_KEYS_NORMALIZED[candidate_norm]
                value = " ".join(tokens[i:])
                break

        # If no multi-word match found, fall back to single-word field (old behavior)
        if field_target is None:
            # use first token as field, rest as value
            field_name = tokens[0].lower()
            value = " ".join(tokens[1:])
            # see if this single token matches any UI key
            if field_name in UI_ELEMENTS_KEYS_NORMALIZED:
                field_target = UI_ELEMENTS_KEYS_NORMALIZED[field_name]

        # sanitize value: strip leading hyphens or punctuation from spoken patterns like "- 123456"
        value = value.strip(" -:,") if isinstance(value, str) else value

        target = field_target if field_target is not None else field_name

        return {
            "type": "input",
            "target": target,
            "value": value
        }

    # =========================
    # 2️⃣ EMBEDDING + RETRIEVAL
    # =========================
    query_embedding = model.encode(command).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=3
    )

    metadatas = results.get("metadatas", [[]])[0]

    if not metadatas:
        return {
            "type": "error",
            "message": "Action not supported"
        }

    best_match = metadatas[0]

    # =========================
    # 3️⃣ ROUTE HANDLING
    # =========================
    if best_match.get("type") == "route":
        allowed_roles = best_match.get("roles", "").split(",")

        if user_role not in allowed_roles:
            return {
                "type": "error",
                "message": "Access denied"
            }

        return {
            "type": "navigate",
            "target": best_match.get("path")
        }

    # =========================
    # 4️⃣ UI ELEMENT HANDLING
    # =========================
    if best_match.get("type") == "ui_element":
        return {
            "type": "click",
            "target": best_match.get("target")
        }

    # =========================
    # 5️⃣ FALLBACK
    # =========================
    return {
        "type": "error",
        "message": "Please be more specific"
    }


# -------------------------
# CLI TEST SUPPORT
# -------------------------
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({
            "type": "error",
            "message": "Invalid input"
        }))
        sys.exit(0)

    command = sys.argv[1]
    role = sys.argv[2]

    result = process_voice_command(command, role)
    print(json.dumps(result))
