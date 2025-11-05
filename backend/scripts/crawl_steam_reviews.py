import steamreviews
import json
import sys

def crawl_reviews(app_id, output_path, max_reviews=400):
    request_params = {
        'language': 'koreana',       # ✅ 한글 리뷰만
        'purchase_type': 'all',     # 구매 타입 전체
        'filter': 'recent',         # 최신순
        'review_type': 'all'        # 긍정/부정 모두
    }

    print(f"🚀 App ID {app_id} 리뷰 수집 시작...")
    review_dict, query_count = steamreviews.download_reviews_for_app_id(
        app_id=app_id,
        chosen_request_params=request_params
    )
    print(f"✅ {query_count}회 API 호출 완료")

    # SteamReviews 결과는 {"reviews": {...}} 구조
    reviews = list(review_dict["reviews"].values())[:max_reviews]

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(reviews, f, ensure_ascii=False, indent=2)

    print(f"📦 {len(reviews)}개 리뷰 저장 완료 → {output_path}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("⚙️ 사용법: python crawl_steam_reviews.py <app_id> <output_json_path>")
        sys.exit(1)

    app_id = sys.argv[1]
    output_path = sys.argv[2]

    crawl_reviews(app_id, output_path)