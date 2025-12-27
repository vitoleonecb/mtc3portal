import os
import random
import time
import requests
from dotenv import load_dotenv
from utils.auth import login
from openai import OpenAI

# Load environment variables
load_dotenv()

# CONFIG
workshop_id = 2
module_id = 56
pid = 61

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
        response = client.responses.create(
            model="gpt-4.1-mini",
            input=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_output_tokens=250,
            temperature=0.8,
        )

        text = response.output_text.strip()

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

    response = client.responses.create(
        model="gpt-4.1-mini",
        input=input_blocks,
        max_output_tokens=90,
        temperature=1.1,
    )

    return response.output_text.strip()

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
        items = opts.get("options", [])
        final = []

        total = max(len(items) - 1, 1)

        for idx, item in enumerate(items):
            label = item.get("optionName", f"Item {idx + 1}")

            # vertical ordering with light randomness
            y = (idx / total) + random.uniform(-0.03, 0.03)
            y = min(max(y, 0), 1)

            # mostly centered x with jitter
            x = 0.5 + random.uniform(-0.05, 0.05)
            x = min(max(x, 0), 1)

            final.append({
                "index": idx,
                "label": label,
                "keyName": f"{label.lower().replace(' ', '-')}-{idx}",
                "position": {
                    "x": round(x, 3),
                    "y": round(y, 3)
                },
                "display": {
                    "xPct": round(x * 100, 1),
                    "yPct": round(y * 100, 1)
                }
            })

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

for user in usersList:
    response = requests.post(
        f"{API_BASE}/workshops/{workshop_id}/modules/{module_id}/prompts/{pid}/automated",
        json={ 
            "workshop_response_content": generate_response(prompt), 
            "user_id": user['user_id'] 
        },
        headers=AUTH
    )

    print(response.text)
    print(response.status_code)
    time.sleep(2)

