import db from "../models/db.js";
import { getProductDashboardData as getProductDashboard } from "./dashboardController.js";
import { analyzeReviews } from "./reviewController.js"; // ✅ 실제 리뷰 분석 함수 import
import { analyzeProductReviews } from "../services/absaService.js"; // Python 서버 직접 호출
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import XLSX from "xlsx";
import csv from "csv-parser";
import { Readable } from "stream";

dotenv.config();

// ES 모듈에서 __dirname 사용을 위한 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==============================
// 1. 개별 제품 조회
// ==============================
export const getProductById = async (req, res) => {
  try {
    const { id: productId } = req.params;
    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    const [rows] = await db.query(
      "SELECT * FROM tb_product WHERE product_id = ?",
      [productId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "제품을 찾을 수 없습니다." });
    }

    return res.json({ data: rows[0] });
  } catch (err) {
    console.error("❌ 제품 조회 오류:", err);
    return res.status(500).json({ message: "제품 조회 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 2. 제품 목록 조회 (사용자별)
// ==============================
export const productList = async (req, res) => {
  try {
    // 사용자 인증 확인
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "인증된 사용자 정보가 없습니다." });
    }

    // 해당 사용자의 제품만 조회
    const [rows] = await db.query(`
      SELECT 
        p.product_id,
        p.product_name,
        p.brand,
        p.registered_date,
        p.category_id,
        p.user_id
      FROM tb_product p
      WHERE p.user_id = ?
      ORDER BY p.product_id DESC
    `, [userId]);

    res.json({
      message: "제품 목록 조회 성공",
      products: rows
    });
  } catch (err) {
    console.error("❌ 제품 목록 조회 오류:", err);
    res.status(500).json({ message: "제품 목록 조회 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 📊 제품 대시보드 조회
// ==============================
// export const dashboard = (req, res) => getProductDashboard(req, res);

export const dashboard = async (req, res) => {
  try {
    const { id: productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    // 1. 대시보드 테이블 전체 조회
    const [[dashboardData]] = await db.query(
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
    if (!dashboardData) {
      return res.status(404).json({ message: "대시보드 데이터를 찾을 수 없습니다." });
    }

    // 2. 워드클라우드 이미지 처리
    let wordcloudImage = null;
    if (dashboardData.wordcloud_path) {
      try {
        // model_server/static 경로 구성
        const staticPath = path.join(__dirname, "../../../model_server/static");
        const imagePath = path.join(staticPath, dashboardData.wordcloud_path.replace("/static/", ""));
        
        // 파일 존재 여부 확인
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          wordcloudImage = `data:image/png;base64,${imageBuffer.toString("base64")}`;
        } else {
          wordcloudImage = null;
        }
      } catch (err) {
        wordcloudImage = null;
      }
    }

    // 3. 인사이트 조회
    let insight = null;
    if (dashboardData.insight_id) {
      const [[insightData]] = await db.query(
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
      insight = insightData || null;
    }

    // 4. 최신 리뷰 10개 조회
    const [recentReviews] = await db.query(
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

    //5. 상품 이름 조회
    const [[productInfo]] = await db.query(
      `SELECT 
        product_name
      FROM tb_product
      WHERE product_id = ?
      LIMIT 1`,
      [productId]
    );
    // 5. 응답 데이터 구성
    res.json({
      message: "대시보드 조회 성공",
      dashboard: {
        product_id: dashboardData.product_id,
        product_name: productInfo?.product_name,
        total_reviews: dashboardData.total_reviews,
        sentiment_distribution: dashboardData.sentiment_distribution,
        product_score: dashboardData.product_score,
        date_sentimental: dashboardData.date_sentimental,
        keyword_summary: dashboardData.keyword_summary,
        heatmap: dashboardData.heatmap,
        wordcloud: wordcloudImage,
        updated_at: dashboardData.updated_at
      },
      insight,
      recent_reviews: recentReviews
    });

  } catch (err) {
    console.error("❌ 대시보드 조회 오류:", err);
    res.status(500).json({ message: "대시보드 조회 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 3. 대시보드 새로고침 (미들웨어)
// ==============================
export const refreshDashboard = async (req, res, next) => {
  try {
    const { id: productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    // TODO: 향후 캐시 무효화 / 데이터 재갱신 로직 추가
    console.log(`🔄 대시보드 새로고침 완료 (productId=${productId})`);

    next(); // 다음 미들웨어(dashboard)로 이동
  } catch (err) {
    console.error("❌ 대시보드 새로고침 오류:", err);
    res.status(500).json({ message: "대시보드 새로고침 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 4. 키워드별 리뷰 조회
// ==============================
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
// 5. 리뷰 분석 요청 (내부 함수로 변경)
// ==============================
// 내부에서 사용할 리뷰 분석 함수 (응답 없이 분석만 수행)
const performAnalysis = async (productId, domain = null) => {
  try {
    console.log(`📦 ${productId}번 제품 리뷰 분석 시작 (도메인: ${domain || "자동"})`);
    
    // Python 서버 직접 호출
    const result = await analyzeProductReviews(productId, domain);
    
    console.log(`✅ 분석 완료:`, result);
    return result;
  } catch (err) {
    console.error("❌ 분석 실행 오류:", err);
    throw err;
  }
};

// 기존 API 엔드포인트 (필요시 사용)
export const analysisRequest = async (req, res) => {
  try {
    const { id: productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }

    // ✅ analyzeReviews 함수 호출 (Python 서버 전체 파이프라인 사용)
    // analyzeReviews는 req.params.id를 사용하므로, req.params를 그대로 전달
    req.params.id = productId;
    return await analyzeReviews(req, res);
    
  } catch (err) {
    console.error("❌ 리뷰 분석 요청 오류:", err);
    res.status(500).json({ message: "리뷰 분석 요청 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 5-1. 분석 요청 상태 조회(분석 이력 조회) — history_id로 조회
// ==============================
/*export const getAnalysisStatus = async (req, res) => {
  try {
    const { analysisId } = req.params;

    const [[row]] = await db.query(
      `SELECT 
         history_id AS analysisId,
         status,
         review_count,
         uploaded_at,
         analyzed_at,
         model
       FROM tb_analysisHistory
        WHERE history_id = ?`,
      [analysisId]
    );

    if (!row) {
      return res.status(404).json({ message: "분석 이력을 찾을 수 없습니다." });
    }

    return res.json(row);
  } catch (err) {
    console.error("❌ 분석 상태 조회 오류:", err);
    return res.status(500).json({ message: "분석 상태 조회 중 서버 오류가 발생했습니다." });
  }
};*/

// ==============================
// 6. 제품 삭제
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

    // 제품 존재 확인
    const [[existingProduct]] = await db.query(
      "SELECT product_id FROM tb_product WHERE product_id = ?",
      [productIdNum]
    );

    if (!existingProduct) {
      return res.status(404).json({ message: "제품을 찾을 수 없습니다." });
    }

    // 제품 삭제
    const [result] = await db.query("DELETE FROM tb_product WHERE product_id = ?", [productIdNum]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "제품을 찾을 수 없습니다." });
    }

    res.json({
      message: "제품이 성공적으로 삭제되었습니다.",
      productId: productIdNum
    });

  } catch (err) {
    console.error("❌ 제품 삭제 오류:", err);
    console.error("❌ 에러 상세:", {
      message: err.message,
      stack: err.stack,
      code: err.code,
      sqlMessage: err.sqlMessage
    });
    res.status(500).json({ message: "제품 삭제 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 7. 제품 생성 (추가 기능)
// ==============================
export const createProduct = async (req, res) => {
  try {
    const { product_name, brand, category_id } = req.body;

    if (!product_name || !category_id) {
      return res.status(400).json({ message: "제품명과 카테고리는 필수입니다." });
    }

    const [result] = await db.query(
      "INSERT INTO tb_product (product_name, brand, category_id, created_at) VALUES (?, ?, ?, NOW())",
      [product_name, brand || null, category_id]
    );

    const productId = result.insertId;

    // TODO: 제품 생성 후 리뷰 분석 자동 실행
    // await requestAnalysis(productId);

    res.status(201).json({
      message: "제품이 성공적으로 생성되었습니다.",
      product: { product_id: productId, product_name, brand, category_id }
    });

  } catch (err) {
    console.error("❌ 제품 생성 오류:", err);
    res.status(500).json({ message: "제품 생성 중 서버 오류가 발생했습니다." });
  }
};

// ==============================
// 8. 제품 정보 수정 (추가 기능)
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

export const test = async (req, res) => {
  res.json({ message: "제품 테스트 API 작동 중" });
};

// ==============================
// 9. 리뷰 파일 업로드 및 삽입
// ==============================
// Multer 설정 (메모리 스토리지)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('CSV 또는 Excel 파일만 업로드할 수 있습니다.'), false);
    }
  }
});

// CSV 파일 파싱
const parseCSV = async (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer);
    
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

// Excel 파일 파싱
const parseExcel = (buffer) => {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    return jsonData;
  } catch (error) {
    throw new Error(`Excel 파일 파싱 오류: ${error.message}`);
  }
};

// 날짜 파싱 (다양한 형식 지원)
const parseDate = (dateValue) => {
  if (!dateValue) return null;
  
  // 이미 Date 객체인 경우
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  // 문자열인 경우
  if (typeof dateValue === 'string') {
    // ISO 형식
    if (dateValue.includes('T') || dateValue.includes('-')) {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) return date;
    }
    
    // YYYY-MM-DD 형식
    const dateMatch = dateValue.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (dateMatch) {
      const date = new Date(dateMatch[1], dateMatch[2] - 1, dateMatch[3]);
      if (!isNaN(date.getTime())) return date;
    }
  }
  
  // 숫자 타임스탬프인 경우
  if (typeof dateValue === 'number') {
    // Excel 날짜 형식 (1900-01-01 기준 일수) 또는 Unix 타임스탬프
    if (dateValue > 25569) { // Excel 날짜로 보이는 경우
      const date = new Date((dateValue - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) return date;
    } else {
      // Unix 타임스탬프 (초 단위)
      const date = new Date(dateValue * 1000);
      if (!isNaN(date.getTime())) return date;
    }
  }
  
  return null;
};

// 스팀 리뷰 평점 계산 (voted_up + weighted_vote_score)
const calculateSteamRating = (votedUp, weightedScore) => {
  const voted_up = votedUp === true || votedUp === 'True' || votedUp === 'true' || votedUp === 1 || votedUp === '1';
  const score = parseFloat(weightedScore) || 0.5;
  
  if (voted_up) {
    return 3.0 + (score * 2.0);   // 긍정 리뷰 → 3.0~5.0점
  } else {
    return score * 2.0;           // 부정 리뷰 → 0.0~2.0점
  }
};

// 중복 리뷰 체크
const checkDuplicateReview = async (productId, reviewText, reviewDate) => {
  try {
    const [rows] = await db.query(
      `SELECT review_id FROM tb_review 
       WHERE product_id = ? AND review_text = ? AND DATE(review_date) = DATE(?)`,
      [productId, reviewText, reviewDate]
    );
    return rows.length > 0;
  } catch (error) {
    console.error("❌ 중복 체크 오류:", error);
    return false;
  }
};

// 리뷰 업로드 메인 함수
export const uploadReviews = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "인증된 사용자 정보가 없습니다." });
    }
    
    if (!productId) {
      return res.status(400).json({ message: "제품 ID가 필요합니다." });
    }
    
    // 제품 소유권 확인
    const [productRows] = await db.query(
      "SELECT product_id, user_id FROM tb_product WHERE product_id = ?",
      [productId]
    );
    
    if (productRows.length === 0) {
      return res.status(404).json({ message: "제품을 찾을 수 없습니다." });
    }
    
    if (productRows[0].user_id !== userId) {
      return res.status(403).json({ message: "해당 제품에 대한 권한이 없습니다." });
    }
    
    // 파일과 매핑 정보 확인
    const files = req.files || [];
    // 프론트엔드에서 각 파일마다 mappings를 append하므로 배열로 받음
    const mappingsRaw = req.body.mappings || [];
    const mappings = Array.isArray(mappingsRaw) 
      ? mappingsRaw.map(m => typeof m === 'string' ? JSON.parse(m) : m)
      : [typeof mappingsRaw === 'string' ? JSON.parse(mappingsRaw) : mappingsRaw];
    
    if (files.length === 0) {
      return res.status(400).json({ message: "업로드할 파일이 없습니다." });
    }
    
    if (files.length !== mappings.length) {
      return res.status(400).json({ 
        message: `파일과 매핑 정보의 개수가 일치하지 않습니다. (파일: ${files.length}, 매핑: ${mappings.length})` 
      });
    }
    
    let totalInserted = 0;
    let totalSkipped = 0;
    let totalDuplicated = 0;
    const errors = [];
    
    // 각 파일 처리
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mapping = mappings[i];
      
      if (!mapping || !mapping.reviewColumn || !mapping.dateColumn) {
        errors.push(`${file.originalname}: 리뷰 컬럼과 날짜 컬럼 매핑이 필요합니다.`);
        continue;
      }
      
      try {
        let rows = [];
        const ext = path.extname(file.originalname).toLowerCase();
        
        // 파일 파싱
        if (ext === '.csv') {
          rows = await parseCSV(file.buffer);
        } else if (ext === '.xlsx' || ext === '.xls') {
          rows = parseExcel(file.buffer);
        } else {
          errors.push(`${file.originalname}: 지원하지 않는 파일 형식입니다.`);
          continue;
        }
        
        if (!rows || rows.length === 0) {
          errors.push(`${file.originalname}: 데이터가 없습니다.`);
          continue;
        }
        
        // 첫 번째 행에서 사용 가능한 컬럼명 확인 (스팀 리뷰용)
        const firstRow = rows[0] || {};
        const availableColumns = Object.keys(firstRow);
        const hasVotedUp = availableColumns.includes('voted_up');
        const hasWeightedScore = availableColumns.includes('weighted_vote_score');
        const isSteamFormat = hasVotedUp && hasWeightedScore;
        
        // 각 행 처리
        for (const row of rows) {
          try {
            const reviewText = String(row[mapping.reviewColumn] || '').trim();
            const dateValue = row[mapping.dateColumn];
            const ratingValue = mapping.ratingColumn ? row[mapping.ratingColumn] : null;
            
            // 필수 필드 검증
            if (!reviewText) {
              totalSkipped++;
              continue;
            }
            
            // 날짜 파싱
            const reviewDate = parseDate(dateValue);
            if (!reviewDate) {
              totalSkipped++;
              continue;
            }
            
            // 평점 처리
            let rating = 3.0; // 기본값
            
            // 스팀 리뷰 형식인 경우 (voted_up이 평점 컬럼으로 선택된 경우)
            if (isSteamFormat && mapping.ratingColumn === 'voted_up') {
              const votedUp = row['voted_up'];
              const weightedScore = row['weighted_vote_score'];
              rating = calculateSteamRating(votedUp, weightedScore);
            } 
            // 일반 평점 컬럼이 선택된 경우
            else if (ratingValue !== null && ratingValue !== undefined) {
              const parsedRating = parseFloat(ratingValue);
              if (!isNaN(parsedRating) && parsedRating >= 0 && parsedRating <= 5) {
                rating = parsedRating;
              }
            }
            
            // 중복 체크
            const isDuplicate = await checkDuplicateReview(productId, reviewText, reviewDate);
            if (isDuplicate) {
              totalDuplicated++;
              continue;
            }
            
            // 리뷰 삽입
            await db.query(
              `INSERT INTO tb_review (product_id, review_text, rating, review_date, source)
               VALUES (?, ?, ?, ?, ?)`,
              [productId, reviewText, rating, reviewDate, null]
            );
            
            totalInserted++;
          } catch (rowError) {
            console.error(`❌ 리뷰 삽입 오류 (${file.originalname}):`, rowError);
            totalSkipped++;
          }
        }
      } catch (fileError) {
        console.error(`❌ 파일 처리 오류 (${file.originalname}):`, fileError);
        errors.push(`${file.originalname}: ${fileError.message}`);
      }
    }
    
// TODO: 리뷰 업로드 후 리뷰 분석 자동 실행
if (totalInserted > 0) {
  await performAnalysis(productId);
}

analysisRequest
    res.json({
      message: "리뷰 업로드 완료",
      summary: {
        totalInserted,
        totalSkipped,
        totalDuplicated,
        totalProcessed: totalInserted + totalSkipped + totalDuplicated
      },
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (err) {
    console.error("❌ 리뷰 업로드 오류:", err);
    res.status(500).json({ 
      message: "리뷰 업로드 중 서버 오류가 발생했습니다.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ==============================
// 10. 제품 생성 (프론트엔드 방식에 맞춤)
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

// Multer 미들웨어 export
export { upload };
