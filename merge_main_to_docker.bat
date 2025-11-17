@echo off
chcp 65001 >nul
echo.
echo ========================================
echo Docker 브랜치에 Main 최신 코드 병합하기
echo ========================================
echo.

echo [1/5] 현재 브랜치 확인...
git branch --show-current
echo.

echo [2/5] docker 브랜치로 이동...
git checkout docker
if errorlevel 1 (
    echo 에러: docker 브랜치가 없습니다.
    echo 브랜치 이름을 확인하세요: git branch
    pause
    exit /b 1
)
echo.

echo [3/5] main 브랜치의 최신 변경사항 가져오기...
git fetch origin main
echo.

echo [4/5] main을 docker 브랜치로 병합...
echo 충돌이 발생할 수 있습니다!
echo.
git merge origin/main

if errorlevel 1 (
    echo.
    echo ========================================
    echo 충돌 발생!
    echo ========================================
    echo.
    echo 충돌 해결 가이드:
    echo.
    echo 1. 충돌 파일 확인:
    echo    git status
    echo.
    echo 2. 충돌 파일 수동 수정 또는:
    echo    - Docker 설정 파일: git checkout --ours [파일명]
    echo    - 코드 파일: git checkout --theirs [파일명]
    echo.
    echo 3. 수정 완료 후:
    echo    git add .
    echo    git commit -m "Merge main into docker branch"
    echo.
    echo 4. 푸시:
    echo    git push origin docker
    echo.
    pause
    exit /b 1
)

echo.
echo [5/5] 원격 저장소에 푸시...
git push origin docker

echo.
echo ========================================
echo 완료!
echo ========================================
echo.
echo Docker 브랜치가 main의 최신 코드로 업데이트되었습니다.
echo.
echo 다음 단계:
echo 1. Docker 설정 파일 확인
echo 2. 새로 추가된 의존성 확인 (package.json, requirements.txt)
echo 3. Docker 빌드 테스트: docker-compose -f docker-compose.dev.yml up --build
echo.
pause
