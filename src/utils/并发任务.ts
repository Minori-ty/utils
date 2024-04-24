/**
 * 并发任务队列
 * @param tasks 所有任务的数组
 * @param parallelCount 并行运行任务的数量
 * @returns 完成的状态
 */
function paralleTask(tasks: (() => Promise<unknown>)[], parallelCount = 2) {
    return new Promise((resolve) => {
        if (tasks.length === 0) {
            resolve('当前任务队列为空')
            return
        }
        /** 下一个任务的下标 */
        let nextIndex = 0
        /** 记录当前完成的任务数量 */
        let finishCount = 0

        function _run() {
            const task = tasks[nextIndex]
            nextIndex++
            task().then(() => {
                finishCount++
                if (nextIndex < tasks.length) {
                    _run()
                } else if (finishCount === tasks.length) {
                    resolve('所有任务都完成了')
                }
            })
        }

        for (let i = 0; i < parallelCount && i < tasks.length; i++) {
            _run()
        }
    })
}

/**
 * 输入数量，产生异步任务
 * @param count 数量
 * @returns 返回异步任务的数组
 */
function mockTasks(count: number) {
    const arr: (() => Promise<unknown>)[] = []

    for (let i = 0; i < count; i++) {
        arr.push(function fn() {
            return new Promise((resolve) => {
                const timeStart = Date.now()
                console.log(`任务${i + 1}开始--->`)

                setTimeout(() => {
                    const timeEnd = Date.now()
                    console.log(`完成，耗时${timeEnd - timeStart}ms\n`)
                    resolve(null)
                }, Math.random() * 1000 + 3000)
            })
        })
    }

    return arr
}

// const tasks = mockTasks(10)
// paralleTask(tasks, 2)

const writeLine = (lineNumber: number, content: string) => {
    // 移动光标到指定行和第一列
    process.stdout.write(`\x1b[${lineNumber};0f`)
    // 清除当前行
    // process.stdout.write('\x1b[2K')
    // 输出新内容
    process.stdout.write(content)
}

for (let i = 2; i <= 11; i++) {
    console.log('第一行')

    // 模拟异步更新内容
    setTimeout(() => {
        writeLine(i, `这是第${i}行的新内容\n`)
    }, i * 1000)
}
