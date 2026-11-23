<script setup lang="ts">
import { authStorage } from '@/utils/authStorage'
import ScrollToTop from '@core/components/ScrollToTop.vue'
import initCore from '@core/initCore'
import { initConfigStore, useConfigStore } from '@core/stores/config'
import { hexToRgb } from '@layouts/utils'
import Pusher from 'pusher-js'
import { useStore } from 'vuex'
import { useTheme } from 'vuetify'
import { useOnlineStatus } from './composables/useOnlineStatus'
import ComingSoon from './pages/coming-soon.vue'
const { global } = useTheme()
initCore()
initConfigStore()
interface MyNotification {
  id: number
  text: string
  title: string
  subtitle: string
  time: string
  isSeen: boolean
}
const store = useStore()
const pusher = new Pusher('0b758fd17aaeea982810', { cluster: 'ap2' })
let subscribedId: number | null = null

// Follow whoever is logged in. App.vue mounts once per page load, and login moves to
// /homes without a reload, so subscribing only on mount left a fresh login listening
// on `my-channel.undefined` (no live counters, labels or notifications until F5), and
// a logout + login as someone else kept receiving the previous user's events.
const subscribeTo = (id: number | null) => {
  if (id === subscribedId)
    return
  if (subscribedId !== null)
    pusher.unsubscribe(`my-channel.${subscribedId}`)
  subscribedId = id
  if (id === null)
    return

  pusher.subscribe(`my-channel.${id}`).bind(`my-event.${id}`, (data: any) => {
    // Re-broadcast in-page before showing the desktop notification, so pages that
    // refresh on activity from other users get it whatever the permission state.
    window.dispatchEvent(new CustomEvent('teleconsult-notification', { detail: data }))
    showNotification(data.title, data.subtitle)
  })
}

const cachedUserId = () => {
  try {
    return JSON.parse(authStorage.get('auth_user') || '{}')?.id ?? null
  }
  catch {
    return null
  }
}

watch(() => store.getters['auth/user']?.id ?? cachedUserId(), id => subscribeTo(id ?? null), { immediate: true })

onMounted(async () => {
  await requestNotificationPermission()
})
const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.error("This browser does not support desktop notification")
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  return false
}
// The bell list always gets the entry; only the desktop popup needs browser permission.
// Phones without the Notification API (iOS Safari) would throw on `Notification.permission`.
const showNotification = (title: string, body: string) => {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: "./public/ro12.png",
      })
    }
    catch {
      // Android Chrome only allows notifications from a service worker.
    }
  }
  {
    let notifications: MyNotification[] = []
    try {
      notifications = JSON.parse(localStorage.getItem("notifications") || "[]")
    }
    catch {}

    const newNotification: MyNotification = {
      id: Date.now(),
      text: body,
      title,
      subtitle: body,
      time: new Date().toLocaleString(),
      isSeen: false,
    }

    notifications.unshift(newNotification)
    localStorage.setItem("notifications", JSON.stringify(notifications))
    window.dispatchEvent(new Event("notifications-updated"))
  }
}
const testNotification = () => {
  showNotification("DOH XII TELEMEDICINE🚀", "New Teleconsultation Request!")
}
const configStore = useConfigStore()
const isUnderMain = false

const { isOnline } = useOnlineStatus()

watch(isOnline, (status) => {
  if (status) {
    console.log('📶 You are back online!')
  } else {
    console.log('📴 You are offline!')
  }
}, { immediate: true })
</script>

<template>
  <VLocaleProvider :rtl="configStore.isAppRTL">
    <!-- ℹ️ This is required to set the background color of active nav link based on currently active global theme's primary -->
    <VApp :style="`--v-global-theme-primary: ${hexToRgb(global.current.value.colors.primary)}`">
      <div v-if="isUnderMain" class="maintenance">
        <ComingSoon />
      </div>
      <div v-else>
        <RouterView />
        <Offline />
        <ScrollToTop />
      </div>
    </VApp>
  </VLocaleProvider>
</template>

<style scoped>

</style>
