#!/bin/bash

# Docker 설정을 새 브랜치에 저장하고 main으로 돌아가기

echo "=== 1. 새 브랜치 생성 및 이동 ==="
git checkout -b feature/docker-setup

echo ""
echo "=== 2. 변경사항 확인 ==="
git status

echo ""
echo "=== 3. 모든 변경사항 추가 ==="
git add .

echo ""
echo "=== 4. 커밋 ==="
git commit -m "Add Docker setup for development environment

- Add docker-compose.yml for production
- Add docker-compose.dev.yml for development
- Add Dockerfiles for frontend, backend, model-server
- Add Docker documentation (Korean)
- Configure volume mounts for hot-reload
- Update backend DB connection error handling
- Fix model-server Unicode encoding issues"

echo ""
echo "=== 5. 원격 저장소에 푸시 ==="
git push origin feature/docker-setup

echo ""
echo "=== 6. main 브랜치로 돌아가기 ==="
git checkout main

echo ""
echo "=== 완료! ==="
echo "현재 브랜치: $(git branch --show-current)"
echo ""
echo "Docker 작업 계속하려면: git checkout feature/docker-setup"
echo "main에 병합하려면: git merge feature/docker-setup"
