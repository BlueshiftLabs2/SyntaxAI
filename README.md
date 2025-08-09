# SyntaxAI

An AI-powered coding companion that helps developers debug, optimize, and understand their code in real time. Paste in your code, and it instantly explains errors, suggests fixes, refactors for best practices, and breaks down complex logic into clear, beginner-friendly explanations—so you can spend less time stuck and more time building.

## What's included

- FastAPI backend that wraps a Hugging Face `transformers` pipeline (keeps your provided code intact).
- React + Vite frontend inspired by popular AI chat UIs (sleek, dark, glassy layout).
- Simple prompt-builder to steer the model for:
  - explain, debug, refactor, optimize, or auto
- Local dev with two commands, plus optional Docker.

## Quickstart (local)

1) Backend

```bash
cd server
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Optional: switch model or chat mode
# export MODEL_ID="openai/gpt-oss-120b"
# export USE_MESSAGES=0
# export FRONTEND_ORIGIN="http://localhost:5173"

uvicorn app:app --reload --port 8000
```

2) Frontend

```bash
cd web
npm install
# Optional: point to a different backend
# echo 'VITE_API_URL=http://localhost:8000/api/chat' > .env
npm run dev
```

- Visit `http://localhost:5173`. Paste code or ask a question. Choose a mode (left sidebar on desktop, or use bottom options on mobile).

## Docker (backend)

```bash
cd server
docker build -t syntaxai-backend .
docker run --rm -it -p 8000:8000 \
  -e MODEL_ID="openai/gpt-oss-120b" \
  -e USE_MESSAGES=0 \
  syntaxai-backend
```

## Notes on the model and pipeline

- This project preserves your requested pipeline snippet:

```python
from transformers import pipeline
import torch

model_id = "openai/gpt-oss-120b"

pipe = pipeline(
    "text-generation",
    model=model_id,
    torch_dtype="auto",
    device_map="auto",
)

messages = [
    {"role": "user", "content": "Explain quantum mechanics clearly and concisely."},
]

outputs = pipe(
    messages,
    max_new_tokens=256,
)
print(outputs[0]["generated_text"][-1])
```

- The backend supports both:
  - message-based calls (set `USE_MESSAGES=1`) for chat-tuned pipelines that accept `messages=[...]`
  - plain prompt strings (default) for standard `text-generation` models

If your chosen model echoes the prompt in its output, the API trims that echo.

## Environment variables

- `MODEL_ID` (default: `openai/gpt-oss-120b`)
- `USE_MESSAGES` (default: `0`). Set to `1` if your model requires `messages=[...]`.
- `FRONTEND_ORIGIN` (default: allows all origins). Set for stricter CORS in production.
- Frontend `.env`:
  - `VITE_API_URL` (default: `http://localhost:8000/api/chat`)

## Project structure

```
.
├─ server/                 # FastAPI + transformers backend
│  ├─ app.py
│  ├─ requirements.txt
│  └─ Dockerfile
├─ web/                    # Vite + React frontend
│  ├─ index.html
│  └─ src/
│     ├─ App.tsx
│     ├─ api.ts
│     ├─ main.tsx
│     └─ styles.css
└─ .gitignore
```

## Roadmap ideas

- Stream responses (SSE) for token-by-token updates
- Multi-file code context upload
- Per-language linting hooks (e.g., Ruff, ESLint) for augmented suggestions
- Auth and project history
