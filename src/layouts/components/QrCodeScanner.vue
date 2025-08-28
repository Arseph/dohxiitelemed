<template>
    <IconBtn color="rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity))" to="/profile/qrscan">
      <VIcon
        icon="tabler-scan"
        size="24"
      />
  
      <VTooltip
        activator="parent"
        open-delay="1000"
        scroll-strategy="close"
      >
        <span class="text-capitalize">QR SCANNER</span>
      </VTooltip>
    </IconBtn>
  </template>
