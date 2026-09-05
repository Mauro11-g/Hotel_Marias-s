FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y \
    build-essential \
    default-libmysqlclient-dev \
    pkg-config \
    git \
    && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "backend.wsgi:application"]