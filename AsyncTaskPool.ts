class AsyncTaskPool<T = any> {
    // 最大并发数，默认为3
    private maxConcurrency: number;
    // 等待执行的任务队列
    private waitingTasks: Array<() => Promise<T>> = [];
    // 当前正在执行的任务数量
    private runningTasks: number = 0;
    // 已完成的任务结果
    private results: T[] = [];
    // 所有任务是否都已完成
    private allCompleted: boolean = false;
    // 用于等待所有任务完成的Promise
    private completionPromise: Promise<T[]>;
    private resolveCompletion!: (results: T[]) => void;
    private rejectCompletion!: (error: Error) => void;

    constructor(maxConcurrency: number = 3) {
        if (maxConcurrency < 1) {
            throw new Error('最大并发数必须至少为1');
        }
        this.maxConcurrency = maxConcurrency;
        this.completionPromise = new Promise((resolve, reject) => {
            this.resolveCompletion = resolve;
            this.rejectCompletion = reject;
        });
    }

    /**
     * 添加任务到任务池
     * @param task 异步任务函数
     */
    addTask(task: () => Promise<T>): void {
        if (this.allCompleted) {
            throw new Error('所有任务已完成，无法添加新任务');
        }
        this.waitingTasks.push(task);
        // 尝试执行任务
        this.runTasks().catch(this.rejectCompletion);
    }

    /**
     * 执行任务队列中的任务
     */
    private async runTasks(): Promise<void> {
        // 当有可用并发槽且有等待任务时，继续执行
        while (
            this.runningTasks < this.maxConcurrency &&
            this.waitingTasks.length > 0
        ) {
            const task = this.waitingTasks.shift();
            if (!task) continue;

            this.runningTasks++;

            try {
                // 执行任务并获取结果
                const result = await task();
                this.results.push(result);
            } catch (error) {
                console.error('任务执行失败，将重试:', error);
                // 任务失败，重新添加到队列尾部
                this.waitingTasks.push(task);
            } finally {
                this.runningTasks--;
                // 检查是否所有任务都已完成
                this.checkAllCompleted();
            }
        }
    }

    /**
     * 检查是否所有任务都已完成
     */
    private checkAllCompleted(): void {
        if (
            this.runningTasks === 0 &&
            this.waitingTasks.length === 0 &&
            !this.allCompleted
        ) {
            this.allCompleted = true;
            this.resolveCompletion(this.results);
        }
    }

    /**
     * 等待所有任务完成
     * @returns 所有任务成功完成后的结果数组
     */
    waitForAll(): Promise<T[]> {
        return this.completionPromise;
    }
}
