import React from "react";
import api from "../../services/api";

/**
 * 워드클라우드 섹션 컴포넌트
 * - base64 이미지 데이터 또는 경로 지원
 */
const WordCloudSection = ({ loading, wordcloud }) => {
  const getImageSrc = () => {
    if (!wordcloud) return "";
    
    // base64 데이터인지 확인 (data:image로 시작하는지)
    if (typeof wordcloud === "string" && wordcloud.startsWith("data:image")) {
      // base64 데이터를 그대로 사용
      return wordcloud;
    } else if (typeof wordcloud === "string" && wordcloud.trim() !== "") {
      // 경로인 경우 (하위 호환성)
      const baseURL =
        api.defaults.baseURL ||
        import.meta.env.VITE_API_BASE_URL ||
        "http://localhost:3001";
      const cleanBaseURL = baseURL.replace(/\/$/, "");
      const cleanPath = wordcloud.startsWith("/")
        ? wordcloud
        : `/${wordcloud}`;
      return `${cleanBaseURL}${cleanPath}`;
    }
    return "";
  };

  const handleImageError = (e) => {
    // 개발 환경에서만 에러 로깅
    if (import.meta.env.DEV) {
      console.error("워드클라우드 이미지 로드 실패:", {
        wordcloud: wordcloud ? wordcloud.substring(0, 50) + "..." : "null",
        isBase64: typeof wordcloud === "string" && wordcloud.startsWith("data:image"),
        imageSrc: e.target.src,
      });
    }
    
    const errorDiv = e.target.nextElementSibling;
    if (errorDiv) {
      e.target.style.display = "none";
      errorDiv.style.display = "block";
    }
  };

  const handleImageLoad = () => {
    // 이미지 로드 성공
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-gray-500">로딩 중...</span>
      </div>
    );
  }

  if (!wordcloud) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-gray-500">워드클라우드 데이터가 없습니다.</span>
      </div>
    );
  }

  return (
    <div className="wordcloud-image-container">
      <img
        src={getImageSrc()}
        alt="워드클라우드"
        className="wordcloud-image"
        crossOrigin="anonymous"
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
      <div style={{ display: "none" }} className="text-center text-gray-500 py-8">
        <p>워드클라우드 이미지를 불러올 수 없습니다.</p>
        <p className="text-sm mt-2">
          {typeof wordcloud === "string" && wordcloud.startsWith("data:image")
            ? "base64 데이터 형식"
            : `경로: ${wordcloud}`}
        </p>
      </div>
    </div>
  );
};

export default WordCloudSection;

