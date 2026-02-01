import os
import random
import time
import datetime
import requests
from dotenv import load_dotenv
from utils.auth import login
try:
    from openai import OpenAI
except ImportError:
    # Fallback for older openai versions if necessary, 
    # but the code below uses the new client-based API.
    # It's better to upgrade: pip install --upgrade openai
    import openai
    class OpenAI:
        def __init__(self, api_key):
            openai.api_key = api_key
            self.chat = self.Chat()
        class Chat:
            def __init__(self):
                self.completions = self.Completions()
            class Completions:
                def create(self, **kwargs):
                    return openai.ChatCompletion.create(**kwargs)

# Load environment variables
load_dotenv()

# CONFIG
workshop_id = 2
module_id = 67
pid = 81

API_BASE = os.getenv("API_BASE")
EMAIL = os.getenv("EMAIL")
PASSWORD = os.getenv("PASSWORD")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_API_KEY)

# ---- SINGLE LOGIN FOR ENTIRE SCRIPT ----
token = login(EMAIL, PASSWORD)

# ---- SINGLE AUTH DICT USED EVERYWHERE ----
AUTH = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

print("\n🟦 USING AUTH HEADERS:\n", AUTH)

# ---- REQUESTS USING SAME TOKEN ----
promptsListResponse = requests.get(
    f"{API_BASE}/workshops/{workshop_id}/modules/{module_id}/prompts",
    headers=AUTH
)

usersListResponse = requests.get(
    f"{API_BASE}/users/list",
    headers=AUTH
)

# ---- DEBUG PRINTS ----
print("\nUsers List Status:", usersListResponse.status_code)
print("Users List Body:", usersListResponse.text)

print("\nPrompts Status:", promptsListResponse.status_code)
print("Prompts Body:", promptsListResponse.text)

# ---- PARSE JSON ----
usersList = usersListResponse.json()
prompts = promptsListResponse.json()

prompt = next(
    (p for p in prompts if p['workshop_prompt_id'] == pid),
    None
)

PERSONA_OPTIONS = [
    "Write as a performer reacting to how this would feel in the body.",
    "Write as a director thinking about pacing and clarity.",
    "Write as a dramaturg focused on structure and repetition.",
    "Write as a collaborator excited by roughness and early drafts.",
    "Write as a skeptic questioning whether the idea is landing yet.",
    "Write as someone noticing rhythm, silence, and momentum.",
    "Write as someone focused on audience experience.",
    "Write as a technical-minded collaborator noticing systems and process.",
]

def generate_short_answers(prompt):
    questions = prompt.get("workshop_prompt_options", {}).get("questions", [])

    if not questions:
        return []

    system_prompt = (
        "You are responding to a set of short-answer questions in a creative writing "
        "or storytelling workshop context. The questions are shown together and are "
        "likely related. Respond as a thoughtful human participant, not an instructor."
    )

    # Build a single combined prompt so the model understands the relationship
    question_block = "\n".join(
        [f"{i+1}. {q['questionText']}" for i, q in enumerate(questions)]
    )

    user_prompt = (
        "Respond to the following questions. "
        "Treat them as related parts of the same moment or idea. "
        "Answer each question clearly and separately, but keep them consistent.\n\n"
        f"{question_block}"
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=250,
            temperature=0.8,
        )

        text = response.choices[0].message.content.strip()

        # Fallback safety
        if not text:
            return [
                {"answer": "—", "questionText": q["questionText"]}
                for q in questions
            ]

        # Split answers heuristically (by numbered list or line breaks)
        raw_answers = [
            line.strip()
            for line in text.split("\n")
            if line.strip()
        ]

        final = []
        for idx, q in enumerate(questions):
            answer = raw_answers[idx] if idx < len(raw_answers) else raw_answers[-1]
            final.append({
                "answer": answer,
                "questionText": q["questionText"]
            })

        return final

    except Exception as e:
        print("⚠️ OpenAI error:", e)
        return [
            {"answer": "—", "questionText": q["questionText"]}
            for q in questions
        ]

def generate_notation(prompt):
    reference = prompt.get("workshop_prompt_reference")
    persona = random.choice(PERSONA_OPTIONS)

    system_prompt = (
        "You are responding to creative reference material in an experimental theater and performance context.\n"
        "You may respond in whatever form feels most alive or useful.\n"
        "You may offer a concise observation.\n"
        "You may offer a creative summary.\n"
        "You may offer a recollection or anecdote.\n"
        "You may offer an alternative phrasing or rewrite.\n"
        "You may offer a speculative idea or provocation.\n"
        "You may shift genre, remix, or transform the material.\n"
        "You may respond with a fragment, phrase, or gesture in text.\n"
        "You may reflect on tension, rhythm, structure, or meaning.\n"
        "You do not need to explain your response.\n"
        "You do not need to be neutral or comprehensive.\n"
        "You may be brief or detailed, grounded or associative.\n"
        "Respond as a thoughtful human inside a creative process, not as an instructor or analyst."
    )

    user_prompt = (
        "Offer a response to the reference text below. "
        "You might react to its tone, rhythm, structure, clarity, tension, or underlying ideas.\n\n"
        "Follow what feels most alive or necessary in the material.\n\n"
        f"{persona}"
    )

    input_blocks = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    if reference:
        input_blocks.append({
            "role": "user",
            "content": f"REFERENCE TEXT:\n{reference}"
        })

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=input_blocks,
        max_tokens=90,
        temperature=1.1,
    )

    return response.choices[0].message.content.strip()

def generate_response(prompt):
    t = prompt["prompt_template_id"]
    opts = prompt.get("workshop_prompt_options")

    # -----------------------------
    # TEMPLATE 1 — MULTIPLE CHOICE
    # -----------------------------
    # workshop_prompt_options:
    # {"multipleChoicePrompts": [{ "options": [...], "questionText": "..."}]}
    #
    # response:
    # [{"optionId": 0, "optionLabel": "text", "questionText": "..."}]
    if t == 1:
        mc_list = opts.get("multipleChoicePrompts", [])
        final = []
        for q in mc_list:
            options = q["options"]
            pick_index = random.randint(0, len(options) - 1)
            final.append({
                "optionId": pick_index,
                "optionLabel": options[pick_index],
                "questionText": q["questionText"]
            })
        return final

    # -----------------------------
    # TEMPLATE 3 — CHECKLIST
    # (your original logic)
    # -----------------------------
    if t == 3:
        check_items = opts.get("checkListPrompts", [])
        final = []
        for q in check_items:
            options = q["options"]
            picks = [random.choice([True, False]) for _ in options]
            final.append({
                "questionText": q["questionText"],
                "options": [
                    {"optionText": opt, "selected": picks[i]}
                    for i, opt in enumerate(options)
                ]
            })
        return final

    # -----------------------------
    # TEMPLATE 4 — TEXT ANSWERS
    # -----------------------------
    # workshop_prompt_options:
    # {"questions":[ {"questionText": "..."} , ...]}
    #
    # response:
    # [{"answer":"...", "questionText":"..."}]
    if t == 4:
        return generate_short_answers(prompt)

    if t == 6:
        # Drag-and-drop: honor layout (free / x-spectrum / grid-zones) and emit
        # normalized positions plus semantics for analytics.
        opts = opts or {}
        layout = opts.get("layout", "free")
        grid = opts.get("grid") or {}
        items = opts.get("options", [])
        final = []

        # Precompute grid metadata if present
        rows = max(int(grid.get("rows") or 0), 0) if isinstance(grid, dict) else 0
        cols = max(int(grid.get("cols") or 0), 0) if isinstance(grid, dict) else 0

        for idx, item in enumerate(items):
            label = item.get("optionName", f"Item {idx + 1}")
            # Prefer stable optionKey from editor if present; otherwise fall back to slug
            key_name = item.get("optionKey") or f"{label.lower().replace(' ', '-')}-{idx}"

            semantics = {}

            if layout == "x-spectrum":
                # One-dimensional spectrum: lock Y at center and spread X across [0,1]
                x = random.random()
                y = 0.5
                semantics["scoreX"] = round(x, 3)

            elif layout == "grid-zones" and rows > 0 and cols > 0:
                # Choose a random cell and place handle within that zone
                r = random.randint(1, rows)
                c = random.randint(1, cols)

                row_height = 1.0 / rows
                col_width = 1.0 / cols

                x_min = (c - 1) * col_width
                x_max = c * col_width
                y_min = (r - 1) * row_height
                y_max = r * row_height

                x = random.uniform(x_min, x_max)
                y = random.uniform(y_min, y_max)

                zone_id = f"r{r}c{c}"
                zone_label = None
                labels = grid.get("labels") if isinstance(grid, dict) else None
                if isinstance(labels, list) and 1 <= r <= len(labels):
                    row_labels = labels[r - 1]
                    if isinstance(row_labels, list) and 1 <= c <= len(row_labels):
                        zone_label = row_labels[c - 1]
                if not zone_label:
                    zone_label = f"R{r}C{c}"

                semantics.update({
                    "zoneId": zone_id,
                    "zoneLabel": zone_label,
                    "rowIndex": r - 1,
                    "colIndex": c - 1,
                })

            else:
                # Free layout: simple 2D scatter in [0,1] x [0,1]
                x = random.random()
                y = random.random()

            pos = {
                "x": round(x, 3),
                "y": round(y, 3),
            }
            display = {
                "xPct": round(x * 100, 1),
                "yPct": round(y * 100, 1),
            }

            entry = {
                "index": idx,
                "keyName": key_name,
                "position": pos,
                "display": display,
            }

            if label:
                entry["label"] = label
            if semantics:
                entry["semantics"] = semantics

            final.append(entry)

        return final

    # -----------------------------
    # TEMPLATE 7 — RATING
    # -----------------------------
    # workshop_prompt_options: NULL
    #
    # response: {"rating": "3"}
    if t == 7:
        return {"rating": str(random.randint(1, 5))}

    # -----------------------------
    # TEMPLATE 8 — FREE-TEXT / NOTATION
    # -----------------------------
    # workshop_prompt_options: NULL
    #
    # response: {"notationResponse": "some text"}
    if t == 8:
        return {
            "notationResponse": generate_notation(prompt)
        }

    # -----------------------------
    # TEMPLATE 9 — DROPDOWN
    # -----------------------------
    # workshop_prompt_options:
    # {"dropDownPrompts":[{"options":[...], "questionText":"..."}]}
    #
    # response:
    # [{"answer":"Meditative", "optionId": 1, "optionLabel":"Meditative", "questionText":"..."}]
    if t == 9:
        dd = opts.get("dropDownPrompts", [])
        final = []
        for q in dd:
            options = q["options"]
            idx = random.randint(0, len(options) - 1)
            final.append({
                "answer": options[idx],
                "optionId": idx,
                "optionLabel": options[idx],
                "questionText": q["questionText"]
            })
        return final

    # DEFAULT
    return {}


# --- SEEDING WINDOW CONFIG -------------------------------------------------
# We want exactly 5 days on the X axis for seeded analytics. Configure that
# window here. For example: Aug 23–27 inclusive.
SEED_YEAR = 2024
SEED_MONTH = 8
SEED_START_DAY = 23
SEED_DAYS = 5  # number of distinct calendar days to cover


def random_timestamp_for_day(year: int, month: int, day: int) -> str:
    """Return a random timestamp within a single calendar day."""
    start = datetime.datetime(year, month, day, 0, 0, 0)
    end = datetime.datetime(year, month, day, 23, 59, 59)
    total_seconds = int((end - start).total_seconds())
    offset = random.randint(0, total_seconds)
    ts = start + datetime.timedelta(seconds=offset)
    return ts.strftime("%Y-%m-%d %H:%M:%S")


# Precompute one random timestamp per seed day so we can guarantee
# coverage (at least one response per day on the X axis).
SEED_DAY_TIMESTAMPS = [
    random_timestamp_for_day(SEED_YEAR, SEED_MONTH, SEED_START_DAY + i)
    for i in range(SEED_DAYS)
]


for idx, user in enumerate(usersList):
    # Ensure the first SEED_DAYS users each claim a distinct day so the
    # chart always has at least one response on every day in the window.
    if idx < SEED_DAYS:
        created_at = SEED_DAY_TIMESTAMPS[idx]
    else:
        # Remaining users are evenly/randomly distributed across the same
        # 5-day window so counts vary but coverage stays fixed.
        created_at = random.choice(SEED_DAY_TIMESTAMPS)

    response = requests.post(
        f"{API_BASE}/workshops/{workshop_id}/modules/{module_id}/prompts/{pid}/automated",
        json={
            "workshop_response_content": generate_response(prompt),
            "user_id": user["user_id"],
            "testing": True,
            "workshop_response_created": created_at,
        },
        headers=AUTH,
    )

    print(created_at, response.status_code, response.text)
    time.sleep(2)
