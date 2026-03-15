FROM node:20-slim

# Python 설치
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# pip, python 명령어 설정
RUN ln -sf /usr/bin/python3 /usr/local/bin/python
RUN python3 -m pip install --upgrade pip --break-system-packages

WORKDIR /workspace
