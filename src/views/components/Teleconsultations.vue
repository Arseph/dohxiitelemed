<script lang="ts" setup>
import type { Component } from 'vue'
import { useDisplay } from 'vuetify'
import Form1 from '../../components/forms/form1.vue'
import Form2 from '../../components/forms/form2.vue'
import Form3 from '../../components/forms/form3.vue'
import Form4 from '../../components/forms/form4.vue'
import Form5 from '../../components/forms/form5.vue'

const props = defineProps<{ patient: Record<string, any> }>()

const emit = defineEmits<{ hideColumn: [hidden: boolean] }>()

const { smAndDown } = useDisplay()

const localPatient = reactive<Record<string, any>>({ ...props.patient })

const items = computed<Record<string, any>[]>(() =>
  (localPatient.allmeetings ?? []).map((m: any) => ({
    ...m,
    category_name: m.doctor?.doccat?.category_name ?? '-',
    doctor_name: m.doctor
      ? `${m.doctor.lname}, ${m.doctor.fname}${m.doctor.mname ? `, ${m.doctor.mname}` : ''}`
      : '-',
  })),
)

const headers = [
  { title: 'Date', key: 'date_meeting', style: 'width:120px' },
  { title: 'Time', key: 'from_time', style: 'width:150px' },
  { title: 'Type of Consultation', key: 'category_name', style: 'width:200px', align: 'center' },
  { title: 'Chief Complaint', key: 'title', style: 'width:250px', align: 'center' },
  { title: 'Attending Provider', key: 'doctor_name', style: 'width:200px', align: 'center' },
  { title: 'Actions', key: 'actions', sortable: false, style: 'width:120px', align: 'center' },
] as const

interface FormCard {
  id: number
  title: string
  short: string
  icon: string
  color: string
  component: Component
}

// `short` is the label in the phone tab strip, where five full titles don't fit
const cards: FormCard[] = [
  { id: 1, title: 'Demographic Profile', short: 'Demographics', icon: 'tabler-user', color: 'royalblue', component: Form1 },
  { id: 2, title: 'Clinical History & Physical Examination', short: 'Clinical & PE', icon: 'tabler-stethoscope', color: 'magenta', component: Form2 },
  { id: 3, title: 'COVID-19 Screening', short: 'COVID-19', icon: 'tabler-virus-search', color: 'red', component: Form3 },
  { id: 4, title: 'Diagnosis / Assessment', short: 'Diagnosis', icon: 'tabler-notes', color: 'blue', component: Form4 },
  { id: 5, title: 'Plan of Management', short: 'Plan', icon: 'tabler-clipboard-check', color: 'green', component: Form5 },
]

const showTabs = ref(false)
const selectedMeeting = ref<Record<string, any> | null>(null)
const tab = ref(cards[0].id)
const formLoadingStates = reactive<Record<number, boolean>>({ 1: false, 2: false, 3: false, 4: false, 5: false })

function onChildLoaded(formId: number) {
  formLoadingStates[formId] = false
}

function openDetails(item: Record<string, any>) {
  selectedMeeting.value = { ...item }
  showTabs.value = true
  tab.value = 1

  for (const card of cards)
    formLoadingStates[card.id] = true

  emit('hideColumn', true)
}

function closeDetails() {
  showTabs.value = false
  emit('hideColumn', false)
}

const longDate = new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
const mediumDate = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
const shortDate = new Intl.DateTimeFormat('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })

const formatDate = (date: string | undefined, fmt: Intl.DateTimeFormat) => (date ? fmt.format(new Date(date)) : '-')

function formatMeetingTime(time?: string) {
  if (!time)
    return '-'

  return new Date(`1970-01-01T${time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
}

// is_finished is an int column and older rows have it null. Ending the call sets it,
// and from then on the backend refuses form edits for everyone.
const isFinished = (m?: Record<string, any> | null) => Boolean(Number(m?.is_finished))

const timeRange = (m: Record<string, any>) => `${formatMeetingTime(m.from_time)} – ${formatMeetingTime(m.to_time)}`

const selectedTele = computed(() => {
  const meeting = selectedMeeting.value

  return [
    { label: 'Date', icon: 'tabler-calendar', value: formatDate(meeting?.date_meeting, mediumDate) },
    { label: 'Time', icon: 'tabler-clock', value: formatMeetingTime(meeting?.from_time) },
    { label: 'Consultation type', icon: 'tabler-category', value: meeting?.category_name ?? '-' },
    { label: 'Attending provider', icon: 'tabler-stethoscope', value: meeting?.doctor_name ?? '-' },
  ]
})
</script>

<template>
  <Transition
    name="slide-x-transition"
    mode="out-in"
  >
    <!-- LIST VIEW -->
    <div
      v-if="!showTabs"
      key="table-view"
    >
      <h3 class="text-h4 mb-4">
        Teleconsultations
      </h3>

      <!-- Phones: one card per consultation -->
      <template v-if="smAndDown">
        <VCard
          v-if="!items.length"
          variant="tonal"
          class="pa-6 text-center text-medium-emphasis"
        >
          No teleconsultations yet
        </VCard>

        <div
          v-else
          class="tele-cards"
        >
          <VCard
            v-for="item in items"
            :key="item.id"
            class="tele-card"
            @click="openDetails(item)"
          >
            <div class="tele-card__when">
              <VIcon
                icon="tabler-calendar"
                size="16"
              />
              <span>{{ formatDate(item.date_meeting, shortDate) }}</span>
              <span class="text-medium-emphasis">· {{ timeRange(item) }}</span>
              <VChip
                v-if="isFinished(item)"
                size="x-small"
                color="secondary"
                label
                class="ms-1"
              >
                Finished
              </VChip>
            </div>
            <div class="tele-card__title">
              {{ item.title || 'No chief complaint' }}
            </div>
            <div class="tele-card__meta">
              {{ item.category_name }} · {{ item.doctor_name }}
            </div>
            <VIcon
              icon="tabler-chevron-right"
              class="tele-card__chevron text-disabled"
            />
          </VCard>
        </div>
      </template>

      <!-- Desktop: table -->
      <VCard v-else>
        <VDataTable
          :headers="headers"
          :items="items"
          class="rounded orange-table small-table"
          item-value="id"
          hover
          density="compact"
        >
          <template #item.date_meeting="{ item }">
            {{ formatDate(item.date_meeting, longDate) }}
          </template>

          <template #item.from_time="{ item }">
            {{ timeRange(item) }}
            <VChip
              v-if="isFinished(item)"
              size="x-small"
              color="secondary"
              label
              class="ms-1"
            >
              Finished
            </VChip>
          </template>
          <template #item.category_name="{ item }">
            <span class="d-flex text-left ms-5">{{ item.category_name }}</span>
          </template>
          <template #item.title="{ item }">
            <span class="d-flex text-left ms-5">{{ item.title }}</span>
          </template>
          <template #item.doctor_name="{ item }">
            <span class="d-flex text-left ms-5">{{ item.doctor_name }}</span>
          </template>
          <template #item.actions="{ item }">
            <VBtn
              size="small"
              color="info"
              variant="text"
              @click="openDetails(item)"
            >
              Details
            </VBtn>
          </template>
        </VDataTable>
      </VCard>
    </div>

    <!-- DETAILS VIEW -->
    <div
      v-else
      key="details-view"
      class="tele-details"
      :class="{ 'tele-details--phone': smAndDown }"
    >
      <aside class="tele-details__side">
        <VBtn
          color="warning"
          variant="tonal"
          block
          prepend-icon="tabler-arrow-left"
          @click="closeDetails"
        >
          Back to Teleconsultations
        </VBtn>

        <div class="tele-details__summary">
          <div class="text-overline text-medium-emphasis">
            Chief complaint
          </div>
          <div class="tele-details__complaint">
            {{ selectedMeeting?.title || '-' }}
          </div>

          <VList
            density="compact"
            class="tele-details__facts pa-0"
          >
            <VListItem
              v-for="fact in selectedTele"
              :key="fact.label"
              :prepend-icon="fact.icon"
              :title="fact.value"
              :subtitle="fact.label"
              class="px-0"
            />
          </VList>
        </div>

        <div
          v-if="!smAndDown"
          class="text-h6 mt-4 mb-2"
        >
          Forms
        </div>

        <!-- Vertical list on desktop; a swipeable strip on phones -->
        <VTabs
          v-model="tab"
          :direction="smAndDown ? 'horizontal' : 'vertical'"
          :show-arrows="smAndDown"
          :density="smAndDown ? 'comfortable' : 'default'"
          class="tele-details__tabs"
        >
          <VTab
            v-for="card in cards"
            :key="card.id"
            :value="card.id"
            class="rounded-sm"
            :class="[`btn-${card.color}`]"
          >
            <VIcon
              :icon="card.icon"
              start
              size="20"
            />
            {{ smAndDown ? card.short : card.title }}
          </VTab>
        </VTabs>
      </aside>

      <VDivider
        v-if="!smAndDown"
        vertical
      />

      <section class="tele-details__content">
        <VAlert
          v-if="isFinished(selectedMeeting)"
          type="info"
          variant="tonal"
          density="compact"
          icon="tabler-lock"
          class="mb-3"
        >
          This consultation has finished, so its forms are read only.
        </VAlert>

        <VWindow
          v-model="tab"
          :touch="false"
        >
          <VWindowItem
            v-for="card in cards"
            :key="card.id"
            :value="card.id"
          >
            <div
              class="tele-details__form-title"
              :class="[`toolbar-${card.color}`]"
            >
              <VIcon
                :icon="card.icon"
                class="me-2"
              />
              {{ card.title }}
            </div>

            <div
              v-if="formLoadingStates[card.id]"
              class="d-flex justify-center align-center"
              style="block-size: 200px;"
            >
              <VProgressCircular
                indeterminate
                size="48"
                color="primary"
              />
            </div>

            <div
              v-show="!formLoadingStates[card.id]"
              :class="smAndDown ? 'py-3' : 'pa-4'"
            >
              <component
                :is="card.component"
                :meeting="selectedMeeting"
                :consult-id="selectedMeeting?.id"
                @loaded="onChildLoaded(card.id)"
              />
            </div>
          </VWindowItem>
        </VWindow>
      </section>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.tele-cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tele-card {
  position: relative;
  padding: 0.875rem 2.5rem 0.875rem 1rem;

  &__when {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem 0.375rem;
    font-size: 0.8125rem;
    font-weight: 500;
  }

  &__title {
    margin-block: 0.25rem 0.125rem;
    font-weight: 600;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  &__meta {
    color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
    font-size: 0.875rem;
  }

  &__chevron {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-end: 0.75rem;
    transform: translateY(-50%);
  }
}

.tele-details {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;

  &__side {
    position: sticky;
    inset-block-start: 0;
    flex: 0 0 25%;
    max-inline-size: 320px;
  }

  &__summary {
    margin-block-start: 1rem;
  }

  &__complaint {
    color: rgb(var(--v-theme-warning));
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  &__facts {
    background: transparent;
  }

  &__tabs :deep(.v-tab) {
    justify-content: flex-start;
  }

  // Desktop sidebar: let "Clinical History & Physical Examination" wrap, not clip
  &:not(&--phone) &__tabs :deep(.v-tab) {
    block-size: auto !important;
    min-block-size: 40px;
    padding-block: 0.5rem;

    .v-btn__content {
      text-align: start;
      white-space: normal;
    }
  }

  &__content {
    flex: 1 1 0;
    min-inline-size: 0;
  }

  &__form-title {
    position: sticky;
    z-index: 10;
    inset-block-start: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 1.25rem;
    font-weight: 500;
    text-align: center;
  }

  // Phones: back button, compact summary, form tabs across, then the form
  &--phone {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;

    .tele-details__side {
      position: static;
      max-inline-size: none;
    }

    .tele-details__summary {
      margin-block-start: 0.75rem;
    }

    .tele-details__complaint {
      font-size: 1rem;
    }

    // Two facts per row instead of four stacked lines
    .tele-details__facts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 0.75rem;
      margin-block-start: 0.25rem;
    }

    .tele-details__facts :deep(.v-list-item__spacer) {
      inline-size: 0.5rem !important;
    }

    .tele-details__tabs {
      margin-block-start: 0.5rem;
    }

    .tele-details__form-title {
      font-size: 1rem;
    }
  }
}
</style>
