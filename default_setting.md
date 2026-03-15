# Baby App 기본 개발 환경 세팅

## 핵심 원칙
- MSA 구조: frontend / backend / db 각각 독립 컨테이너
- 각 컨테이너는 sleep infinity로 대기
- VSCode가 컨테이너 안으로 접속 후 터미널에서 직접 서버 실행

---

## 컨테이너 구조

| 컨테이너 | 이미지 | 포트 | 상태 |
|---------|--------|------|------|
| frontend | node:20 | 3000 | sleep infinity → VSCode 접속 후 npm run dev |
| backend | python:3.11-slim | 8000 | sleep infinity → VSCode 접속 후 uvicorn 실행 |
| db | postgres:16 | 5432 | 자동 실행 (건드리지 않음) |

---

## 파일 구조

```
baby-app/
├── .devcontainer/
│   ├── devcontainer.json     ← VSCode 접속 서비스 지정
│   └── docker-compose.yml    ← 전체 컨테이너 구성
├── frontend/
│   ├── Dockerfile            ← node:20 기반, sleep infinity
│   └── ...Next.js 코드
├── backend/
│   ├── Dockerfile            ← python:3.11-slim 기반, sleep infinity
│   └── ...FastAPI 코드
└── db/
    └── init.sql
```

---

## devcontainer.json 설정
- service: frontend (VSCode가 기본으로 접속하는 컨테이너)
- workspaceFolder: /app

## VSCode에서 backend 접속하는 법
Ctrl+Shift+P → "Dev Containers: Attach to Running Container" → backend 선택

---

## 컨테이너 실행 순서

1. Docker Desktop 실행 확인
2. VSCode에서 baby-app 폴더 열기
3. "Reopen in Container" 클릭
4. frontend 컨테이너 안에서 터미널 열고:
   ```bash
   npm run dev
   ```
5. backend 컨테이너 접속 후 터미널에서:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

---

## 주의사항
- AI는 이 구조를 임의로 변경하지 않는다
- sleep infinity → 서버 자동 실행으로 바꾸려면 개발자 승인 필요
- 컨테이너 추가 시 반드시 이 문서 업데이트
