@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 충돌 해결: main 브랜치 코드 사용
echo ========================================
echo.

echo 충돌 파일들을 main 브랜치 버전으로 교체합니다...
echo.

echo [1/3] backend/src/models/db.js
git checkout --theirs backend/src/models/db.js
git add backend/src/models/db.js

echo [2/3] model_server/main.py
git checkout --theirs model_server/main.py
git add model_server/main.py

echo [3/3] model_server/utils/generate_insight.py
git checkout --theirs model_server/utils/generate_insight.py
git add model_server/utils/generate_insight.py

echo.
echo 충돌 해결 완료! 병합 커밋 생성 중...
echo.

git commit -m "Merge main into feature/docker-setup - Use latest main code for conflicted files"

echo.
echo ========================================
echo 완료!
echo ========================================
echo.
echo 브랜치 상태:
git branch --show-current
echo.
echo 다음 단계:
echo 1. git push origin feature/docker-setup
echo 2. Docker 설정 파일 확인 및 업데이트
echo 3. docker-compose -f docker-compose.dev.yml up --build
echo.
pause
