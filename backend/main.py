from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="아기 케어 앱 API")

# 프론트엔드(Next.js)에서 요청 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "아기 케어 앱 API 정상 실행 중"}

@app.get("/health")
def health():
    return {"status": "ok"}
