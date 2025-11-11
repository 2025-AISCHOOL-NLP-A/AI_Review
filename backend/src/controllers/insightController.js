// backend/src/controllers/insightController.js

// 인사이트 목록 조회 (product_id 쿼리 필터 포함)
export const listInsights = async (req, res) => {
    try {
        const { product_id } = req.query;
        // TODO
        // - 입력: req.query.product_id 존재 여부 확인 및 숫자 검증 
        // - SQL 기본: SELECT insight_id, product_id, user_id, avg_rating, pos_top_keywords, neg_top_keywords, insight_summary, improvement_suggestion, created_at FROM tb_productInsight
        // - 필터: product_id가 있으면 WHERE product_id = ?
        // - 정렬: ORDER BY created_at DESC
        // - 바인딩: params에 product_id(있을 때만) 추가
        // - 실행: const [rows] = await db.query(sql, params)
        // - 응답: res.json({ count: rows.length, items: rows })
        // - 예외: product_id가 유효하지 않으면 400 반환
      return res.status(501).json({ message: "TODO: /insights 목록 API 구현 중" });
    } catch (err) {
      console.error("❌ 인사이트 목록 조회 오류:", err);
      return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  };
  
  // 인사이트 상세 조회 (insight_id로 조회)
  export const getInsightById = async (req, res) => {
    try {
        const { id: insightId } = req.params;
        if (!insightId) {
            return res.status(400).json({ message: "인사이트 ID가 필요합니다." });
          }
        // TODO
        // - 입력: req.params.id 필수, 숫자 검증 O
        // - SQL: SELECT insight_id, product_id, user_id, avg_rating, pos_top_keywords, neg_top_keywords, insight_summary, improvement_suggestion, created_at FROM tb_productInsight WHERE insight_id = ?
        // - 실행: const [[row]] = await db.query(sql, [id])
        // - 결과: row 없으면 404 반환, 있으면 res.json(row)
        // - 예외: id가 유효하지 않으면 400 반환


      return res.status(501).json({ message: "TODO: /insights/{id} 상세 API 구현 중" });
    } catch (err) {
      console.error("❌ 인사이트 상세 조회 오류:", err);
      return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  };
  
  // 인사이트 생성/분석 요청
  export const requestInsight = async (req, res) => {
    try {
      

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "인증 정보가 없습니다." });
      }
      // TODO: 인사이트 생성 로직 구현
      // - 인증 사용자 정보 필요(req.user.id) 
      // - 기간(start_date, end_date) 및 요청사항(notes) 처리
      // - 리뷰/키워드 집계 및 요약 생성 또는 FastAPI 연동
      // - tb_productInsight 저장
      return res.status(501).json({ message: "TODO: /insights/request 생성 API 구현 중" });
    } catch (err) {
      console.error("❌ 인사이트 생성(요청) 오류:", err);
      return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  };