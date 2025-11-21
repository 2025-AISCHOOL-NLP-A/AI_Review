#!/bin/bash

# AI Review Docker 시작 스크립트

set -e

echo "================================================"
echo "AI Review 시스템 시작"
echo "================================================"

# .env 파일 확인
if [ ! -f .env ]; then
    echo "⚠️  .env 파일이 없습니다."
    echo "env.example 파일을 복사하여 .env 파일을 생성합니다..."
    cp env.example .env
    echo "✅ .env 파일이 생성되었습니다."
    echo "⚠️  .env 파일을 열어 필요한 설정을 수정하세요."
    echo ""
    read -p "계속하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Docker 및 Docker Compose 확인
if ! command -v docker &> /dev/null; then
    echo "❌ Docker가 설치되어 있지 않습니다."
    echo "https://docs.docker.com/get-docker/ 에서 Docker를 설치하세요."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose가 설치되어 있지 않습니다."
    echo "https://docs.docker.com/compose/install/ 에서 Docker Compose를 설치하세요."
    exit 1
fi

echo "✅ Docker 버전: $(docker --version)"
echo "✅ Docker Compose 버전: $(docker-compose --version)"
echo ""

# 실행 모드 선택
echo "실행 모드를 선택하세요:"
echo "1) 프로덕션 모드 (기본)"
echo "2) 개발 모드 (핫 리로드)"
read -p "선택 (1-2): " mode

if [ "$mode" = "2" ]; then
    echo ""
    echo "🚀 개발 모드로 시작합니다..."
    docker-compose -f docker-compose.dev.yml up -d --build
else
    echo ""
    echo "🚀 프로덕션 모드로 시작합니다..."
    docker-compose up -d --build
fi

# 컨테이너 시작 대기
echo ""
echo "⏳ 컨테이너가 시작될 때까지 기다리는 중..."
sleep 10

# 상태 확인
echo ""
echo "================================================"
echo "서비스 상태 확인"
echo "================================================"
docker-compose ps

echo ""
echo "================================================"
echo "✅ AI Review 시스템이 시작되었습니다!"
echo "================================================"
echo ""
echo "접속 정보:"
echo "  - Frontend: http://localhost:80"
echo "  - Backend API: http://localhost:3001"
echo "  - Model Server: http://localhost:8000"
echo "  - API 문서: http://localhost:8000/docs"
echo ""
echo "로그 확인: docker-compose logs -f"
echo "중지: docker-compose down"
echo ""


