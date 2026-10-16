export type PermState = 'granted' | 'denied' | 'prompt' | 'unavailable'

export function useMediaPermissions() {
  const camera = ref<PermState>('prompt')
  const microphone = ref<PermState>('prompt')
  const notification = ref<PermState>('prompt')
  const secureContext = window.isSecureContext

  async function checkStatus() {
    notification.value = ('Notification' in window ? Notification.permission : 'unavailable') as PermState

    if (!secureContext || !navigator.permissions) {
      camera.value = 'unavailable'
      microphone.value = 'unavailable'
      return
    }
    try {
      const [c, m] = await Promise.all([
        navigator.permissions.query({ name: 'camera' as PermissionName }),
        navigator.permissions.query({ name: 'microphone' as PermissionName }),
      ])
      camera.value = c.state as PermState
      microphone.value = m.state as PermState
    } catch {
      camera.value = 'unavailable'
      microphone.value = 'unavailable'
    }
  }

  async function requestMedia(): Promise<boolean> {
    if (!secureContext || !navigator.mediaDevices) {
      camera.value = 'unavailable'
      microphone.value = 'unavailable'
      return false
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      stream.getTracks().forEach(t => t.stop())
      camera.value = 'granted'
      microphone.value = 'granted'
      return true
    } catch (e: any) {
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        camera.value = 'denied'
        microphone.value = 'denied'
      }
      return false
    }
  }

  async function requestNotification(): Promise<boolean> {
    if (!('Notification' in window)) return false
    if (Notification.permission !== 'default') {
      notification.value = Notification.permission as PermState
      return Notification.permission === 'granted'
    }
    try {
      const result = await Notification.requestPermission()
      notification.value = result as PermState
      return result === 'granted'
    } catch {
      return false
    }
  }

  return { camera, microphone, notification, secureContext, checkStatus, requestMedia, requestNotification }
}
