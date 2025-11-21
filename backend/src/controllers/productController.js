import db from "../models/db.js";
import { getProductDashboardData as getProductDashboard } from "./dashboardController.js";
// dotenv는 app.js에서 이미 로드됨
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


// 날짜 문자열을 안전하게 파싱하고 YYYY-MM-DD로 정규화
const normalizeDate = (dateStr) => {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

// ES 모듈에서 __dirname 사용을 위한 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==============================
// 1. 제품 목록 조회 (사용자별)
// ==============================
export const productList = async (req, res) => {
  try {
    // 사용자 인증 확인
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "인증된 사용자 정보가 없습니다." });
    }

    // 해당 사용자의 제품만 조회 (재시도 로직 포함)
    let rows;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        [rows] = await db.query(`
          SELECT 
            p.product_id,
            p.product_name,
            p.brand,
            p.registered_date,
            p.category_id,
            p.user_id,
            CASE 
              WHEN d.product_id IS NULL THEN 1
              WHEN d.total_reviews IS NULL OR d.total_reviews = 0 THEN 1
              WHEN NOT EXISTS (
                SELECT 1 FROM tb_review r 
                WHERE r.product_id = p.product_id 
                LIMIT 1
              ) THEN 1
              ELSE 0
            END AS has_dashboard_error
          FROM tb_product p
          LEFT JOIN tb_productDashboard d ON p.product_id = d.product_id
          WHERE p.user_id = ?
          ORDER BY p.product_id DESC
        `, [userId]);
        break; // 성공 시 루프 종료
      } catch (queryErr) {
        retryCount++;
        if (queryErr.code === 'ECONNRESET' || queryErr.code === 'PROTOCOL_CONNECTION_LOST') {
          if (retryCount < maxRetries) {
            console.log(`🔄 DB 연결 오류 발생. 재시도 ${retryCount}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // 지수 백오프
            continue;
          }
        }
        throw queryErr; // 다른 에러이거나 재시도 횟수 초과 시 throw
      }
    }

    res.json({
      message: "제품 목록 조회 성공",
      products: rows
    });
  } catch (err) {
    console.error("❌ 제품 목록 조회 오류:", err);

    // DB 연결 관련 에러인 경우
    if (err.code === 'ECONNRESET' || err.code === 'PROTOCOL_CONNECTION_LOST') {
      return res.status(503).json({
        message: "데이터베이스 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
      });
    }

    res.status(500).json({
      message: "제품 목록 조회 중 서버 오류가 발생했습니다.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ==============================
// 📊 제품 대시보드 조회
// ==============================
// export const dashboard = (req, res) => getProductDashboard(req, res);

// DB 쿼리 재시도 헬퍼 함수
const executeQueryWithRetry = async (queryFn, maxRetries = 3) => {
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      return await queryFn();
    } catch (queryErr) {
      retryCount++;
      if ((queryErr.code === 'ECONNRESET' || queryErr.code === 'PROTOCOL_CONNECTION_LOST') && retryCount < maxRetries) {
        console.log(`🔄 DB 연결 오류 발생. 재시도 ${retryCount}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // 지수 백오프
        continue;
      }
      throw queryErr; // 다른 에러이거나 재시도 횟수 초과 시 throw
    }
  }
};

export const dashboard = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const startDate = normalizeDate(req.query.start_date);
    const endDate = normalizeDate(req.query.end_date);

    if (startDate && endDate && startDate > endDate) {
      return res.status(400).json({ message: "시작 날짜는 종료 날짜보다 이전이어야 합니다." });
    }

    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    // 1. 대시보드 테이블 전체 조회 (재시도 로직 포함)
    let dashboardData;
    try {
      const result = await executeQueryWithRetry(async () => {
        const [[data]] = await db.query(
          `SELECT 
            product_id,
            total_reviews,
            sentiment_distribution,
            product_score,
            date_sentimental,
            keyword_summary,
            heatmap,
            wordcloud_path,
            insight_id,
            updated_at
          FROM tb_productDashboard
          WHERE product_id = ?`,
          [productId]
        );
        return data;
      });
      dashboardData = result;
    } catch (queryErr) {
      if (queryErr.code === 'ECONNRESET' || queryErr.code === 'PROTOCOL_CONNECTION_LOST') {
        return res.status(503).json({
          message: "데이터베이스 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
        });
      }
      throw queryErr;
    }

    if (!dashboardData) {
      return res.status(404).json({ message: "대시보드 데이터를 찾을 수 없습니다." });
    }

    // 2. 워드클라우드 이미지 처리
    let wordcloudImage = null;
    let wordcloudPath = dashboardData.wordcloud_path || null;
    if (wordcloudPath) {
      try {
        const staticPath = path.join(__dirname, "../../../model_server/static");
        const imagePath = path.join(staticPath, wordcloudPath.replace("/static/", ""));
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          wordcloudImage = `data:image/png;base64,${imageBuffer.toString("base64")}`;
        }
      } catch (err) {
        wordcloudImage = null;
      }
    }

    // 3. 인사이트 조회 (재시도 로직 포함)
    let insight = null;
    if (dashboardData.insight_id) {
      try {
        const result = await executeQueryWithRetry(async () => {
          const [[data]] = await db.query(
            `SELECT 
              insight_id,
              product_id,
              user_id,
              pos_top_keywords,
              neg_top_keywords,
              insight_summary,
              improvement_suggestion,
              created_at,
              content
            FROM tb_productInsight
            WHERE insight_id = ?`,
            [dashboardData.insight_id]
          );
          return data;
        });
        insight = result || null;
      } catch (queryErr) {
        console.error("⚠️ 인사이트 조회 실패 (계속 진행):", queryErr.message);
        insight = null; // 인사이트 조회 실패해도 계속 진행
      }
    }

    // 4. 최신 리뷰 10개 조회 (재시도 로직 포함)
    let recentReviews = [];
    try {
      const result = await executeQueryWithRetry(async () => {
        const [data] = await db.query(
          `SELECT 
            review_id,
            product_id,
            review_text,
            rating,
            review_date,
            source
          FROM tb_review
          WHERE product_id = ?
          ORDER BY review_date DESC
          LIMIT 10`,
          [productId]
        );
        return data;
      });
      recentReviews = result || [];
    } catch (queryErr) {
      console.error("⚠️ 최신 리뷰 조회 실패 (계속 진행):", queryErr.message);
      recentReviews = []; // 리뷰 조회 실패해도 계속 진행
    }

    //5. 상품 이름 조회 (재시도 로직 포함)
    let productInfo = null;
    try {
      const result = await executeQueryWithRetry(async () => {
        const [[data]] = await db.query(
          `SELECT 
            product_name
          FROM tb_product
          WHERE product_id = ?
          LIMIT 1`,
          [productId]
        );
        return data;
      });
      productInfo = result;
    } catch (queryErr) {
      console.error("⚠️ 제품 정보 조회 실패 (계속 진행):", queryErr.message);
      productInfo = null; // 제품 정보 조회 실패해도 계속 진행
    }

    // 6. 날짜 필터가 있으면 해당 기간 데이터만 집계
    const shouldApplyDateFilter = Boolean(startDate || endDate);
    let aggregatedDashboard = dashboardData;
    if (shouldApplyDateFilter) {
      const whereParts = ["r.product_id = ?"];
      const params = [productId];
      if (startDate) {
        whereParts.push("DATE(r.review_date) >= ?");
        params.push(startDate);
      }
      if (endDate) {
        whereParts.push("DATE(r.review_date) <= ?");
        params.push(endDate);
      }
      const whereSql = `WHERE ${whereParts.join(" AND ")}`;

      // 통계 조회
      const [[stats]] = await db.query(
        `
        SELECT
          COUNT(*) AS total_reviews,
          AVG(r.rating) AS avg_rating,
          SUM(CASE WHEN ra.sentiment = 'positive' THEN 1 ELSE 0 END) AS positive_count,
          SUM(CASE WHEN ra.sentiment = 'negative' THEN 1 ELSE 0 END) AS negative_count
        FROM tb_review r
        LEFT JOIN tb_reviewAnalysis ra ON ra.review_id = r.review_id
        ${whereSql}
        `,
        params
      );

      const totalReviews = stats?.total_reviews || 0;
      const positiveCount = stats?.positive_count || 0;
      const negativeCount = stats?.negative_count || 0;
      const avgRating = Number.parseFloat(stats?.avg_rating) || 0;
      const positiveRatio = totalReviews ? positiveCount / totalReviews : 0;
      const negativeRatio = totalReviews ? negativeCount / totalReviews : 0;

      // 일별 트렌드
      const [dailyTrend] = await db.query(
        `
        SELECT
          DATE(r.review_date) AS date,
          COUNT(*) AS review_count,
          SUM(CASE WHEN ra.sentiment = 'positive' THEN 1 ELSE 0 END) AS positive_count,
          SUM(CASE WHEN ra.sentiment = 'negative' THEN 1 ELSE 0 END) AS negative_count
        FROM tb_review r
        LEFT JOIN tb_reviewAnalysis ra ON ra.review_id = r.review_id
        ${whereSql}
        GROUP BY DATE(r.review_date)
        ORDER BY DATE(r.review_date)
        `,
        params
      );

      const dateSentimental = (dailyTrend || []).map((row) => {
        const total = row.review_count || 1;
        return {
          date: row.date,
          review_count: row.review_count,
          positive: total ? (row.positive_count || 0) / total : 0,
          negative: total ? (row.negative_count || 0) / total : 0,
        };
      });

      // 키워드 요약
      const [keywordSummary] = await db.query(
        `
        SELECT
          k.keyword_id,
          k.keyword_text,
          COALESCE(SUM(CASE WHEN ra.sentiment = 'positive' THEN 1 ELSE 0 END), 0) AS positive_count,
          COALESCE(SUM(CASE WHEN ra.sentiment = 'negative' THEN 1 ELSE 0 END), 0) AS negative_count
        FROM tb_keyword k
        JOIN tb_reviewAnalysis ra ON k.keyword_id = ra.keyword_id
        JOIN tb_review r ON ra.review_id = r.review_id
        ${whereSql}
        GROUP BY k.keyword_id, k.keyword_text
        ORDER BY k.keyword_id
        `,
        params
      );

      const keywordSummaryWithRatio = (keywordSummary || []).map((row) => {
        const pos = row.positive_count || 0;
        const neg = row.negative_count || 0;
        const total = pos + neg;
        const positiveRatio = total ? (pos / total) * 100 : 0;
        const negativeRatio = total ? (neg / total) * 100 : 0;
        return {
          ...row,
          positive_ratio: Number(positiveRatio.toFixed(2)),
          negative_ratio: Number(negativeRatio.toFixed(2)),
        };
      });

      // 히트맵용 상위 키워드 조회
      const [heatmapKeywordsRows] = await db.query(
        `
        SELECT
          k.keyword_id,
          k.keyword_text,
          COUNT(*) AS mention_count
        FROM tb_reviewAnalysis ra
        JOIN tb_review r ON ra.review_id = r.review_id
        JOIN tb_keyword k ON ra.keyword_id = k.keyword_id
        ${whereSql}
        GROUP BY k.keyword_id, k.keyword_text
        ORDER BY mention_count DESC
        LIMIT 6
        `,
        params
      );
      const heatmapKeywords = heatmapKeywordsRows || [];

      let heatmapData = null;
      if (heatmapKeywords.length) {
        const keywordIds = heatmapKeywords.map((k) => k.keyword_id);
        const idPlaceholders = keywordIds.map(() => "?").join(",");
        const [reviewKeywordRows] = await db.query(
          `
          SELECT
            r.review_id,
            ra.keyword_id
          FROM tb_reviewAnalysis ra
          JOIN tb_review r ON ra.review_id = r.review_id
          ${whereSql} AND ra.keyword_id IN (${idPlaceholders})
          `,
          [...params, ...keywordIds]
        );

        const byReview = new Map();
        for (const row of reviewKeywordRows) {
          const list = byReview.get(row.review_id) || [];
          list.push(row.keyword_id);
          byReview.set(row.review_id, list);
        }

        const idToIndex = new Map(keywordIds.map((id, idx) => [id, idx]));
        const size = keywordIds.length;
        const matrix = Array.from({ length: size }, () => Array(size).fill(0));

        for (const kwList of byReview.values()) {
          const uniqueKw = Array.from(new Set(kwList)).filter((id) => idToIndex.has(id));
          for (let i = 0; i < uniqueKw.length; i++) {
            for (let j = i; j < uniqueKw.length; j++) {
              const a = idToIndex.get(uniqueKw[i]);
              const b = idToIndex.get(uniqueKw[j]);
              matrix[a][b] += 1;
              if (a !== b) {
                matrix[b][a] += 1;
              }
            }
          }
        }

        let maxVal = 0;
        matrix.forEach((row) =>
          row.forEach((v) => {
            if (v > maxVal) maxVal = v;
          })
        );
        const normalized =
          maxVal > 0 ? matrix.map((row) => row.map((v) => Number((v / maxVal).toFixed(4)))) : matrix;

        heatmapData = {
          keywords: heatmapKeywords.map((k) => k.keyword_text),
          matrix: normalized,
        };
      }

      // 최신 리뷰 (기간 필터 적용)
      const [filteredRecent] = await db.query(
        `
        SELECT 
          review_id,
          product_id,
          review_text,
          rating,
          review_date,
          source
        FROM tb_review r
        ${whereSql}
        ORDER BY review_date DESC
        LIMIT 10
        `,
        params
      );
      recentReviews = filteredRecent || [];

      aggregatedDashboard = {
        product_id: Number(productId),
        product_name: productInfo?.product_name || dashboardData?.product_name,
        total_reviews: totalReviews,
        sentiment_distribution: {
          positive: positiveRatio,
          negative: negativeRatio,
        },
        product_score: avgRating,
        date_sentimental: dateSentimental,
        keyword_summary: keywordSummaryWithRatio,
        heatmap: heatmapData || dashboardData?.heatmap || null,
        wordcloud_path: wordcloudPath || dashboardData?.wordcloud_path || null,
        updated_at: new Date(),
      };

      // 기간별 워드클라우드 생성 (model_server -> base64 우선)
      try {
        const wcResult = await generateWordcloud(productId, null, startDate, endDate);
        if (wcResult?.wordcloud) {
          wordcloudImage = wcResult.wordcloud; // base64 data URI
          wordcloudPath = null;
        } else if (wcResult?.wordcloud_path) {
          wordcloudPath = wcResult.wordcloud_path;
        }
      } catch (err) {
        console.error("워드클라우드 생성 실패 (무시됨):", err.message);
      }
    }

    // 최종 워드클라우드 로딩 (경로가 있으면 파일에서 로드)
    if (!wordcloudImage && wordcloudPath) {
      try {
        const staticPath = path.join(__dirname, "../../../model_server/static");
        const imagePath = path.join(staticPath, wordcloudPath.replace("/static/", ""));
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          wordcloudImage = `data:image/png;base64,${imageBuffer.toString("base64")}`;
        }
      } catch (err) {
        wordcloudImage = null;
      }
    }

    // 7. 최종 응답 반환
    res.json({
      message: "대시보드 조회 성공",
      dashboard: {
        product_id: aggregatedDashboard.product_id,
        product_name: productInfo?.product_name,
        total_reviews: aggregatedDashboard.total_reviews,
        sentiment_distribution: aggregatedDashboard.sentiment_distribution,
        product_score: aggregatedDashboard.product_score,
        date_sentimental: aggregatedDashboard.date_sentimental || dashboardData.date_sentimental,
        keyword_summary: aggregatedDashboard.keyword_summary || dashboardData.keyword_summary,
        heatmap: aggregatedDashboard.heatmap,
        wordcloud: wordcloudImage,
        updated_at: aggregatedDashboard.updated_at || dashboardData.updated_at
      },
      insight,
      recent_reviews: recentReviews
    });

  } catch (err) {
    console.error("❌ 대시보드 조회 오류:", err);

    // DB 연결 관련 에러인 경우
    if (err.code === 'ECONNRESET' || err.code === 'PROTOCOL_CONNECTION_LOST') {
      return res.status(503).json({
        message: "데이터베이스 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
      });
    }

    res.status(500).json({
      message: "대시보드 조회 중 서버 오류가 발생했습니다.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
export const keywordReview = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { keyword, page = 1, limit = 20 } = req.query;

    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    const offset = (page - 1) * limit;

    const [rows] = await db.query(`
      SELECT 
        r.review_id,
        r.review_text,
        ra.sentiment,
        k.keyword_text
      FROM tb_review r
      JOIN tb_reviewAnalysis ra ON r.review_id = ra.review_id
      JOIN tb_keyword k ON ra.keyword_id = k.keyword_id
      WHERE r.product_id = ? AND k.keyword_text = ?
      ORDER BY r.review_id DESC
      LIMIT ?, ?
    `, [productId, keyword, offset, parseInt(limit)]);

    res.json({
      message: "키워드별 리뷰 조회 성공",
      productId,
      keyword,
      count: rows.length,
      reviews: rows,
      pagination: { page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    console.error("❌ 키워드별 리뷰 조회 오류:", err);
    res.status(500).json({ message: "키워드별 리뷰 조회 중 서버 오류가 발생했습니다." });
  }
};


// ==============================
// 5. 제품 삭제
// ==============================
export const deleteProduct = async (req, res) => {
  try {
    const { id: productId } = req.params;

    // 제품 ID 검증
    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    const productIdNum = Number.parseInt(productId, 10);
    if (isNaN(productIdNum) || productIdNum <= 0) {
      return res.status(400).json({ message: "유효한 제품 ID가 필요합니다." });
    }

    // 제품 존재 확인 및 소유권 확인
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "인증된 사용자 정보가 없습니다." });
    }

    const [[existingProduct]] = await db.query(
      "SELECT product_id, user_id FROM tb_product WHERE product_id = ?",
      [productIdNum]
    );

    if (!existingProduct) {
      return res.status(404).json({ message: "제품을 찾을 수 없습니다." });
    }

    // 소유권 확인
    if (existingProduct.user_id !== userId) {
      return res.status(403).json({ message: "이 제품을 삭제할 권한이 없습니다." });
    }

    // 트랜잭션 시작하여 관련 데이터 삭제
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. tb_productDashboard 삭제 (insight_id 참조하므로 먼저 삭제)
      await connection.query("DELETE FROM tb_productDashboard WHERE product_id = ?", [productIdNum]);

      // 2. tb_productInsight 삭제 (product_id CASCADE이지만 명시적으로 삭제)
      await connection.query("DELETE FROM tb_productInsight WHERE product_id = ?", [productIdNum]);

      // 3. tb_review 삭제 (product_id CASCADE이지만 명시적으로 삭제)
      // tb_reviewAnalysis는 tb_review의 CASCADE로 자동 삭제됨
      await connection.query("DELETE FROM tb_review WHERE product_id = ?", [productIdNum]);

      // 4. tb_productKeyword 삭제 (product_id CASCADE이지만 명시적으로 삭제)
      await connection.query("DELETE FROM tb_productKeyword WHERE product_id = ?", [productIdNum]);

      // 5. 마지막으로 tb_product 삭제
      const [result] = await connection.query("DELETE FROM tb_product WHERE product_id = ?", [productIdNum]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ message: "제품을 찾을 수 없습니다." });
      }

      await connection.commit();
      connection.release();

      res.json({
        message: "제품이 성공적으로 삭제되었습니다.",
        productId: productIdNum
      });

    } catch (err) {
      if (connection) {
        await connection.rollback();
        connection.release();
      }
      throw err;
    }
  } catch (err) {
    console.error("❌ 제품 삭제 오류:", err);
    console.error("❌ 에러 상세:", {
      message: err.message,
      stack: err.stack,
      code: err.code,
      sqlMessage: err.sqlMessage
    });

    // 외래 키 제약 조건 오류인 경우
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
      return res.status(409).json({
        message: "제품 삭제 중 관련 데이터 처리 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      });
    }

    res.status(500).json({
      message: "제품 삭제 중 서버 오류가 발생했습니다.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};


// ==============================
// 6. 제품 정보 수정
// ==============================
export const updateProduct = async (req, res) => {
  try {
    console.log("📝 제품 수정 요청 받음:", req.params, req.body);
    const { id: productId } = req.params;
    const { product_name, brand, category_id } = req.body;

    // 제품 ID 검증
    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    const productIdNum = Number.parseInt(productId, 10);
    if (isNaN(productIdNum) || productIdNum <= 0) {
      return res.status(400).json({ message: "유효한 제품 ID가 필요합니다." });
    }

    // 필수 필드 검증
    if (!product_name || product_name.trim() === "") {
      return res.status(400).json({ message: "제품명은 필수입니다." });
    }

    if (!category_id) {
      return res.status(400).json({ message: "카테고리는 필수입니다." });
    }

    const categoryIdNum = Number.parseInt(category_id, 10);
    if (isNaN(categoryIdNum) || categoryIdNum <= 0) {
      return res.status(400).json({ message: "유효한 카테고리 ID가 필요합니다." });
    }

    // 제품 존재 확인
    const [[existingProduct]] = await db.query(
      "SELECT product_id FROM tb_product WHERE product_id = ?",
      [productIdNum]
    );

    if (!existingProduct) {
      return res.status(404).json({ message: "제품을 찾을 수 없습니다." });
    }

    // 제품 정보 업데이트
    await db.query(
      `UPDATE tb_product 
       SET product_name = ?, brand = ?, category_id = ?
       WHERE product_id = ?`,
      [product_name.trim(), brand && brand.trim() !== "" ? brand.trim() : null, categoryIdNum, productIdNum]
    );

    res.json({
      message: "제품 정보가 성공적으로 수정되었습니다.",
      productId: productIdNum,
      updated: { product_name: product_name.trim(), brand: brand && brand.trim() !== "" ? brand.trim() : null, category_id: categoryIdNum }
    });

  } catch (err) {
    console.error("❌ 제품 정보 수정 오류:", err);
    console.error("❌ 에러 상세:", {
      message: err.message,
      stack: err.stack,
      code: err.code,
      sqlMessage: err.sqlMessage,
      sql: err.sql
    });
    res.status(500).json({
      message: "제품 정보 수정 중 서버 오류가 발생했습니다.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};


// ==============================
// 8. 제품 생성
// ==============================
export const createProductWithReviews = async (req, res) => {
  try {
    const { product_name, brand, category_id } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "인증된 사용자 정보가 없습니다." });
    }

    if (!product_name || !category_id) {
      return res.status(400).json({ message: "제품명과 카테고리는 필수입니다." });
    }

    // 제품 생성
    const [result] = await db.query(
      "INSERT INTO tb_product (product_name, brand, category_id, user_id, registered_date) VALUES (?, ?, ?, ?, NOW())",
      [product_name, brand || null, category_id, userId]
    );

    const productId = result.insertId;
    console.log(`✅ 제품 생성 완료: ${productId}`);

    // 결과 반환
    res.status(201).json({
      message: "제품이 성공적으로 생성되었습니다.",
      product: {
        product_id: productId,
        product_name,
        brand,
        category_id
      }
    });

  } catch (err) {
    console.error("❌ 제품 생성 오류:", err);
    res.status(500).json({
      message: "제품 생성 중 서버 오류가 발생했습니다.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
