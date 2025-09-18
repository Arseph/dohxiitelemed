<script setup lang="ts">
import ScrollToTop from '@core/components/ScrollToTop.vue'
import initCore from '@core/initCore'
import { initConfigStore, useConfigStore } from '@core/stores/config'
import { hexToRgb } from '@layouts/utils'
import Pusher from 'pusher-js'
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
onMounted(async () => {
  const cachedUser =JSON.parse(localStorage.getItem('auth_user') || '{}')
  await requestNotificationPermission()

    var pusher = new Pusher('0b758fd17aaeea982810', {
      cluster: 'ap2'
    });

    var channel = pusher.subscribe(`my-channel.${cachedUser?.id}`);
    channel.bind(`my-event.${cachedUser?.id}`, function(data) {
      showNotification(data.title,data.subtitle)
    });
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
const showNotification = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "./public/ro12.png",
    })
    const saved = localStorage.getItem("notifications")
    const notifications: MyNotification[] = saved ? JSON.parse(saved) : []

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
