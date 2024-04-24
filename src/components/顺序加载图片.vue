<template>
    <div class="page"></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

const arr: string[] = []

for (let i = 0; i < 20; i++) {
    arr.push(
        `https://picsum.photos/${Math.floor(Math.random() * 400 + 1)}/${Math.floor(Math.random() * 500 + 1)}?id=${i}`
    )
}

onMounted(() => {
    runTask(arr, 4)
})

function runTask(tasks: string[], count: number) {
    let nextIndex = 0
    let finishCount = 0

    function createImg() {
        if (arr.length === 0) return
        const img = new Image()
        img.src = arr[nextIndex]
        document.querySelector('.page')!.appendChild(img)
        nextIndex++
        img.onload = function () {
            finishCount++
            if (nextIndex < tasks.length) {
                createImg()
            } else if (finishCount === tasks.length) {
                console.log(finishCount)
            }
        }
    }

    for (let i = 0; i < count && i < tasks.length; i++) {
        createImg()
    }
}
</script>

<style scoped></style>
