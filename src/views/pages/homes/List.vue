<script setup lang="ts">
import { useDisplay } from 'vuetify'
import { axiosIns } from '@/plugins/axios'

type SectionKey = 'start' | 'join' | 'pending' | 'requests'

interface Section {
  key: SectionKey
  icon: string
  color: string
  label: string // tile label on larger screens
  short: string // tile label on phones, where two tiles share a row
  heading: string
  hint: string
}

const sections: Section[] = [
  { key: 'start', icon: 'tabler-video-plus', color: 'primary', label: 'Start Teleconsultation', short: 'Start', heading: 'Today\'s teleconsultations', hint: 'Consultations requested of you. Start one when its time comes.' },
  { key: 'join', icon: 'tabler-video', color: 'warning', label: 'Join Teleconsultation', short: 'Join', heading: 'Join a teleconsultation', hint: 'Consultations you requested that have been scheduled.' },
  { key: 'pending', icon: 'tabler-corner-left-down-double', color: 'info', label: 'Pending Teleconsultation', short: 'Pending', heading: 'Pending requests', hint: 'Requests waiting for you to set a schedule.' },
  { key: 'requests', icon: 'tabler-calendar-clock', color: 'error', label: 'Request Teleconsultation', short: 'Requests', heading: 'My requests', hint: 'Teleconsultations you have asked for, and their status.' },
]

const { camera, microphone, secureContext, checkStatus, requestMedia, requestNotification } = useMediaPermissions()
const { smAndDown, xs } = useDisplay()
const route = useRoute()
const router = useRouter()

const facilities = ref([])
const docCat = ref([])
const patient = ref<{ id: number; name: string }[]>([])
const start = ref<any[]>([])
const active = ref(0)
const pending = ref<any[]>([])
const req = ref<any[]>([])
const isRefreshing = ref(false)
const hasLoaded = ref(false)
const loadError = ref(false)

const fetchTele = async () => {
  try {
    isRefreshing.value = true

    const response = await axiosIns.get('/api/teleconsultation')

    facilities.value = response.data.facilities
    docCat.value = response.data.telecat
    patient.value = (response.data.patients ?? []).map((pat: any) => ({
      id: pat.id,
      name: `${pat.pat_fname} ${pat.pat_mname ?? ''} ${pat.pat_lname}`.replace(/\s+/g, ' ').trim(),
    }))
    start.value = response.data?.data ?? []
    active.value = response.data?.active_user?.id
    pending.value = response.data?.data_req ?? []
    req.value = response.data?.data_my_req ?? []
    loadError.value = false
  }
  catch {
    // Keep showing the last good lists; the banner offers a retry.
    loadError.value = true
  }
  finally {
    isRefreshing.value = false
    hasLoaded.value = true
  }
}

// Same filters Start.vue and Join.vue apply, so the tile counts match the lists.
const counts = computed<Record<SectionKey, number>>(() => ({
  start: start.value.filter(item => item.RequestTo === active.value).length,
  join: start.value.filter(item => item.Creator === active.value).length,
  pending: pending.value.length,
  requests: req.value.length,
}))

// The open section lives in the URL (?tab=pending), so a reload or a shared link
// lands on the same list.
const isSectionKey = (value: unknown): value is SectionKey =>
  sections.some(s => s.key === value)

const activeTab = computed<SectionKey>({
  get: () => (isSectionKey(route.query.tab) ? route.query.tab : 'start'),
  set: tab => {
    router.replace({ query: { ...route.query, tab } })
  },
})

const activeSection = computed(() => sections.find(s => s.key === activeTab.value)!)

const contentEl = ref<HTMLElement | null>(null)
const tabEls = ref<HTMLElement[]>([])

const selectTab = (key: SectionKey) => {
  activeTab.value = key

  // On phones the list sits below the tiles; bring it into view.
  if (smAndDown.value)
    nextTick(() => contentEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

// Arrow keys move between tabs, as screen-reader users expect from a tablist.
const onTabKeydown = (event: KeyboardEvent, index: number) => {
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
  if (!step)
    return

  event.preventDefault()

  const next = (index + step + sections.length) % sections.length

  activeTab.value = sections[next].key
  tabEls.value[next]?.focus()
}

const isRequestDialogOpen = ref(false)

// A request was submitted from the dialog — the lists behind it are now out of date.
const onRequestCreated = () => {
  isRequestDialogOpen.value = false
  fetchTele()
}

/**
 * Someone else did something that affects this user's lists.
 *
 * The backend already pushes to `my-channel.{userId}` whenever a teleconsultation is
 * requested for or scheduled with this user (see PusherHelper::trigger in
 * TeleController). App.vue re-broadcasts those in-page as `teleconsult-notification`,
 * so this page can refresh without opening a second Pusher connection or waiting for
 * the user to reload.
 */
const onRemoteActivity = () => {
  fetchTele()
}

/**
 * Fallback for anything the push missed — a dropped websocket, a notification fired
 * while the tab was closed, or a change made by someone this user is not the target
 * of. Refetching only when the tab regains focus keeps this close to free, unlike a
 * timer that polls whether or not anyone is looking.
 */
const onWindowFocus = () => {
  if (document.visibilityState === 'visible')
    fetchTele()
}

const time = ref('')
const date = ref('')

const updateDateTime = () => {
  const now = new Date()

  time.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  date.value = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

const permBanner = computed(() => {
  if (!secureContext)
    return { show: true, type: 'warning' as const, text: 'Camera and microphone require a secure connection (HTTPS). Teleconsultation video may not work until HTTPS is configured.', btn: null }

  if (camera.value === 'denied' || microphone.value === 'denied')
    return { show: true, type: 'error' as const, text: 'Camera or microphone access was denied. Please allow access in browser settings.', btn: null }

  if (camera.value === 'prompt' || microphone.value === 'prompt')
    return { show: true, type: 'info' as const, text: 'Camera and microphone access is required for teleconsultation.', btn: 'Grant Access' }

  return { show: false, type: 'success' as const, text: '', btn: null }
})

let interval: number

onMounted(async () => {
  updateDateTime()
  fetchTele()
  interval = window.setInterval(updateDateTime, 1000)
  window.addEventListener('teleconsult-notification', onRemoteActivity)
  document.addEventListener('visibilitychange', onWindowFocus)
  await checkStatus()
  requestNotification()
  if (camera.value === 'prompt')
    requestMedia()
})

onUnmounted(() => {
  clearInterval(interval)
  window.removeEventListener('teleconsult-notification', onRemoteActivity)
  document.removeEventListener('visibilitychange', onWindowFocus)
})
</script>

<template>
  <div class="home">
    <VAlert
      v-if="permBanner.show"
      :type="permBanner.type"
      class="mb-4"
      variant="tonal"
      density="comfortable"
      closable
    >
      {{ permBanner.text }}
      <template
        v-if="permBanner.btn"
        #append
      >
        <VBtn
          size="small"
          variant="tonal"
          @click="requestMedia"
        >
          {{ permBanner.btn }}
        </VBtn>
      </template>
    </VAlert>

    <!-- Date, time and refresh -->
    <VCard
      class="home-hero mb-6"
      flat
    >
      <VCardText class="home-hero__body">
        <div class="home-hero__clock">
          <p class="home-hero__date">
            {{ date }}
          </p>
          <p
            class="home-hero__time"
            aria-live="off"
          >
            {{ time }}
          </p>
        </div>

        <!--
          Lists refresh on their own after any action and on push, but an explicit
          control matters when someone is waiting on a colleague to schedule.
        -->
        <VBtn
          variant="tonal"
          color="white"
          prepend-icon="tabler-refresh"
          :loading="isRefreshing"
          @click="fetchTele"
        >
          Refresh
        </VBtn>
      </VCardText>
    </VCard>

    <VRow>
      <!-- Section tabs: 2x2 grid on phones, a column beside the list from md up -->
      <VCol
        cols="12"
        md="5"
        lg="4"
      >
        <div
          class="home-nav"
          role="tablist"
          aria-label="Teleconsultation lists"
          :aria-orientation="smAndDown ? 'horizontal' : 'vertical'"
        >
          <button
            v-for="(section, index) in sections"
            :id="`home-tab-${section.key}`"
            :key="section.key"
            ref="tabEls"
            type="button"
            role="tab"
            class="home-nav__tab"
            :class="{ 'home-nav__tab--active': activeTab === section.key }"
            :style="{ '--tab-color': `var(--v-theme-${section.color})` }"
            :aria-selected="activeTab === section.key"
            :aria-controls="`home-panel-${section.key}`"
            :tabindex="activeTab === section.key ? 0 : -1"
            @click="selectTab(section.key)"
            @keydown="onTabKeydown($event, index)"
          >
            <VAvatar
              variant="tonal"
              :color="section.color"
              rounded
              :size="xs ? 32 : smAndDown ? 36 : 56"
            >
              <VIcon
                :icon="section.icon"
                :size="xs ? 20 : smAndDown ? 22 : 32"
              />
            </VAvatar>

            <span class="home-nav__label">
              <span class="d-md-none">{{ section.short }}</span>
              <span class="d-none d-md-inline">{{ section.label }}</span>
            </span>

            <span
              v-if="hasLoaded"
              class="home-nav__count"
              :aria-label="`${counts[section.key]} items`"
            >
              {{ counts[section.key] }}
            </span>
          </button>
        </div>
      </VCol>

      <!-- Active list -->
      <VCol
        cols="12"
        md="7"
        lg="8"
      >
        <div
          ref="contentEl"
          class="home-content"
        >
          <VCard
            :id="`home-panel-${activeSection.key}`"
            role="tabpanel"
            :aria-labelledby="`home-tab-${activeSection.key}`"
          >
            <VCardItem class="home-content__header">
              <template #prepend>
                <VAvatar
                  variant="tonal"
                  :color="activeSection.color"
                  rounded
                  size="40"
                >
                  <VIcon
                    :icon="activeSection.icon"
                    size="24"
                  />
                </VAvatar>
              </template>

              <VCardTitle class="text-wrap">
                {{ activeSection.heading }}
              </VCardTitle>
              <VCardSubtitle class="text-wrap">
                {{ activeSection.hint }}
              </VCardSubtitle>

              <template
                v-if="activeTab === 'requests'"
                #append
              >
                <VBtn
                  color="success"
                  variant="tonal"
                  prepend-icon="tabler-plus"
                  :size="xs ? 'small' : 'default'"
                  @click="isRequestDialogOpen = true"
                >
                  New<span class="d-none d-sm-inline">&nbsp;request</span>
                </VBtn>
              </template>
            </VCardItem>

            <VDivider />

            <VCardText>
              <VAlert
                v-if="loadError"
                type="error"
                variant="tonal"
                density="compact"
                class="mb-4"
              >
                Couldn't load the latest teleconsultations.
                <template #append>
                  <VBtn
                    size="small"
                    variant="text"
                    :loading="isRefreshing"
                    @click="fetchTele"
                  >
                    Retry
                  </VBtn>
                </template>
              </VAlert>

              <VSkeletonLoader
                v-if="!hasLoaded"
                type="list-item-avatar-two-line@3"
              />

              <!-- Swiping is off: on phones it fought with the tables' sideways scroll -->
              <VWindow
                v-else
                v-model="activeTab"
                :touch="false"
              >
                <VWindowItem value="start">
                  <Start
                    :data="start"
                    :active_id="active"
                  />
                </VWindowItem>
                <VWindowItem value="join">
                  <Join
                    :data="start"
                    :active_id="active"
                  />
                </VWindowItem>
                <VWindowItem value="pending">
                  <Pending
                    :data="pending"
                    @refresh="fetchTele"
                  />
                </VWindowItem>
                <VWindowItem value="requests">
                  <RequestPal :data="req" />
                </VWindowItem>
              </VWindow>
            </VCardText>
          </VCard>
        </div>
      </VCol>
    </VRow>

    <VDialog
      v-model="isRequestDialogOpen"
      max-width="600"
      :fullscreen="xs"
    >
      <DialogCloseBtn @click="isRequestDialogOpen = false" />
      <VCard>
        <VCardTitle class="pt-5 px-6">
          Request Teleconsultation
        </VCardTitle>
        <VCardText>
          <Request
            :facilities="facilities"
            :doc-cat="docCat"
            :patient="patient"
            @close="onRequestCreated"
          />
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<style lang="scss" scoped>
/* ---------- Hero ---------- */
.home-hero {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgba(var(--v-theme-primary), 0.78) 100%);
  color: #fff;

  &__body {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.25rem 1.5rem !important;
  }

  &__date {
    margin: 0;
    font-size: 0.95rem;
    opacity: 0.9;
  }

  &__time {
    margin: 0;
    font-size: clamp(2rem, 6vw, 2.75rem);
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1.1;
  }

  // Desktop: the original blurred-photo card, centred. The photo sits over the green
  // gradient, so if picsum is slow, blocked or offline the card stays green and readable
  // instead of white-on-white. The dark wash keeps white text legible on any photo.
  @media (min-width: 960px) {
    background:
      linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)),
      url("https://picsum.photos/1200/400?blur=2") center / cover no-repeat,
      linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgba(var(--v-theme-primary), 0.78) 100%);

    &__body {
      flex-direction: column;
      justify-content: center;
      gap: 0.75rem;
      min-block-size: 200px;
      text-align: center;
    }

    &__date {
      order: 2;
      font-size: 1.25rem;
      font-weight: 500;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
    }

    &__time {
      font-size: 3.5rem;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    }

    &__clock {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
  }
}

/* ---------- Section tabs ---------- */
.home-nav {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (min-width: 960px) {
    position: sticky;
    grid-template-columns: minmax(0, 1fr);
    inset-block-start: 5rem;
  }

  &__tab {
    display: flex;
    align-items: center;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 10px;
    background: rgb(var(--v-theme-surface));
    box-shadow: 0 2px 6px rgba(var(--v-shadow-key-umbra-color), 0.06);
    color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
    cursor: pointer;
    gap: 0.75rem;
    inline-size: 100%;
    min-block-size: 64px;
    padding: 0.75rem;
    text-align: start;
    transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;

    &:hover {
      border-color: rgba(var(--tab-color), 0.5);
      box-shadow: 0 4px 12px rgba(var(--v-shadow-key-umbra-color), 0.1);
    }

    &:focus-visible {
      outline: 2px solid rgb(var(--tab-color));
      outline-offset: 2px;
    }

    // Two tiles share a ~170px row on phones; tighten so "Requests" clears its count
    @media (max-width: 599.98px) {
      gap: 0.5rem;
      padding: 0.625rem;
    }

    &--active {
      border-color: rgb(var(--tab-color));
      background: rgba(var(--tab-color), 0.08);
      box-shadow: inset 0 0 0 1px rgb(var(--tab-color));
    }

    // Desktop: larger tiles, so the four sections read as the page's main actions
    @media (min-width: 960px) {
      gap: 1rem;
      min-block-size: 104px;
      padding: 1.25rem;

      .home-nav__label {
        font-size: 1.1rem;
      }

      .home-nav__count {
        font-size: 0.9rem;
        min-inline-size: 2.25rem;
        padding: 0.25rem 0.625rem;
      }
    }
  }

  &__label {
    flex: 1 1 auto;
    min-inline-size: 0;
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.25;
  }

  &__count {
    flex: none;
    border-radius: 999px;
    background: rgba(var(--tab-color), 0.14);
    color: rgb(var(--tab-color));
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    min-inline-size: 1.75rem;
    padding: 0.125rem 0.5rem;
    text-align: center;
  }
}

/* ---------- Content ---------- */
.home-content {
  // Leaves room for the sticky navbar when scrolled into view on phones
  scroll-margin-block-start: 5rem;

  &__header {
    padding-block: 1rem !important;
  }

  // Phones: give the child lists the full card width, and let long complaint titles
  // and the time chip wrap instead of being cut off mid-word.
  @media (max-width: 599.98px) {
    :deep(.v-card-text) {
      padding: 0.75rem;
    }

    :deep(.v-list-item-title),
    :deep(.v-list-item-subtitle) {
      overflow: visible;
      -webkit-line-clamp: unset;
      line-clamp: unset;
      white-space: normal;
    }

    :deep(.v-list-item-title h2) {
      font-size: 1.15rem;
      line-height: 1.3;
    }

    // Vuetify fixes chip height per density, so the override needs !important
    :deep(.v-list-item-subtitle .v-chip) {
      block-size: auto !important;
      padding-block: 0.375rem;
    }

    :deep(.v-list-item-subtitle .v-chip__content) {
      flex-wrap: wrap;
      column-gap: 0.5rem;
      row-gap: 0.125rem;
    }

    // Wrap between the time range and "Starts …", never inside a time
    :deep(.v-list-item-subtitle .v-chip__content > span) {
      margin-inline-start: 0 !important;
      white-space: nowrap;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-nav__tab {
    transition: none;
  }
}
</style>
