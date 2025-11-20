// Task 관리 시스템 (메모리 기반)
const taskStore = new Map();

// Task 생성
export const createTask = (productId, userId) => {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    taskStore.set(taskId, {
        taskId,
        productId,
        userId,
        progress: 0,
        message: "업로드 준비 중...",
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now()
    });

    console.log(`✅ Task 생성: ${taskId} (product: ${productId})`);
    return taskId;
};

// Task 조회
export const getTask = (taskId) => {
    return taskStore.get(taskId);
};

// Task 업데이트
export const updateTask = (taskId, progress, message, status = "processing") => {
    const task = taskStore.get(taskId);

    if (!task) {
        console.warn(`⚠️ Task not found: ${taskId}`);
        return false;
    }

    task.progress = progress;
    task.message = message;
    task.status = status;
    task.updatedAt = Date.now();

    taskStore.set(taskId, task);
    console.log(`📊 Task 업데이트: ${taskId} - ${progress}% - ${message}`);
    return true;
};

// Task 완료
export const completeTask = (taskId, message = "완료") => {
    return updateTask(taskId, 100, message, "completed");
};

// Task 에러
export const errorTask = (taskId, message) => {
    return updateTask(taskId, 0, message, "error");
};

// Task 삭제 (30분 후 자동 삭제)
export const scheduleTaskCleanup = (taskId, delayMs = 30 * 60 * 1000) => {
    setTimeout(() => {
        if (taskStore.has(taskId)) {
            taskStore.delete(taskId);
            console.log(`🗑️ Task 삭제: ${taskId}`);
        }
    }, delayMs);
};

// 모든 Task 조회 (디버깅용)
export const getAllTasks = () => {
    return Array.from(taskStore.values());
};

// Task 개수 조회
export const getTaskCount = () => {
    return taskStore.size;
};
