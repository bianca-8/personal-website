from google import genai
from supabase import create_client
import json
import os
import time
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
client = genai.Client(api_key=GEMINI_API_KEY)

# discord
def embed(text):
    response = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text
    )
    return response.embeddings[0].values

base_path = "discord/Messages"
channel_folder = os.listdir(base_path)[0]
file_path = os.path.join(base_path, channel_folder, "messages.json")

with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

discord_messages = [
    m["Contents"].strip()
    for m in data
    if m.get("Contents") and m["Contents"].strip() != ""
]

# instagram
import os
from bs4 import BeautifulSoup

def parse_instagram_folder(base_path):
    all_messages = []

    inbox_path = os.path.join(
        base_path,
        "your_instagram_activity",
        "messages",
        "inbox"
    )

    for conversation in os.listdir(inbox_path):
        convo_path = os.path.join(inbox_path, conversation)

        if os.path.isdir(convo_path):
            for file in os.listdir(convo_path):
                if file.startswith("message_") and file.endswith(".html"):
                    file_path = os.path.join(convo_path, file)

                    with open(file_path, "r", encoding="utf-8") as f:
                        soup = BeautifulSoup(f, "html.parser")

                    message_blocks = soup.find_all("div", class_="_a6-p")

                    for block in message_blocks:
                        text = block.get_text(strip=True)

                        if text and "Liked a message" not in text:
                            all_messages.append(text)

    return all_messages

instagram_messages = parse_instagram_folder("instagram")

all_messages = discord_messages + instagram_messages

# chunk
chunks = []
for i in range(0, len(all_messages), 25):
    chunks.append(" ".join(all_messages[i:i+25]))

for chunk in chunks:
    embedding = embed(chunk)
    supabase.table("messages").insert({
        "content": chunk,
        "embedding": embedding
    }).execute()
    time.sleep(1) # avoid rate limit

print("Done.")