<template>
  <Notifications
    :notifications="notifications"
    @remove="removeNotification"
    @read="markRead"
    @unread="markUnRead"
    @click:notification="handleNotificationClick"
  />
</template>

<script lang="ts" setup>
import type { Notification } from '@layouts/types'
import { onMounted, ref } from 'vue'

const notifications = ref<Notification[]>([])

const loadNotifications = () => {
  const saved = localStorage.getItem("notifications")
  notifications.value = saved ? JSON.parse(saved) : []
}
const saveToLocalStorage = () => {
  localStorage.setItem("notifications", JSON.stringify(notifications.value))
}
onMounted(() => {
  loadNotifications()
  window.addEventListener("notifications-updated", loadNotifications)
})

onBeforeUnmount(() => {
  window.removeEventListener("notifications-updated", loadNotifications)
})
const removeNotification = (notificationId: number) => {
  notifications.value = notifications.value.filter(item => item.id !== notificationId)
  saveToLocalStorage()
}

const markRead = (notificationIds: number[]) => {
  notifications.value.forEach(item => {
    if (notificationIds.includes(item.id))
      item.isSeen = true
  })
  saveToLocalStorage()
}

const markUnRead = (notificationIds: number[]) => {
  notifications.value.forEach(item => {
    if (notificationIds.includes(item.id))
      item.isSeen = false
  })
  saveToLocalStorage()
}

const handleNotificationClick = (notification: Notification) => {
  if (!notification.isSeen)
    markRead([notification.id])
    saveToLocalStorage()
}
</script>
