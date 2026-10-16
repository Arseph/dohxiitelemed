<script setup lang="ts">
// Set in vite.config.ts from package.json and the current git commit
const version = __APP_VERSION__
const commit = __APP_COMMIT__
</script>

<template>
  <div class="h-100 d-flex align-center justify-md-space-between justify-center">
    <!-- 👉 Footer: left content -->
    <span class="d-flex align-center text-medium-emphasis">
      Developed
      By <a
        href="https://dohsox.com"
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary ms-1"
      >ICT Unit | Department of Health CHD XII</a>
    </span>
    <span class="d-md-flex gap-x-4 text-primary">
      <b
        class="danger"
        :title="commit ? `Build ${commit}` : undefined"
      >Version {{ version }}<span v-if="commit"> ({{ commit }})</span></b>
    </span>
  </div>
</template>
