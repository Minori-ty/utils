export class RequestPool {
    /** 允许最大的请求数量 */
    maxConcurrent: number
    /** 当前活跃的请求数量 */
    activeCount = 0
    requestQueue: (() => Promise<void>)[] = []
    /** 任务计数器 */
    private taskCounter = 0

    constructor(maxConcurrent = 3) {
        this.maxConcurrent = maxConcurrent
    }

    add(request) {
        const taskId = ++this.taskCounter
        return new Promise((resolve, reject) => {
            const task = async () => {
                this.activeCount++
                console.log(`[${taskId}]🚀请求开始`)
                try {
                    const result = await request()
                    console.log(`[${taskId}]✅请求完成`)
                    resolve(result)
                } catch (error) {
                    console.log(`[${taskId}]❌请求失败`)
                    reject(error)
                } finally {
                    this.activeCount--
                    console.log(`[${taskId}]👌请求结束`)
                    this.runNext()
                }
            }
            if (this.activeCount < this.maxConcurrent) task()
            else this.requestQueue.push(task)
        })
    }

    runNext() {
        if (this.requestQueue.length > 0 && this.activeCount < this.maxConcurrent) {
            const nextTask = this.requestQueue.shift()!
            nextTask()
        }
    }
}
