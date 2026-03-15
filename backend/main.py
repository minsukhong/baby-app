import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, profile

app = FastAPI(title="아기 케어 앱 API")

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profile.router)


@app.get("/")
def root():
    return {"message": "아기 케어 앱 API 정상 실행 중"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/db-test")
def db_test():
    try:
        from database import engine
        with engine.connect() as conn:
            from sqlalchemy import text
            result = conn.execute(text("SELECT COUNT(*) FROM users"))
            count = result.scalar()
            return {"status": "ok", "users_count": count}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
