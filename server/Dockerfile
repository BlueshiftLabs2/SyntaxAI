# GPU-friendly runtime base (optional). Swap to python:3.11-slim if CPU-only.
FROM pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Configure model via env at runtime if needed:
# ENV MODEL_ID=openai/gpt-oss-120b
# ENV USE_MESSAGES=0
# ENV FRONTEND_ORIGIN=http://localhost:5173

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]