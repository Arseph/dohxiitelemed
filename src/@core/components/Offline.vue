<script setup lang="ts">
import { useOnlineStatus } from '@/composables/useOnlineStatus'
import { ref, watch } from 'vue'

const { isOnline } = useOnlineStatus()

const isSnackbarVisible = ref(false)
const snackbarMessage = ref('')
const hasInitialCheckRun = ref(false)

watch(isOnline, status => {
  if (!hasInitialCheckRun.value) {
    hasInitialCheckRun.value = true
    if (status) return
  }

  isSnackbarVisible.value = true
  snackbarMessage.value = status
    ? '📶 You are back online!'
    : '📴 You are offline!'
}, { immediate: true })
</script>

<template>
  <VSnackbar
    v-model="isSnackbarVisible"
    :color="isOnline ? 'success' : 'error'"
    timeout="-1"
  >
    {{ snackbarMessage }}

    <template #actions>
      <VBtn
        color="white"
        @click="isSnackbarVisible = false"
        variant="text"
      >
        Close
      </VBtn>
    </template>
  </VSnackbar>
</template>
