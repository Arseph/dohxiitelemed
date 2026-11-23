<script setup lang="ts">
import { useDisplay } from 'vuetify'
import EditPatientProfile from './EditPatientProfile.vue'
import MedicalHistory from './MedicalHistory.vue'
import Teleconsultations from './Teleconsultations.vue'

type TabKey = 'profile' | 'teleconsultations' | 'medicalhistory'

const props = defineProps<{ patient: Record<string, any> }>()

const emit = defineEmits<{
  close: []
  updated: []
  saved: []
}>()

const { smAndDown } = useDisplay()

// Local copy so a save can update the header without waiting for the parent
const localPatient = reactive<Record<string, any>>({ ...props.patient })

watch(() => props.patient, val => {
  Object.assign(localPatient, val)
}, { immediate: true })

const tabs: { value: TabKey; title: string; short: string; icon: string }[] = [
  { value: 'profile', title: 'Profile', short: 'Profile', icon: 'tabler-user' },
  { value: 'teleconsultations', title: 'Teleconsultations', short: 'Consults', icon: 'tabler-video' },
  { value: 'medicalhistory', title: 'Medical History', short: 'History', icon: 'tabler-heart-rate-monitor' },
]

const activeTab = ref<TabKey>('profile')

// Remount the profile form when coming back to it so it reloads fresh data
const profileKey = ref(0)

watch(activeTab, val => {
  if (val === 'profile')
    profileKey.value++
})

const civilStatusOptions: Record<string, string> = {
  0: 'Single',
  1: 'Married',
  2: 'Widowed',
  3: 'Separated',
  4: 'Divorced',
}

const civilStatusTitle = computed(() => civilStatusOptions[String(localPatient.civil_stat_code ?? '')] ?? '')

const summary = computed(() => [
  { label: 'Age', value: localPatient.age && localPatient.age !== 'N/A' ? `${localPatient.age} old` : '' },
  { label: 'Born', value: localPatient.dob_formatted !== 'N/A' ? localPatient.dob_formatted : '' },
  { label: 'Sex', value: localPatient.sex_code },
  { label: 'Civil status', value: civilStatusTitle.value },
].filter(item => item.value))

const imageUrl = computed(() => {
  const path = localPatient.pat_image

  return typeof path === 'string' && path ? `/${path.replace(/^\/+/, '')}` : ''
})

// Teleconsultations hides the sidebar while a consultation's forms are open
const isHidden = ref(false)

function handlePatientUpdated(updatedPatient: any) {
  Object.assign(localPatient, updatedPatient)
  emit('close')
  emit('saved')
}
</script>

<template>
  <div
    class="patient-profile"
    :class="{ 'patient-profile--phone': smAndDown }"
  >
    <!-- Sidebar on desktop; compact header with a tab strip on phones -->
    <Transition name="slide-left">
      <aside
        v-if="!isHidden"
        class="patient-profile__side"
      >
        <div class="patient-profile__identity">
          <VAvatar
            :size="smAndDown ? 72 : 175"
            class="elevation-1 avatar-border-blue"
            rounded="lg"
            variant="tonal"
          >
            <VImg
              v-if="imageUrl"
              :src="imageUrl"
              alt="Profile picture"
            />
            <VIcon
              v-else
              icon="tabler-user-circle"
              :size="smAndDown ? 52 : 126"
              color="blue-grey-darken-2"
            />
          </VAvatar>

          <div class="patient-profile__info">
            <div class="patient-profile__name">
              {{ localPatient.name }}
            </div>
            <dl class="patient-profile__facts">
              <div
                v-for="item in summary"
                :key="item.label"
              >
                <dt>{{ item.label }}</dt>
                <dd>{{ item.value }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <VTabs
          v-model="activeTab"
          class="royalblue-tabs patient-profile__tabs"
          :direction="smAndDown ? 'horizontal' : 'vertical'"
          :grow="smAndDown"
          :density="smAndDown ? 'comfortable' : 'default'"
        >
          <VTab
            v-for="tab in tabs"
            :key="tab.value"
            :value="tab.value"
            class="royalblue-tab"
          >
            <VIcon
              :start="!smAndDown"
              :icon="tab.icon"
              :size="smAndDown ? 18 : 20"
            />
            <span :class="{ 'ms-1': smAndDown }">{{ smAndDown ? tab.short : tab.title }}</span>
          </VTab>
        </VTabs>
      </aside>
    </Transition>

    <VDivider
      v-if="!isHidden && !smAndDown"
      vertical
    />

    <!-- Tab content -->
    <section class="patient-profile__content">
      <VWindow
        v-model="activeTab"
        :touch="false"
      >
        <VWindowItem value="profile">
          <EditPatientProfile
            :key="profileKey"
            :patient="localPatient"
            @updated="handlePatientUpdated"
          />
        </VWindowItem>

        <VWindowItem value="teleconsultations">
          <Teleconsultations
            :patient="localPatient"
            @updated="handlePatientUpdated"
            @hide-column="isHidden = $event"
          />
        </VWindowItem>

        <VWindowItem value="medicalhistory">
          <MedicalHistory
            :patient="localPatient"
            @updated="handlePatientUpdated"
            @hide-column="isHidden = $event"
          />
        </VWindowItem>
      </VWindow>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.patient-profile {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;

  &__side {
    position: sticky;
    inset-block-start: 0;
    flex: 0 0 25%;
    max-inline-size: 300px;
  }

  &__identity {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__identity > .v-avatar {
    margin-inline: auto;
  }

  &__name {
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  &__facts {
    margin: 0.375rem 0 0;

    div {
      display: flex;
      gap: 0.375rem;
      line-height: 1.6;
    }

    dt {
      color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
    }

    dt::after {
      content: ":";
    }

    dd {
      margin: 0;
      font-weight: 600;
    }
  }

  &__tabs {
    margin-block-start: 1.5rem;
  }

  &__content {
    flex: 1 1 0;
    min-inline-size: 0;
  }

  // Vuetify keeps a radio group's question on one line and cuts it off with "…";
  // the consultation forms ask long questions ("Prior to teleconsultation proper…")
  &__content :deep(.v-radio-group > .v-input__control > .v-label) {
    overflow: visible;
    white-space: normal;
    line-height: 1.4;
  }

  // Phones: header (photo beside the details), tabs across, content below
  &--phone {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;

    .patient-profile__side {
      position: static;
      max-inline-size: none;
    }

    .patient-profile__identity {
      flex-direction: row;
      align-items: center;
      gap: 0.875rem;
    }

    .patient-profile__identity > .v-avatar {
      flex: 0 0 auto;
      margin-inline: 0;
    }

    .patient-profile__info {
      min-inline-size: 0;
    }

    .patient-profile__name {
      font-size: 1rem;
    }

    .patient-profile__facts {
      display: flex;
      flex-wrap: wrap;
      column-gap: 0.875rem;
      font-size: 0.8125rem;

      div {
        line-height: 1.5;
      }
    }

    .patient-profile__tabs {
      margin-block-start: 0.875rem;
      border-block-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    }

    :deep(.v-tab) {
      padding-inline: 0.5rem;
      min-inline-size: 0;
    }
  }
}
</style>
