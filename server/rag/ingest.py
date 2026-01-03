import os
import json
import chromadb
from sentence_transformers import SentenceTransformer

# -------------------------
# CONFIG
# -------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB_DIR = os.path.join(BASE_DIR, "kb")
DB_DIR = os.path.join(BASE_DIR, "rag", "chroma_db")

UI_ELEMENTS_FILE = os.path.join(KB_DIR, "ui_elements.json")
ROUTES_FILE = os.path.join(KB_DIR, "routes.json")
EXAMPLES_FILE = os.path.join(KB_DIR, "examples.md")

COLLECTION_NAME = "inclusikart_voice_kb"

# -------------------------
# LOAD EMBEDDING MODEL
# -------------------------
print("Loading embedding model...")
model = SentenceTransformer("all-MiniLM-L6-v2")

# -------------------------
# INIT CHROMA DB
# -------------------------
client = chromadb.PersistentClient(
    path=DB_DIR
)


collection = client.get_or_create_collection(
    name=COLLECTION_NAME
)

# -------------------------
# HELPER FUNCTIONS
# -------------------------
def add_document(doc_id, text, metadata):
    embedding = model.encode(text).tolist()
    collection.add(
        documents=[text],
        embeddings=[embedding],
        metadatas=[metadata],
        ids=[doc_id]
    )

# -------------------------
# INGEST UI ELEMENTS
# -------------------------
print("Ingesting ui_elements.json...")

with open(UI_ELEMENTS_FILE, "r", encoding="utf-8") as f:
    ui_elements = json.load(f)

for spoken_phrase, dom_id in ui_elements.items():
    text = f"UI action: {spoken_phrase}"
    metadata = {
        "type": "ui_element",
        "spoken_phrase": spoken_phrase,
        "target": dom_id
    }
    doc_id = f"ui_{spoken_phrase.replace(' ', '_')}"
    add_document(doc_id, text, metadata)

# -------------------------
# INGEST ROUTES
# -------------------------
print("Ingesting routes.json...")

with open(ROUTES_FILE, "r", encoding="utf-8") as f:
    routes = json.load(f)

for spoken_phrase, route_data in routes.items():
    text = f"Navigation command: {spoken_phrase}"
    metadata = {
        "type": "route",
        "spoken_phrase": spoken_phrase,
        "path": route_data["path"],
        "roles": ",".join(route_data["roles"])
    }

    doc_id = f"route_{spoken_phrase.replace(' ', '_')}"
    add_document(doc_id, text, metadata)

# -------------------------
# INGEST EXAMPLES
# -------------------------
print("Ingesting examples.md...")

with open(EXAMPLES_FILE, "r", encoding="utf-8") as f:
    content = f.read()

blocks = content.split("User:")
for i, block in enumerate(blocks):
    block = block.strip()
    if not block:
        continue

    text = f"Example interaction: User: {block}"
    metadata = {
        "type": "example"
    }
    doc_id = f"example_{i}"
    add_document(doc_id, text, metadata)

# -------------------------
# PERSIST DB
# -------------------------

print("✅ Knowledge base ingestion completed successfully!")
print(f"📦 Stored in ChromaDB at: {DB_DIR}")
