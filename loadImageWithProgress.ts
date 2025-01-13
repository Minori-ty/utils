/**
 * 图片加载进度回调函数类型
 * @param progress - 加载进度，0-100
 */
type ProgressCallback = (progress: number) => void

/**
 * 图片加载完成回调函数类型
 * @param objectUrl - 加载完成的图片对象URL
 */
type CompleteCallback = (objectUrl: string) => void

/**
 * 图片加载错误回调函数类型
 */
type ErrorCallback = () => void

/**
 * 加载图片并跟踪进度
 * @param url - 图片URL
 * @param onProgress - 进度回调函数，用于更新加载进度（0-100）
 * @param onComplete - 完成回调函数，返回加载完成的图片对象URL
 * @param onError - 错误回调函数，当加载失败时调用
 * @param delay - 完成后的延迟时间（毫秒），默认为0。用于确保用户能看到100%的进度
 * @returns void
 */
const loadImageWithProgress = (
    url: string,
    onProgress: ProgressCallback,
    onComplete: CompleteCallback,
    onError: ErrorCallback,
    delay = 0
): void => {
    // 创建 XHR 请求
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url, true)
    xhr.responseType = 'blob'

    // 处理加载进度
    xhr.onprogress = (event) => {
        if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100)
            onProgress(percentComplete)
        }
    }

    // 处理加载错误
    xhr.onerror = () => {
        console.error('Image loading failed')
        onError()
    }

    // 加载完成处理
    xhr.onload = () => {
        if (xhr.status === 200) {
            const url = URL.createObjectURL(xhr.response)
            if (delay > 0) {
                onProgress(100)
                setTimeout(() => onComplete(url), delay)
            } else {
                onComplete(url)
            }
        }
    }

    xhr.send()
}
