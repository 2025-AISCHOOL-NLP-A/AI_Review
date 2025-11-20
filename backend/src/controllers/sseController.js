import { getTask } from "../utils/taskManager.js";
import jwt from "jsonwebtoken";

/**
 * SSE 엔드포인트: 업로드 진행 상황 스트리밍
 * GET /products/:productId/reviews/upload/progress/:taskId
 * EventSource는 헤더를 설정할 수 없으므로 쿼리 파라미터로 토큰을 받습니다.
 */
export const getUploadProgress = async (req, res) => {
    const { taskId } = req.params;
    
    // EventSource는 헤더를 설정할 수 없으므로 쿼리 파라미터에서 토큰 확인
    let userId = req.user?.id;
    
    // 쿼리 파라미터에서 토큰 확인 (EventSource용)
    if (!userId && req.query.token) {
        try {
            const token = req.query.token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.id;
        } catch (err) {
            return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
        }
    }

    if (!userId) {
        return res.status(401).json({ message: "인증된 사용자 정보가 없습니다." });
    }

    // Task 확인
    const task = getTask(taskId);
    if (!task) {
        return res.status(404).json({ message: "Task를 찾을 수 없습니다." });
    }

    // 소유권 확인
    if (task.userId !== userId) {
        return res.status(403).json({ message: "해당 Task에 대한 권한이 없습니다." });
    }

    // SSE 헤더 설정
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Nginx 버퍼링 비활성화

    // 초기 연결 메시지
    res.write(`data: ${JSON.stringify({
        progress: task.progress,
        message: task.message,
        status: task.status
    })}\n\n`);

    // 주기적으로 진행 상황 전송
    const interval = setInterval(() => {
        const currentTask = getTask(taskId);

        if (!currentTask) {
            // Task가 삭제된 경우 (타임아웃)
            res.write(`data: ${JSON.stringify({
                progress: 100,
                message: "Task가 만료되었습니다",
                status: "expired"
            })}\n\n`);
            clearInterval(interval);
            res.end();
            return;
        }

        // 진행 상황 전송
        res.write(`data: ${JSON.stringify({
            progress: currentTask.progress,
            message: currentTask.message,
            status: currentTask.status
        })}\n\n`);

        // 완료 또는 에러 시 연결 종료
        if (currentTask.status === 'completed' || currentTask.status === 'error') {
            clearInterval(interval);
            res.end();
        }
    }, 500); // 500ms마다 업데이트

    // 클라이언트 연결 종료 시 정리
    req.on('close', () => {
        clearInterval(interval);
        console.log(`🔌 SSE 연결 종료: Task ${taskId}`);
    });
};
