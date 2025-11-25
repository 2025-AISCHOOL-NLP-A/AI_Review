import db from "../models/db.js";
import path from "path";
import { updateTask, completeTask, errorTask } from "../utils/taskManager.js";
import { analyzeProductReviews } from "../services/absaService.js";
import XLSX from "xlsx";
import csv from "csv-parser";
import { Readable } from "stream";

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

// 날짜 파싱
const parseDate = (dateValue) => {
    if (!dateValue) return null;

    if (dateValue instanceof Date) {
        return dateValue;
    }

    if (typeof dateValue === 'string') {
        if (dateValue.includes('T') || dateValue.includes('-')) {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) return date;
        }

        const dateMatch = dateValue.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
        if (dateMatch) {
            const date = new Date(dateMatch[1], dateMatch[2] - 1, dateMatch[3]);
            if (!isNaN(date.getTime())) return date;
        }
    }

    if (typeof dateValue === 'number') {
        if (dateValue > 25569) {
            const date = new Date((dateValue - 25569) * 86400 * 1000);
            if (!isNaN(date.getTime())) return date;
        } else {
            const date = new Date(dateValue * 1000);
            if (!isNaN(date.getTime())) return date;
        }
    }

    return null;
};

// 스팀 리뷰 평점 계산
const calculateSteamRating = (votedUp, weightedScore) => {
    const voted_up = votedUp === true || votedUp === 'True' || votedUp === 'true' || votedUp === 1 || votedUp === '1';
    const score = parseFloat(weightedScore) || 0.5;

    if (voted_up) {
        return 3.0 + (score * 2.0);
    } else {
        return score * 2.0;
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

// 백그라운드 리뷰 처리 함수
export const processReviewsInBackground = async (taskId, productId, files, mappings, autoAnalyze = false) => {
    try {
        updateTask(taskId, 5, "파일 처리 시작...", "processing");

        let totalInserted = 0;
        let totalSkipped = 0;
        let totalDuplicated = 0;
        const errors = [];

        // 각 파일 처리
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const mapping = mappings[i];

            const fileProgress = 5 + (i / files.length) * 20; // 5% ~ 25%
            updateTask(taskId, fileProgress, `파일 처리 중... (${i + 1}/${files.length})`, "processing");

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

                // 첫 번째 행에서 사용 가능한 컬럼명 확인
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

                        if (!reviewText) {
                            totalSkipped++;
                            continue;
                        }

                        const reviewDate = parseDate(dateValue);
                        if (!reviewDate) {
                            totalSkipped++;
                            continue;
                        }

                        let rating = 3.0;

                        if (isSteamFormat && mapping.ratingColumn === 'voted_up') {
                            const votedUp = row['voted_up'];
                            const weightedScore = row['weighted_vote_score'];
                            rating = calculateSteamRating(votedUp, weightedScore);
                        } else if (ratingValue !== null && ratingValue !== undefined) {
                            const parsedRating = parseFloat(ratingValue);
                            if (!isNaN(parsedRating) && parsedRating >= 0 && parsedRating <= 5) {
                                rating = parsedRating;
                            }
                        }

                        const isDuplicate = await checkDuplicateReview(productId, reviewText, reviewDate);
                        if (isDuplicate) {
                            totalDuplicated++;
                            continue;
                        }

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

        updateTask(taskId, 30, `파일 처리 완료 (${totalInserted}개 삽입)`, "processing");

        // 리뷰 분석 실행
        if (autoAnalyze && totalInserted > 0) {
            updateTask(taskId, 35, "AI 분석 시작...", "processing");

            try {
                // Model Server SSE 연동
                const modelServerUrl = process.env.MODEL_SERVER_URL || 'http://localhost:8000';
                const response = await fetch(`${modelServerUrl}/v1/products/${productId}/reviews/analysis`, {
                    method: 'POST'
                });

                if (!response.ok) {
                    throw new Error(`Model Server 응답 오류: ${response.status}`);
                }

                // SSE 스트림 읽기
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.substring(6));

                                // Model Server 진행률을 Task에 반영 (35% ~ 100%)
                                const adjustedProgress = 35 + (data.progress * 0.65);
                                updateTask(taskId, Math.round(adjustedProgress), data.message, "processing");

                                // 완료 또는 에러 처리
                                if (data.step === 'complete' || data.step === 'result') {
                                    completeTask(taskId, "분석 완료!");
                                    console.log(`✅ Task ${taskId} 완료`);
                                    return;
                                } else if (data.step === 'error') {
                                    errorTask(taskId, data.message);
                                    console.error(`❌ Task ${taskId} 에러:`, data.message);
                                    return;
                                }
                            } catch (parseError) {
                                console.error("SSE 데이터 파싱 오류:", parseError);
                            }
                        }
                    }
                }

                completeTask(taskId, "분석 완료!");
            } catch (analysisError) {
                console.error(`❌ 분석 오류 (Task: ${taskId}):`, analysisError);
                errorTask(taskId, `분석 실패: ${analysisError.message}`);
            }
        } else {
            completeTask(taskId, "업로드 완료 (분석할 리뷰 없음)");
        }

    } catch (error) {
        console.error(`❌ 백그라운드 처리 오류 (Task: ${taskId}):`, error);
        errorTask(taskId, `처리 실패: ${error.message}`);
    }
};
