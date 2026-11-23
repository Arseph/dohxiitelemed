<script setup lang="ts">
import type { CalendarOptions, DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import type { DateClickArg } from '@fullcalendar/interaction'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import timeGridPlugin from '@fullcalendar/timegrid'
import FullCalendar from '@fullcalendar/vue3'
import { useDisplay } from 'vuetify'
import { axiosIns } from '@/plugins/axios'

type ViewKey = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'

interface Meeting {
  id: string
  title: string
  start: Date | null
  end: Date | null
  facility?: string
  patient?: string
  doctor?: string
}

// Phones get an agenda first: five month columns at ~70px each can only show "8a",
// and a five-day time grid is unreadable. Week view is desktop-only.
const desktopViews: { value: ViewKey; title: string }[] = [
  { value: 'dayGridMonth', title: 'Month' },
  { value: 'timeGridWeek', title: 'Week' },
  { value: 'timeGridDay', title: 'Day' },
  { value: 'listWeek', title: 'List' },
]

const phoneViews: { value: ViewKey; title: string }[] = [
  { value: 'listWeek', title: 'Agenda' },
  { value: 'timeGridDay', title: 'Day' },
  { value: 'dayGridMonth', title: 'Month' },
]

const { smAndDown } = useDisplay()
const viewOptions = computed(() => (smAndDown.value ? phoneViews : desktopViews))

const initialView: ViewKey = smAndDown.value ? 'listWeek' : 'dayGridMonth'
const currentView = ref<ViewKey>(initialView)
const title = ref('')

const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)
const api = () => calendarRef.value?.getApi()

const changeView = (view: ViewKey, date?: Date) => {
  currentView.value = view
  api()?.changeView(view, date)
}

// Rotating a tablet or resizing a window across the breakpoint: if the open view
// isn't offered at the new size, fall back to that size's default.
watch(smAndDown, phone => {
  if (!viewOptions.value.some(v => v.value === currentView.value))
    changeView(phone ? 'listWeek' : 'dayGridMonth')
})

const events = ref<EventInput[]>([])
const isLoading = ref(false)
const loadError = ref(false)

const fetchMeetings = async () => {
  isLoading.value = true
  try {
    const { data } = await axiosIns.get('/api/my-calendar-meetings')

    events.value = data.map((event: any) => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      extendedProps: {
        facility: event.facility,
        patient: event.patient,
        doctor: event.doctor,
      },
    }))
    loadError.value = false
  }
  catch (error) {
    console.error('fetchMeetings failed', error)
    loadError.value = true
  }
  finally {
    isLoading.value = false
  }
}

// Day and week grids only cover the hours that have meetings (at least 7 AM-6 PM),
// instead of 24 rows of mostly empty slots.
const hourOf = (value: unknown) => {
  const d = new Date(value as string)

  return Number.isNaN(d.getTime()) ? null : d.getHours() + d.getMinutes() / 60
}

const slotRange = computed(() => {
  let min = 7
  let max = 18
  for (const e of events.value) {
    const s = hourOf(e.start)
    const end = hourOf(e.end ?? e.start)
    if (s !== null)
      min = Math.min(min, Math.floor(s))
    if (end !== null)
      max = Math.max(max, Math.ceil(end))
  }

  const pad = (h: number) => `${String(h).padStart(2, '0')}:00:00`

  return { slotMinTime: pad(min), slotMaxTime: pad(Math.min(max, 24)) }
})

const isDialogOpen = ref(false)
const selected = ref<Meeting | null>(null)

const onEventClick = (info: EventClickArg) => {
  info.jsEvent.preventDefault()
  selected.value = {
    id: info.event.id,
    title: info.event.title,
    start: info.event.start,
    end: info.event.end,
    ...info.event.extendedProps,
  }
  isDialogOpen.value = true
}

// Month view on a phone is for finding a day; tapping one opens it.
const onDateClick = (info: DateClickArg) => {
  if (smAndDown.value && currentView.value === 'dayGridMonth')
    changeView('timeGridDay', info.date)
}

const onDatesSet = (arg: DatesSetArg) => {
  title.value = arg.view.title
  currentView.value = arg.view.type as ViewKey
}

const options = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
  initialView,
  headerToolbar: false, // replaced by the Vuetify toolbar in the template
  weekends: false,
  fixedWeekCount: false,
  showNonCurrentDates: false,
  height: 'auto',
  dayMaxEvents: smAndDown.value ? 2 : 4,
  moreLinkClick: info => {
    changeView('timeGridDay', info.date)

    return 'none' as const
  },
  ...slotRange.value,
  allDaySlot: events.value.some(e => e.allDay),
  nowIndicator: true,
  eventTimeFormat: { hour: 'numeric', minute: '2-digit', meridiem: 'short' },
  views: {
    // A 30-minute block is one line tall; start time + title fits, a full range doesn't
    timeGrid: { displayEventEnd: false },
  },
  noEventsContent: 'No teleconsultations scheduled',
  events: events.value,
  eventClick: onEventClick,
  dateClick: onDateClick,
  datesSet: onDatesSet,
}))

const dayFormat = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

const selectedWhen = computed(() => {
  const s = selected.value?.start
  if (!s)
    return { day: '', time: '' }

  const e = selected.value?.end

  return {
    day: dayFormat.format(s),
    time: e ? `${timeFormat.format(s)} – ${timeFormat.format(e)}` : timeFormat.format(s),
  }
})

onMounted(fetchMeetings)
</script>

<template>
  <VCard class="tele-calendar">
    <VProgressLinear
      v-if="isLoading"
      indeterminate
      color="primary"
      absolute
    />

    <!-- Toolbar: one row on desktop; title row + controls row on phones -->
    <div class="tele-calendar__toolbar">
      <div class="tele-calendar__nav">
        <VBtn
          icon="tabler-chevron-left"
          variant="text"
          density="comfortable"
          aria-label="Previous"
          @click="api()?.prev()"
        />
        <VBtn
          icon="tabler-chevron-right"
          variant="text"
          density="comfortable"
          aria-label="Next"
          @click="api()?.next()"
        />
        <h2 class="tele-calendar__title">
          {{ title }}
        </h2>
      </div>

      <div class="tele-calendar__actions">
        <VBtn
          variant="tonal"
          color="primary"
          @click="api()?.today()"
        >
          Today
        </VBtn>
        <VBtnToggle
          :model-value="currentView"
          mandatory
          divided
          variant="outlined"
          color="primary"
          density="comfortable"
          class="tele-calendar__views"
          @update:model-value="changeView"
        >
          <VBtn
            v-for="view in viewOptions"
            :key="view.value"
            :value="view.value"
          >
            {{ view.title }}
          </VBtn>
        </VBtnToggle>
      </div>
    </div>

    <VAlert
      v-if="loadError"
      type="error"
      variant="tonal"
      density="compact"
      class="mx-4 mb-4"
    >
      Couldn't load your schedule.
      <template #append>
        <VBtn
          size="small"
          variant="text"
          :loading="isLoading"
          @click="fetchMeetings"
        >
          Retry
        </VBtn>
      </template>
    </VAlert>

    <FullCalendar
      ref="calendarRef"
      :options="options"
    />

    <!-- Meeting details -->
    <VDialog
      v-model="isDialogOpen"
      max-width="480"
    >
      <DialogCloseBtn @click="isDialogOpen = false" />
      <VCard v-if="selected">
        <VCardItem class="pb-2">
          <VCardTitle class="text-wrap">
            {{ selected.title }}
          </VCardTitle>
        </VCardItem>

        <VList
          density="comfortable"
          class="pb-4"
        >
          <VListItem
            prepend-icon="tabler-calendar"
            :title="selectedWhen.day"
            :subtitle="selectedWhen.time"
          />
          <VListItem
            v-if="selected.patient"
            prepend-icon="tabler-user"
            :title="selected.patient"
            subtitle="Patient"
          />
          <VListItem
            v-if="selected.doctor"
            prepend-icon="tabler-stethoscope"
            :title="selected.doctor"
            subtitle="Doctor"
          />
          <VListItem
            v-if="selected.facility"
            prepend-icon="tabler-building-hospital"
            :title="selected.facility"
            subtitle="Facility"
          />
        </VList>
      </VCard>
    </VDialog>
  </VCard>
</template>

<style lang="scss">
@use "@core/scss/template/libs/full-calendar";

.tele-calendar {
  position: relative;

  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem 1rem;
    padding: 1rem 1.25rem;
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    min-inline-size: 0;
  }

  &__title {
    margin: 0 0 0 0.5rem;
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.3;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
  }

  // Keep the grid clear of the card edges
  .fc {
    padding: 0 1.25rem 1.25rem;
  }

  .fc-list-event {
    cursor: pointer;
  }

  // Brand colour for the month and agenda dots. Set here rather than with the
  // eventColor option, which FullCalendar writes as an inline background that would
  // override the tinted day/week blocks below.
  .fc-daygrid-event-dot,
  .fc-list-event-dot {
    border-color: rgb(var(--v-theme-primary));
  }

  // Day/week blocks: tinted like Vuexy's own event chips (the template's text colour
  // assumes a light background), with time and title on one line so a 30-minute
  // block still shows what it is.
  .fc-timegrid-event.fc-v-event {
    border: 0;
    border-inline-start: 3px solid rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 0.16);
    cursor: pointer;

    .fc-event-main {
      color: rgb(var(--v-theme-primary));
      font-weight: 500;
    }

    .fc-event-main-frame {
      flex-flow: row wrap;
      align-content: flex-start;
      column-gap: 0.375rem;
    }

    .fc-event-title-container {
      flex: 1 1 auto;
    }
  }

  .fc-list-event-title {
    font-weight: 500;
  }

  // Phones: title on its own row, Today + view switcher sharing the next one
  @media (max-width: 959.98px) {
    &__toolbar {
      padding: 0.75rem;
    }

    &__nav,
    &__actions {
      inline-size: 100%;
    }

    &__title {
      font-size: 1.1rem;
    }

    &__views {
      flex: 1 1 auto;

      .v-btn {
        flex: 1 1 0;
        min-inline-size: 0;
      }
    }

    .fc {
      padding: 0 0.5rem 0.75rem;
    }

    // Month: short weekday names and compact day cells
    .fc-col-header-cell-cushion {
      font-size: 0.8rem;
    }

    .fc-daygrid-day-frame {
      min-block-size: 3.5rem;
    }

    .fc-daygrid-day-number {
      font-size: 0.85rem;
      padding: 0.25rem 0.375rem;
    }

    .fc-daygrid-event {
      font-size: 0.7rem;
    }

    .fc-daygrid-day {
      cursor: pointer;
    }

    // Agenda: roomier rows, and a time column that wraps "8:00am - 9:00am" onto two lines
    .fc-list-event td {
      padding: 0.625rem 0.5rem;
    }

    .fc-list-event-time {
      inline-size: 5.5rem;
      font-size: 0.8rem;
      white-space: normal;
    }
  }
}
</style>
