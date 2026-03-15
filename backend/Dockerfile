FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# VSCode가 접속할 수 있도록 대기 상태 유지
# 서버 실행은 VSCode 터미널에서 직접: uvicorn main:app --reload --host 0.0.0.0 --port 8000
CMD ["sleep", "infinity"]
