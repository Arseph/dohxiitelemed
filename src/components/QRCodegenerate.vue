<template>
<div class="flex flex-col gap-3 items-start">
<label class="text-sm font-medium">Enter text or URL</label>
<input
v-model="text"
type="text"
placeholder="https://example.com"
class="border rounded px-3 py-2 w-full"
/>


<canvas ref="canvasRef" class="rounded border"></canvas>


<div class="flex gap-2">
<button @click="downloadPng" class="px-3 py-2 rounded bg-black text-white">Download PNG</button>
<button @click="clearCanvas" class="px-3 py-2 rounded border">Clear</button>
</div>
</div>
</template>


<script setup lang="ts">
import QRCode from 'qrcode'
import { ref, watchEffect } from 'vue'


const canvasRef = ref<HTMLCanvasElement | null>(null)
const text = ref('https://jobs.dohsox.com') // default value; change as needed


// Render QR whenever text changes
watchEffect(async () => {
if (!canvasRef.value) return
if (!text.value) {
const ctx = canvasRef.value.getContext('2d')
if (ctx) ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
return
}
await QRCode.toCanvas(canvasRef.value, text.value, {
width: 256,
margin: 2,
errorCorrectionLevel: 'M',
})
})


function downloadPng() {
if (!canvasRef.value) return
const url = canvasRef.value.toDataURL('image/png')
const a = document.createElement('a')
a.href = url
a.download = 'qrcode.png'
a.click()
}


function clearCanvas() {
if (!canvasRef.value) return
const ctx = canvasRef.value.getContext('2d')
if (ctx) ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
}
</script>


<style scoped>
/* optional */
</style>
