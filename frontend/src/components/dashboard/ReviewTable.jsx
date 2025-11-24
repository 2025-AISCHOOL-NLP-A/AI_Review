import React from "react";

/**
 * 리뷰 테이블 컴포넌트
 * - 리뷰 원문 샘플 표시
 */
const ReviewTable = ({ loading, reviews, expandedReviews, onToggleExpand }) => {
    if (loading) {
        return (
            <tr>
                <td colSpan="3" className="px-3 py-2 text-center text-gray-500">
                    로딩 중...
                </td>
            </tr>
        );
    }

    if (!reviews || reviews.length === 0) {
        return (
            <tr>
                <td colSpan="3" className="px-3 py-2 text-center text-gray-500">
                    리뷰 데이터가 없습니다.
                </td>
            </tr>
        );
    }

    return (
        <>
            {reviews.map((review, idx) => {
                const reviewDate = new Date(review.review_date);
                const formattedDate = `${reviewDate.getMonth() + 1}/${reviewDate.getDate()}`;
                const rating = parseFloat(review.rating) || 0;
                const reviewId = review.review_id || idx;
                const source = review.source;
                const showSource =
                    source !== undefined &&
                    source !== null &&
                    String(source).trim() !== "" &&
                    String(source).toLowerCase() !== "unknown";
                const reviewText = review.review_text || "";
                const isExpanded = expandedReviews.has(reviewId);
                const isLongText = reviewText.length > 100;
                const displayText =
                    isLongText && !isExpanded
                        ? reviewText.substring(0, 100) + "..."
                        : reviewText;

                const handleToggleExpand = () => {
                    onToggleExpand(reviewId);
                };

                return (
                    <tr key={reviewId} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                            {formattedDate}
                        </td>
                        <td className="px-3 py-2 text-gray-900">
                            <div>
                                {displayText}
                                {isLongText && (
                                    <button onClick={handleToggleExpand} className="review-more-btn">
                                        {isExpanded ? "접기" : "더보기"}
                                    </button>
                                )}
                            </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                            <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${rating >= 4
                                    ? "bg-pos-light text-pos"
                                    : rating <= 2
                                        ? "bg-neg-light text-neg"
                                        : "bg-gray-200 text-gray-600"
                                    } mr-1`}
                            >
                                {rating.toFixed(1)}점
                            </span>
                            {showSource && (
                                <span className="ml-1 text-xs text-gray-400">
                                    ({review.source})
                                </span>
                            )}
                        </td>
                    </tr>
                );
            })}
        </>
    );
};

export default ReviewTable;

