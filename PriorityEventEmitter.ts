/**
 * @fileoverview 优先级事件发射器的实现，支持按优先级顺序处理事件
 */

/**
 * 事件监听器函数类型
 * @template T - 事件数据类型
 * @param data - 事件数据
 * @param skipRemaining - 跳过剩余监听器的函数
 */
type Listener<T> = (data: T, skipRemaining: () => void) => void

/**
 * 带优先级的事件监听器接口
 * @template T - 事件数据类型
 */
interface PriorityListener<T> {
    /** 监听器函数 */
    listener: Listener<T>
    /** 监听器优先级，数值越大优先级越高 */
    priority: number
}

/**
 * 优先级事件发射器类
 * 支持为事件监听器设置优先级，按优先级顺序触发事件
 * @template T - 事件数据类型
 */
class PriorityEventEmitter<T> {
    /** 存储事件名称到监听器数组的映射 */
    private listeners: Map<string, PriorityListener<T>[]> = new Map()

    /**
     * 添加事件监听器
     * @param event - 事件名称
     * @param listener - 事件监听器函数
     * @param priority - 监听器优先级，默认为0，数值越大优先级越高
     */
    on(event: string, listener: Listener<T>, priority: number = 0): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, [])
        }

        const eventListeners = this.listeners.get(event)!
        eventListeners.push({ listener, priority })
        // 按优先级降序排序
        eventListeners.sort((a, b) => b.priority - a.priority)
    }

    /**
     * 触发事件
     * 按优先级顺序调用监听器，支持通过 skipRemaining 跳过剩余监听器
     * @param event - 事件名称
     * @param data - 要传递给监听器的事件数据
     */
    emit(event: string, data: T): void {
        const eventListeners = this.listeners.get(event)
        if (!eventListeners) return

        let skip = false
        const skipRemaining = () => {
            skip = true
        }

        for (const { listener } of eventListeners) {
            if (skip) break
            listener(data, skipRemaining)
        }
    }

    /**
     * 移除特定事件的特定监听器
     * @param event - 事件名称
     * @param listener - 要移除的监听器函数
     */
    off(event: string, listener: Listener<T>): void {
        const eventListeners = this.listeners.get(event)
        if (!eventListeners) return

        this.listeners.set(
            event,
            eventListeners.filter((l) => l.listener !== listener)
        )
        // 如果没有监听器了，删除该事件
        if (this.listeners.get(event)!.length === 0) {
            this.listeners.delete(event)
        }
    }

    /**
     * 移除特定事件的所有监听器
     * @param event - 事件名称
     */
    removeAllListeners(event: string): void {
        this.listeners.delete(event)
    }
}

// 使用示例
/** 创建事件发射器实例 */
const emitter = new PriorityEventEmitter<string>()

/** 高优先级监听器 */
const highPriorityListener: Listener<string> = (data, skipRemaining) => {
    console.log('高优先级监听器:', data)
    // 跳过后续监听器
    skipRemaining()
}
emitter.on('404', highPriorityListener, 10)

/** 中优先级监听器 */
const mediumPriorityListener: Listener<string> = (data) => {
    console.log('中优先级监听器:', data)
}
emitter.on('404', mediumPriorityListener, 5)

/** 低优先级监听器 */
const lowPriorityListener: Listener<string> = (data) => {
    console.log('低优先级监听器:', data)
}
emitter.on('404', lowPriorityListener, 1)

// 触发事件示例
console.log('第一次触发:')
emitter.emit('404', '页面未找到')

console.log('第二次触发:')
emitter.emit('404', '页面再次未找到')

// 移除特定监听器示例
emitter.off('404', mediumPriorityListener)

console.log('移除中优先级监听器后的第三次触发:')
emitter.emit('404', '移除监听器后页面未找到')

// 移除所有监听器示例
emitter.removeAllListeners('404')

console.log('移除所有监听器后的第四次触发:')
emitter.emit('404', '移除所有监听器后页面未找到')
