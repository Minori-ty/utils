/**
 * @fileoverview 图片加载进度跟踪器，支持回调和Promise两种使用方式
 */

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
 * @param delay - 完成后的延迟时间（毫秒），默认为300。用于确保用户能看到100%的进度
 * @returns Promise<string> - 返回加载完成的图片对象URL
 */
export const loadImageWithProgress = (
    url: string,
    onProgress: ProgressCallback,
    onComplete: CompleteCallback,
    onError: ErrorCallback,
    delay = 300
): Promise<string> => {
    return new Promise((resolve, reject) => {
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
            reject(new Error('Image loading failed'))
        }

        // 加载完成处理
        xhr.onload = () => {
            if (xhr.status === 200) {
                const url = URL.createObjectURL(xhr.response)
                if (delay > 0) {
                    onProgress(100)
                    setTimeout(() => {
                        onComplete(url)
                        resolve(url)
                    }, delay)
                } else {
                    onComplete(url)
                    resolve(url)
                }
            } else {
                onError()
                reject(new Error(`HTTP Error: ${xhr.status}`))
            }
        }

        xhr.send()
    })
}

// 使用示例：
/*
// 同时使用回调和Promise
async function example() {
    try {
        const objectUrl = await loadImageWithProgress(
            'https://example.com/image.jpg',
            (progress) => console.log(`Loading: ${progress}%`),
            (url) => {
                // 处理完成回调
                console.log('Complete callback:', url)
            },
            () => {
                // 处理错误回调
                console.error('Error callback')
            },
            500
        )
        console.log('Promise resolved:', objectUrl)
    } catch (error) {
        console.error('Promise rejected:', error)
    }
}
*/
