<script setup lang="ts">
import { changelog } from '@/changelog'

// Set in vite.config.ts from package.json
const version = __APP_VERSION__
const isChangelogOpen = ref(false)
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
      <a
        href="#"
        class="text-primary font-weight-bold"
        title="What's new"
        @click.prevent="isChangelogOpen = true"
      >Version {{ version }}</a>
    </span>
  </div>

  <VDialog
    v-model="isChangelogOpen"
    max-width="560"
    scrollable
  >
    <DialogCloseBtn @click="isChangelogOpen = false" />
    <VCard title="What's new">
      <VCardText>
        <div
          v-for="(entry, i) in changelog"
          :key="entry.version"
          :class="{ 'mt-6': i > 0 }"
        >
          <div class="d-flex align-center gap-2 mb-2">
            <h6 class="text-h6">
              Version {{ entry.version }}
            </h6>
            <VChip
              v-if="entry.version === version"
              size="small"
              color="primary"
              label
            >
              Current
            </VChip>
            <span class="text-body-2 text-disabled ms-auto">{{ entry.date }}</span>
          </div>
          <ul class="ps-5 text-body-1">
            <li
              v-for="change in entry.changes"
              :key="change"
              class="mb-1"
            >
              {{ change }}
            </li>
          </ul>
        </div>
      </VCardText>
    </VCard>
  </VDialog>
</template>
