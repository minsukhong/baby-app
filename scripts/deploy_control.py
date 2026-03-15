"""
baby-app 배포 제어 스크립트
Vercel / Railway / Supabase API 직접 제어

사용법:
  python scripts/deploy_control.py status       # 전체 상태 확인
  python scripts/deploy_control.py redeploy     # Railway 재배포
  python scripts/deploy_control.py logs         # Railway 최근 로그
  python scripts/deploy_control.py env          # Railway 환경변수 목록
  python scripts/deploy_control.py db <sql>     # Supabase SQL 실행
  python scripts/deploy_control.py login_test   # 로그인 동작 테스트
"""

import sys
import json
import ssl
import urllib.request
import urllib.error

# ── 토큰 설정 ─────────────────────────────────────────────────────────────────
# 실제 토큰은 환경변수로 관리하거나 .env 파일에서 로드
import os
from pathlib import Path

def load_tokens():
    env_file = Path(__file__).parent.parent / '.env.deploy'
    tokens = {}
    if env_file.exists():
        for line in env_file.read_text(encoding='utf-8').splitlines():
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                tokens[k.strip()] = v.strip()
    # 환경변수 우선
    tokens['SUPABASE_TOKEN'] = os.environ.get('SUPABASE_TOKEN', tokens.get('SUPABASE_TOKEN', ''))
    tokens['VERCEL_TOKEN'] = os.environ.get('VERCEL_TOKEN', tokens.get('VERCEL_TOKEN', ''))
    tokens['RAILWAY_TOKEN'] = os.environ.get('RAILWAY_TOKEN', tokens.get('RAILWAY_TOKEN', ''))
    return tokens

# ── Railway 상수 ───────────────────────────────────────────────────────────────
RAILWAY_PROJECT_ID  = '0c4f2f41-1e4c-437a-b38d-07c01f17c29e'
RAILWAY_SERVICE_ID  = '1567166a-c2da-4844-aedf-104bb63f407b'
RAILWAY_ENV_ID      = '158370c4-cfb1-4a34-afb5-7fbcba5c391d'

# ── Vercel 상수 ────────────────────────────────────────────────────────────────
VERCEL_PROJECT_ID   = 'prj_eewBhBOizB33cJJifL6FjYrkVgB2'

# ── Supabase 상수 ──────────────────────────────────────────────────────────────
SUPABASE_PROJECT_REF = 'rgcfofduvijaovwijszy'

RAILWAY_BACKEND_URL = 'https://baby-app-production.up.railway.app'
VERCEL_FRONTEND_URL = 'https://baby-app-delta.vercel.app'

ctx = ssl.create_default_context()

# ── HTTP 헬퍼 ─────────────────────────────────────────────────────────────────
def http_get(url, token, service='supabase'):
    agents = {
        'supabase': 'supabase-cli/1.0',
        'vercel': 'vercel-cli/1.0',
        'railway': 'railway-cli/3.14.3',
    }
    req = urllib.request.Request(url, headers={
        'Authorization': f'Bearer {token}',
        'User-Agent': agents.get(service, 'cli/1.0'),
        'Accept': 'application/json',
    })
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        return json.loads(resp.read().decode())

def http_post(url, token, body, service='supabase'):
    agents = {
        'supabase': 'supabase-cli/1.0',
        'vercel': 'vercel-cli/1.0',
        'railway': 'railway-cli/3.14.3',
    }
    data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'User-Agent': agents.get(service, 'cli/1.0'),
        'Accept': 'application/json',
    }, method='POST')
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        return json.loads(resp.read().decode())

def railway_graphql(token, query, variables=None):
    payload = {'query': query}
    if variables:
        payload['variables'] = variables
    return http_post('https://backboard.railway.app/graphql/v2', token, payload, service='railway')

def supabase_sql(token, sql):
    return http_post(
        f'https://api.supabase.com/v1/projects/{SUPABASE_PROJECT_REF}/database/query',
        token, {'query': sql}, service='supabase'
    )

# ── 명령 함수들 ───────────────────────────────────────────────────────────────
def cmd_status(tokens):
    print('=== baby-app 배포 상태 ===\n')

    # Backend health
    try:
        req = urllib.request.Request(f'{RAILWAY_BACKEND_URL}/health',
                                      headers={'User-Agent': 'test/1.0'})
        with urllib.request.urlopen(req, context=ctx, timeout=10) as r:
            print(f'[Railway Backend] [OK] {r.status} - {r.read().decode()}')
    except Exception as e:
        print(f'[Railway Backend] [ERR] {e}')

    # Frontend check
    try:
        req = urllib.request.Request(VERCEL_FRONTEND_URL,
                                      headers={'User-Agent': 'test/1.0'})
        with urllib.request.urlopen(req, context=ctx, timeout=10) as r:
            print(f'[Vercel Frontend] [OK] {r.status} OK')
    except Exception as e:
        print(f'[Vercel Frontend] [ERR] {e}')

    # Supabase users count
    try:
        rows = supabase_sql(tokens['SUPABASE_TOKEN'], 'SELECT COUNT(*) as cnt FROM users;')
        print(f'[Supabase DB]     [OK] users 테이블: {rows[0]["cnt"]}명')
    except Exception as e:
        print(f'[Supabase DB]     [ERR] {e}')


def cmd_redeploy(tokens):
    result = railway_graphql(tokens['RAILWAY_TOKEN'], '''
        mutation ServiceInstanceRedeploy($serviceId: String!, $environmentId: String!) {
          serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId)
        }
    ''', {'serviceId': RAILWAY_SERVICE_ID, 'environmentId': RAILWAY_ENV_ID})
    if result.get('data', {}).get('serviceInstanceRedeploy'):
        print('[OK] Railway 재배포 트리거 완료')
    else:
        print('[ERR] 재배포 실패:', result)


def cmd_env(tokens):
    result = railway_graphql(tokens['RAILWAY_TOKEN'], '''
        query Variables($projectId: String!, $serviceId: String!, $environmentId: String!) {
          variables(projectId: $projectId, serviceId: $serviceId, environmentId: $environmentId)
        }
    ''', {
        'projectId': RAILWAY_PROJECT_ID,
        'serviceId': RAILWAY_SERVICE_ID,
        'environmentId': RAILWAY_ENV_ID
    })
    variables = result.get('data', {}).get('variables', {})
    print('=== Railway 환경변수 ===')
    for k, v in variables.items():
        if k.startswith('RAILWAY_'):
            continue
        display = str(v)[:60] + '...' if len(str(v)) > 60 else str(v)
        print(f'  {k} = {display}')


def cmd_db(tokens, sql):
    rows = supabase_sql(tokens['SUPABASE_TOKEN'], sql)
    if rows:
        for row in rows:
            print(row)
    else:
        print('[OK] 완료 (결과 없음)')


def cmd_login_test(tokens):
    login_data = json.dumps({'username': 'crush.h', 'password': 'crush.h'}).encode('utf-8')
    req = urllib.request.Request(
        f'{RAILWAY_BACKEND_URL}/auth/login',
        data=login_data,
        headers={'Content-Type': 'application/json', 'User-Agent': 'test/1.0'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            result = json.loads(resp.read().decode())
            token = result.get('access_token', '')
            print(f'[OK] 로그인 성공! Token: {token[:30]}...')
    except urllib.error.HTTPError as e:
        print(f'[ERR] 로그인 실패: {e.code} {e.read().decode()[:200]}')


# ── 메인 ──────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    tokens = load_tokens()
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'status'

    if cmd == 'status':
        cmd_status(tokens)
    elif cmd == 'redeploy':
        cmd_redeploy(tokens)
    elif cmd == 'env':
        cmd_env(tokens)
    elif cmd == 'db':
        if len(sys.argv) < 3:
            print('사용법: python deploy_control.py db "SELECT * FROM users;"')
        else:
            cmd_db(tokens, sys.argv[2])
    elif cmd == 'login_test':
        cmd_login_test(tokens)
    else:
        print(__doc__)
