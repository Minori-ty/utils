type Listener<T> = (data: T, skipRemaining: () => void) => void;

interface PriorityListener<T> {
  listener: Listener<T>;
  priority: number;
}

/**
 * A class representing a priority-based event emitter.
 */
class PriorityEventEmitter<T> {
  private listeners: Map<string, PriorityListener<T>[]> = new Map();

  /**
   * Adds an event listener with a specified priority.
   * @param event - The name of the event.
   * @param listener - The event listener function.
   * @param priority - The priority of the listener (default is 0).
   */
  on(event: string, listener: Listener<T>, priority: number = 0): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const eventListeners = this.listeners.get(event)!;
    eventListeners.push({ listener, priority });
    eventListeners.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Emits an event, invoking listeners in order of their priority.
   * @param event - The name of the event.
   * @param data - The event data to pass to listeners.
   */
  emit(event: string, data: T): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    let skip = false;
    const skipRemaining = () => { skip = true; };

    for (const { listener } of eventListeners) {
      if (skip) break;
      listener(data, skipRemaining);
    }
  }

  /**
   * Removes a specific event listener.
   * @param event - The name of the event.
   * @param listener - The event listener function to remove.
   */
  off(event: string, listener: Listener<T>): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    this.listeners.set(event, eventListeners.filter(l => l.listener !== listener));
    if (this.listeners.get(event)!.length === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * Removes all listeners for a specific event.
   * @param event - The name of the event.
   */
  removeAllListeners(event: string): void {
    this.listeners.delete(event);
  }
}

// 使用示例
const emitter = new PriorityEventEmitter<string>();

// 高优先级监听器
const highPriorityListener: Listener<string> = (data, skipRemaining) => {
  console.log('High priority listener:', data);
  // 跳过后续监听器
  skipRemaining();
};
emitter.on('404', highPriorityListener, 10);

// 中优先级监听器
const mediumPriorityListener: Listener<string> = (data) => {
  console.log('Medium priority listener:', data);
};
emitter.on('404', mediumPriorityListener, 5);

// 低优先级监听器
const lowPriorityListener: Listener<string> = (data) => {
  console.log('Low priority listener:', data);
};
emitter.on('404', lowPriorityListener, 1);

// 触发事件
console.log('First emit:');
emitter.emit('404', 'Page not found');

// 再次触发事件，验证监听器依然存在
console.log('Second emit:');
emitter.emit('404', 'Page not found again');

// 移除特定监听器
emitter.off('404', mediumPriorityListener);

// 触发事件，验证监听器已被移除
console.log('Third emit after removing medium priority listener:');
emitter.emit('404', 'Page not found after removal');

// 移除所有监听器
emitter.removeAllListeners('404');

// 触发事件，验证所有监听器已被移除
console.log('Fourth emit after removing all listeners:');
emitter.emit('404', 'Page not found after removing all listeners');
