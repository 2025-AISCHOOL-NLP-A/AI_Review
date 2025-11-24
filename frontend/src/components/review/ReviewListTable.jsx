import React, { useState } from "react";

/**
 * 리뷰 목록 테이블 컴포넌트
 */
export default function ReviewListTable({
  reviewData,
  loading,
  selectedReviews,
  onSelectAll,
  onSelectItem,
  sortField,
  sortDirection,
  onSort,
}) {
  const [expandedReviews, setExpandedReviews] = useState(new Set());

  const handleToggleExpand = (reviewId) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}.${month}.${day}`;
    } catch (e) {
      return "-";
    }
  };

  const getSentimentBadge = (sentiment) => {
    const sentimentMap = {
      positive: { text: "긍정", class: "sentiment-positive" },
      neutral: { text: "중립", class: "sentiment-neutral" },
      negative: { text: "부정", class: "sentiment-negative" },
    };
    const sentimentInfo = sentimentMap[sentiment] || sentimentMap.neutral;
    return (
      <span className={`sentiment-badge ${sentimentInfo.class}`}>
        {sentimentInfo.text}
      </span>
    );
  };

  return (
    <div className="review-table-container">
      <table className="review-table">
        <thead>
          <tr>
            <th className="checkbox-column">
              <input
                type="checkbox"
                id="review_select_all"
                name="select_all"
                checked={
                  reviewData.length > 0 &&
                  selectedReviews.length === reviewData.length
                }
                onChange={onSelectAll}
                disabled={loading || reviewData.length === 0}
              />
            </th>
            <th
              className="sortable-header"
              onClick={() => onSort("review_date")}
              style={{ cursor: "pointer", userSelect: "none", textAlign: "center" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span style={{ flex: 1, textAlign: "center" }}>작성일</span>
                <span
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    fontSize: "0.7rem",
                    alignItems: "center",
                    color: sortField === "review_date" ? "#5B8EFF" : "#9CA3AF",
                    marginLeft: "auto",
                  }}
                >
                  <span
                    style={{
                      opacity: sortField === "review_date" && sortDirection === "asc" ? 1 : 0.3,
                    }}
                  >
                    ▲
                  </span>
                  <span
                    style={{
                      opacity: sortField === "review_date" && sortDirection === "desc" ? 1 : 0.3,
                    }}
                  >
                    ▼
                  </span>
                </span>
              </div>
            </th>
            <th style={{ textAlign: "center" }}>제품명</th>
            <th style={{ textAlign: "center" }}>리뷰 내용</th>
            <th style={{ textAlign: "center" }}>감정 분석</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>
                로딩 중...
              </td>
            </tr>
          ) : reviewData.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "1rem", color: "#6b7280" }}>
                    등록된 리뷰가 없습니다.
                  </p>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "#9ca3af" }}>
                    제품에 리뷰를 추가하여 분석을 시작하세요.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            reviewData.map((review) => {
              // 백엔드에서 보내는 필드명 그대로 사용
              const reviewId = review.review_id;
              const reviewText = review.review_text || "";
              const isExpanded = expandedReviews.has(reviewId);
              const isLongText = reviewText.length > 150;
              const displayText =
                isLongText && !isExpanded
                  ? reviewText.substring(0, 150) + "..."
                  : reviewText;

              return (
                <tr key={reviewId}>
                  <td
                    className="checkbox-column"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      id={`review_${reviewId}`}
                      name={`review_${reviewId}`}
                      checked={selectedReviews.includes(reviewId)}
                      onChange={(e) => {
                        e.stopPropagation();
                        onSelectItem(reviewId);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {formatDate(review.review_date)}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {review.product_name || "-"}
                  </td>
                  <td>
                    <div>
                      {displayText}
                      {isLongText && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleExpand(reviewId);
                          }}
                          className="review-more-btn"
                        >
                          {isExpanded ? "접기" : "더보기"}
                        </button>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {getSentimentBadge(review.sentiment)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

