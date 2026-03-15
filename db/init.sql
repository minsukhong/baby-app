-- baby-app 초기 데이터베이스 설정

-- users 테이블
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    hashed_password VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'user',  -- 'admin' | 'user'
    provider VARCHAR(20) NOT NULL DEFAULT 'local',  -- 'local' | 'google' | 'kakao'
    provider_id VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- admin 계정 시드 (비밀번호: crush.h → bcrypt 해시)
-- 해시값: bcrypt(crush.h, rounds=12)
INSERT INTO users (username, email, hashed_password, role, provider)
VALUES (
    'crush.h',
    'admin@babyapp.com',
    '$2b$12$vJxzKP/PilzwyCiEqmMQcujooRM4fyDJDkp1dabo/1ve7BVI5cDqa',
    'admin',
    'local'
)
ON CONFLICT (username) DO NOTHING;

-- profiles 테이블
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id),
    birth_status VARCHAR(20) NOT NULL,
    baby_date DATE NOT NULL,
    baby_count VARCHAR(20) NOT NULL,
    birth_order VARCHAR(20) NOT NULL,
    region VARCHAR(100) NOT NULL,
    job_status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
