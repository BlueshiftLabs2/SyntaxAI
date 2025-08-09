import os
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- User-provided pipeline code (preserved) ---
from transformers import pipeline
import torch  # noqa: F401

model_id = os.getenv("MODEL_ID", "gpt2")  # Use lightweight gpt2 for demo

# Try to load the model, fallback to mock if it fails
try:
    pipe = pipeline(
        "text-generation",
        model=model_id,
        torch_dtype="auto",
        device_map="auto",
    )
    model_loaded = True
except Exception as e:
    print(f"Warning: Failed to load model '{model_id}': {e}")
    print("Using mock responses for demonstration")
    pipe = None
    model_loaded = False

# ------------------------------------------------

app = FastAPI(title="SyntaxAI API", version="0.1.0")

# CORS: allow local dev frontends by default; override with FRONTEND_ORIGIN
frontend_origin = os.getenv("FRONTEND_ORIGIN", "")
allow_origins = ["*"] if not frontend_origin else [frontend_origin]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    input: str  # User freeform input (can include pasted code)
    mode: str = "auto"  # one of: explain|debug|refactor|optimize|auto
    language: Optional[str] = None  # Optional language hint, e.g., "python", "js"


class ChatResponse(BaseModel):
    output: str


SYSTEM_PREFIX = """You are SyntaxAI, an AI-powered coding companion that helps developers debug, optimize, and understand their code in real time.
Follow the user's intent. If they paste code, infer the language and:
- Explain errors and their root cause
- Suggest precise fixes
- Refactor towards best practices
- Clarify complex logic in simple terms
Always show short, runnable code examples when helpful, and keep answers concise.
"""

MODE_HINTS = {
    "explain": "Explain what the code does and clarify complex parts in simple terms.",
    "debug": "Find likely bugs, explain why they occur, and propose concrete fixes.",
    "refactor": "Refactor to improve readability, maintainability, and best practices.",
    "optimize": "Optimize for performance and resource usage. Explain trade-offs.",
    "auto": "Infer the best combination of explanation, debugging, refactoring, and optimization.",
}


def build_prompt(user_input: str, mode: str = "auto", language: Optional[str] = None) -> str:
    mode_hint = MODE_HINTS.get(mode, MODE_HINTS["auto"])
    lang_line = f"Language hint: {language}\n" if language else ""
    return (
        f"{SYSTEM_PREFIX}\n"
        f"{lang_line}"
        f"Task: {mode_hint}\n\n"
        f"User input (may include code):\n"
        f"{user_input}\n\n"
        f"Respond with:\n"
        f"- A brief overview first\n"
        f"- Clear bullet points with fixes or refactors\n"
        f"- Short code snippets as needed\n"
    )


def run_generation(prompt: str, max_new_tokens: int = 512) -> str:
    """
    Runs the provided pipeline. Supports two modes:
    - message-based (USE_MESSAGES=1) for chat-tuned models that accept a messages array
    - plain prompt string for standard text-generation models
    """
    # If model failed to load, return mock response
    if not model_loaded:
        return """Here's a mock response from SyntaxAI:

This is a demo response showing the application is working! 

- ✅ Backend is running properly
- ✅ API endpoints are functional  
- ✅ Frontend-backend communication is working

In a real deployment, this would be replaced with actual AI-generated code analysis and suggestions.

```python
# Example: Here's how you might fix a common Python issue
def fixed_function():
    result = []
    for item in data:
        if item is not None:  # Added null check
            result.append(item.process())
    return result
```

The frontend UI should be displaying this response with proper markdown formatting."""

    use_messages = os.getenv("USE_MESSAGES", "0") == "1"

    if use_messages:
        messages = [{"role": "user", "content": prompt}]
        outputs = pipe(messages, max_new_tokens=max_new_tokens)
        gen = outputs[0].get("generated_text")
        # Some HF chat pipelines return a list history, others return a string.
        if isinstance(gen, list) and len(gen) > 0:
            last = gen[-1]
            if isinstance(last, dict) and "content" in last:
                return str(last["content"])
            return str(last)
        if isinstance(gen, str):
            return gen
        return str(gen)

    # Plain prompt mode (most text-generation pipelines)
    outputs = pipe(
        prompt,
        max_new_tokens=max_new_tokens,
        do_sample=True,
        temperature=0.2,
        top_p=0.9,
    )
    text = outputs[0].get("generated_text", "")
    # Some models echo the prompt; trim if duplicated
    if isinstance(text, str) and text.startswith(prompt):
        return text[len(prompt) :].lstrip()
    return text if isinstance(text, str) else str(text)


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    prompt = build_prompt(req.input, req.mode, req.language)
    output = run_generation(prompt)
    return ChatResponse(output=output)


@app.get("/healthz")
def healthz():
    return {"status": "ok"}