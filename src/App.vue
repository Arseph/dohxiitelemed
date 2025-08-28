<script setup lang="ts">
import ScrollToTop from '@core/components/ScrollToTop.vue'
import initCore from '@core/initCore'
import { initConfigStore, useConfigStore } from '@core/stores/config'
import { hexToRgb } from '@layouts/utils'
import { useTheme } from 'vuetify'
import { useOnlineStatus } from './composables/useOnlineStatus'
import ComingSoon from './pages/coming-soon.vue'
const { global } = useTheme()

// ℹ️ Sync current theme with initial loader theme
initCore()
initConfigStore()

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
