<script setup lang="ts">
import { changelog } from '@/changelog'

// Set in vite.config.ts from package.json
const version = __APP_VERSION__
const isChangelogOpen = ref(false)

// One tab per version; opens on the running version (or the newest entry)
const defaultTab = changelog.some(e => e.version === version) ? version : changelog[0]?.version
const activeVersion = ref(defaultTab)

watch(isChangelogOpen, open => {
  if (open)
    activeVersion.value = defaultTab
})
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
      <VTabs
        v-model="activeVersion"
        show-arrows
        class="px-4"
      >
        <VTab
          v-for="entry in changelog"
          :key="entry.version"
          :value="entry.version"
        >
          {{ entry.version }}
          <VChip
            v-if="entry.version === version"
            size="x-small"
            color="primary"
            label
            class="ms-2"
          >
            Current
          </VChip>
        </VTab>
      </VTabs>
      <VDivider />

      <VCardText>
        <VWindow
          v-model="activeVersion"
          :touch="false"
        >
          <VWindowItem
            v-for="entry in changelog"
            :key="entry.version"
            :value="entry.version"
          >
            <ul class="ps-5 text-body-1">
              <li
                v-for="change in entry.changes"
                :key="change"
                class="mb-1"
              >
                {{ change }}
              </li>
            </ul>
          </VWindowItem>
        </VWindow>
      </VCardText>
    </VCard>
  </VDialog>
</template>
