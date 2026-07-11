import urllib.request
import json

opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor())

# 1. 로그인
req = urllib.request.Request(
    'http://127.0.0.1:5000/login',
    data=json.dumps({'username': 'test3', 'password': '1234'}).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
print("로그인:", opener.open(req).read().decode())

# 2. 노트 저장
req2 = urllib.request.Request(
    'http://127.0.0.1:5000/notes',
    data=json.dumps({
        'title': '첫 번째 노트',
        'content': '오늘의 필사 내용입니다.',
        'font': 'Nanum Gothic',
        'size': '18px',
        'date': '2026.07.09'
    }).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
print("노트 저장:", opener.open(req2).read().decode())

# 3. 노트 불러오기
req3 = urllib.request.Request('http://127.0.0.1:5000/notes')
print("노트 목록:", opener.open(req3).read().decode())