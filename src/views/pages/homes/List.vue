<script setup lang="ts">
import { ref } from 'vue'

// Logistic data
const logisticData = ref([
  { icon: 'tabler-video-plus', color: 'primary', title: 'Start Consultation', isHover: false, modal: 'start' },
  { icon: 'tabler-video', color: 'warning', title: 'Join Teleconsultation', isHover: false, modal: 'join' },
  { icon: 'tabler-calendar-clock', color: 'error', title: 'Schedule Teleconsultation', isHover: false, modal: 'schedule' },
])

// Track which modal is open
const activeModal = ref<string | null>(null)

// Function to open modal
const openModal = (modal: string) => {
  activeModal.value = modal
}

// Function to close modal
const closeModal = () => {
  activeModal.value = null
}
</script>

<template>
  <VRow>
    <VCol
      v-for="(data, index) in logisticData"
      :key="index"
      cols="12"
      md="4"
      sm="6"
    >
      <VCard
        class="logistics-card-statistics cursor-pointer"
        :style="data.isHover ? `border-block-end-color: rgb(var(--v-theme-${data.color}))` : `border-block-end-color: rgba(var(--v-theme-${data.color}),0.38)`"
        @mouseenter="data.isHover = true"
        @mouseleave="data.isHover = false"
        @click="openModal(data.modal)"
      >
        <VCardText>
          <div class="d-flex align-center justify-center gap-x-4 mb-1">
            <VAvatar variant="tonal" :color="data.color" rounded>
              <VIcon :icon="data.icon" size="28" />
            </VAvatar>
          </div>
          <div class="d-flex align-center justify-center text-body-1 mb-1">
            {{ data.title }}
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- Single Dialog -->
  <VDialog v-model="activeModal" max-width="500">
    <VCard>
      <VCardTitle>
        <!-- Different titles based on modal -->
        <span v-if="activeModal === 'start'">Start Consultation</span>
        <span v-else-if="activeModal === 'join'">Join Teleconsultation</span>
        <span v-else-if="activeModal === 'schedule'">Schedule Teleconsultation</span>
      </VCardTitle>

      <VCardText>
        <!-- Different modal body -->
        <div v-if="activeModal === 'start'">
          🚀 You can start a new consultation here.
        </div>

        <div v-else-if="activeModal === 'join'">
          🔗 Enter meeting details to join your teleconsultation.
        </div>

        <div v-else-if="activeModal === 'schedule'">
          📅 Choose a date and time to schedule a teleconsultation.
        </div>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn color="primary" @click="closeModal">Close</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>


<style lang="scss" scoped>
@use "@core/scss/base/mixins" as mixins;

.logistics-card-statistics {
  border-block-end-style: solid;
  border-block-end-width: 2px;

  &:hover {
    border-block-end-width: 3px;
    margin-block-end: -1px;

    @include mixins.elevation(8);

    transition: all 0.1s ease-out;
  }
}

.skin--bordered {
  .logistics-card-statistics {
    border-block-end-width: 2px;

    &:hover {
      border-block-end-width: 3px;
      margin-block-end: -2px;
      transition: all 0.1s ease-out;
    }
  }
}
</style>

