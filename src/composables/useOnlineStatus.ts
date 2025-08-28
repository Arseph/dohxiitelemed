import { onMounted, onUnmounted, ref } from 'vue'

export function useOnlineStatus() {
  const isOnline = ref(true)
  let timeoutId: number

  const checkConnection = async () => {
    try {
      await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-store',
        mode: 'no-cors'
      })
      isOnline.value = true
    } catch {
      isOnline.value = false
    } finally {
      timeoutId = setTimeout(
        checkConnection, 
        isOnline.value ? 30000 : 5000 
      )
    }
  }

  onMounted(() => {
    checkConnection()
    window.addEventListener('online', checkConnection)
    window.addEventListener('offline', checkConnection)
  })

  onUnmounted(() => {
    clearTimeout(timeoutId)
    window.removeEventListener('online', checkConnection)
    window.removeEventListener('offline', checkConnection)
  })

  return { isOnline }
}
