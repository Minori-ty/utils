type Task<T> = () => Promise<T>;

class AsyncTaskPool<T = any> {
    /** 最大并发数 */
    private concurrency: number;
    /** 当前正在运行的任务数量 */
    private runningCount = 0;
    /** 任务队列 */
    private taskQueue: Task<T>[] = [];
    /** 已完成任务的结果 */
    private results: T[] = [];
    /** 是否已完成所有任务 */
    private finished = false;
    /** 等待所有任务完成的 Promise 的 resolve 回调列表 */
    private pendingResolvers: (() => void)[] = [];

    constructor(concurrency = 3) {
        this.concurrency = concurrency;
    }

    /** 添加任务 */
    add(task: Task<T>) {
        if (this.finished) {
            throw new Error('任务池已关闭，不能再添加任务');
        }
        this.taskQueue.push(task);
        this.runNext();
    }

    /**
     * 内部调度器
     */
    private runNext() {
        while (
            this.runningCount < this.concurrency &&
            this.taskQueue.length > 0
        ) {
            const task = this.taskQueue.shift()!;
            this.runningCount++;

            task()
                .then(res => {
                    this.results.push(res);
                })
                .catch(() => {
                    // 失败重试，重新丢回队列
                    this.taskQueue.push(task);
                })
                .finally(() => {
                    this.runningCount--;
                    this.runNext();
                    this.checkIfDone();
                });
        }
    }

    /**
     * 判断是否所有任务都完成
     */
    private checkIfDone() {
        if (this.runningCount === 0 && this.taskQueue.length === 0) {
            this.finished = true;
            this.pendingResolvers.forEach(resolve => resolve());
            this.pendingResolvers = [];
        }
    }

    /**
     *
     * 等待所有任务完成
     */
    async awaitAll(): Promise<T[]> {
        if (this.finished) return this.results;
        return new Promise<T[]>(resolve => {
            this.pendingResolvers.push(() => resolve(this.results));
        });
    }
}
