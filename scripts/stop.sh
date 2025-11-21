#!/bin/bash

# AI Review Docker 중지 스크립트

set -e

echo "================================================"
echo "AI Review 시스템 중지"
echo "================================================"

# 실행 중인 컨테이너 확인
if [ "$(docker ps -q -f name=ai_review)" ]; then
    echo ""
    echo "중지 옵션을 선택하세요:"
    echo "1) 컨테이너만 중지 (데이터 유지)"
    echo "2) 컨테이너 중지 및 제거 (데이터 유지)"
    echo "3) 컨테이너, 네트워크, 볼륨 모두 제거 (⚠️ 데이터 삭제)"
    read -p "선택 (1-3): " option

    case $option in
        1)
            echo "컨테이너를 중지합니다..."
            docker-compose stop
            docker-compose -f docker-compose.dev.yml stop 2>/dev/null || true
            ;;
        2)
            echo "컨테이너를 중지하고 제거합니다..."
            docker-compose down
            docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
            ;;
        3)
            echo "⚠️  모든 데이터가 삭제됩니다!"
            read -p "정말 진행하시겠습니까? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                echo "모든 리소스를 제거합니다..."
                docker-compose down -v
                docker-compose -f docker-compose.dev.yml down -v 2>/dev/null || true
            else
                echo "취소되었습니다."
                exit 0
            fi
            ;;
        *)
            echo "잘못된 선택입니다."
            exit 1
            ;;
    esac

    echo ""
    echo "✅ AI Review 시스템이 중지되었습니다."
else
    echo "실행 중인 AI Review 컨테이너가 없습니다."
fi

echo ""


