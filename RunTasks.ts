/**
 * @fileoverview 任务执行器的核心逻辑，包含任务执行、失败重试和结果收集功能
 */

/**
 * 任务执行结果的类型定义
 * @template T - 任务执行结果的类型
 */
interface TaskResult<T> {
    /** 任务执行是否成功 */
    success: boolean
    /** 任务的索引 */
    index: number
    /** 任务执行结果，仅在成功时存在 */
    result?: T
    /** 任务执行错误信息，仅在失败时存在 */
    error?: Error
}

/**
 * 任务执行器的状态类型
 * @template T - 任务执行结果的类型
 */
interface TaskExecutorState<T> {
    /** 存储成功的任务结果 */
    successResults: Map<number, T>
    /** 存储失败的任务 */
    failedTasks: Map<number, () => Promise<T>>
}

/**
 * 创建任务执行器状态
 * @template T - 任务执行结果的类型
 * @returns 初始化的任务执行器状态
 */
function createTaskState<T>(): TaskExecutorState<T> {
    return {
        successResults: new Map(),
        failedTasks: new Map(),
    }
}

/**
 * 执行任务数组
 * @template T - 任务执行结果的类型
 * @param tasks - 需要执行的任务数组
 * @param state - 任务执行器状态
 * @param taskIndices - 任务索引映射，用于重试时保持原始索引
 * @returns 任务执行结果数组
 */
export async function executeTasks<T>(
    tasks: Array<() => Promise<T>>,
    state: TaskExecutorState<T>,
    taskIndices = new Map<() => Promise<T>, number>()
): Promise<TaskResult<T>[]> {
    /** 执行所有任务并收集结果 */
    const promises = tasks.map(async (task, currentIndex) => {
        /** 获取任务的原始索引 */
        const originalIndex = taskIndices.get(task) ?? currentIndex

        try {
            /** 执行任务 */
            const result = await task()
            /** 存储成功结果 */
            state.successResults.set(originalIndex, result)
            return { success: true, index: originalIndex, result }
        } catch (error) {
            /** 存储失败任务 */
            state.failedTasks.set(originalIndex, task)
            return {
                success: false,
                index: originalIndex,
                error: error instanceof Error ? error : new Error(String(error)),
            }
        }
    })

    return Promise.all(promises)
}

/**
 * 运行任务并管理状态
 * @template T - 任务执行结果的类型
 * @param tasks - 需要执行的任务数组
 * @returns 包含执行结果和状态的对象
 */
export async function runTasks<T>(tasks: Array<() => Promise<T>>): Promise<{
    results: TaskResult<T>[]
    state: TaskExecutorState<T>
}> {
    /** 创建新的状态 */
    const state = createTaskState<T>()
    /** 执行任务 */
    const results = await executeTasks(tasks, state)

    return { results, state }
}

/**
 * 重试失败的任务
 * @template T - 任务执行结果的类型
 * @param state - 当前任务执行器状态
 * @returns 重试结果和更新后的状态
 */
export async function retryFailedTasks<T>(state: TaskExecutorState<T>): Promise<{
    results: TaskResult<T>[]
    state: TaskExecutorState<T>
}> {
    const failedTasksArray = Array.from(state.failedTasks.entries())
    const taskIndices = new Map(failedTasksArray.map(([index, task]) => [task, index]))

    /** 清空失败任务列表 */
    state.failedTasks.clear()

    /** 执行重试 */
    const results = await executeTasks(
        failedTasksArray.map(([, task]) => task),
        state,
        taskIndices
    )

    return { results, state }
}

/**
 * 检查是否所有任务都执行成功
 * @template T - 任务执行结果的类型
 * @param state - 任务执行器状态
 * @returns 是否全部成功
 */
export function isAllSuccess<T>(state: TaskExecutorState<T>): boolean {
    return state.failedTasks.size === 0
}

/**
 * 获取任务执行的统计信息
 * @template T - 任务执行结果的类型
 * @param state - 任务执行器状态
 * @returns 任务统计信息
 */
export function getTaskStats<T>(state: TaskExecutorState<T>): {
    totalSuccess: number
    totalFailed: number
    successResults: Map<number, T>
    failedTasks: Map<number, () => Promise<T>>
} {
    return {
        totalSuccess: state.successResults.size,
        totalFailed: state.failedTasks.size,
        successResults: new Map(state.successResults),
        failedTasks: new Map(state.failedTasks),
    }
}

// 使用示例：
/*
async function example() {
    // 运行任务
    const { results, state } = await runTasks(tasks)

    // 检查结果
    if (isAllSuccess(state)) {
        const stats = getTaskStats(state)
        console.log('全部成功！', stats)
    } else {
        console.log('有任务失败，准备重试')
        const { results: retryResults, state: newState } = await retryFailedTasks(state)
        console.log('重试结果：', getTaskStats(newState))
    }
}
*/
