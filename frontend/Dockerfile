FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# VSCode가 접속할 수 있도록 대기 상태 유지
# 서버 실행은 VSCode 터미널에서 직접: npm run dev
CMD ["sleep", "infinity"]
