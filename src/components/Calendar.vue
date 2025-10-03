<script lang="ts">
import { axiosIns } from '@/plugins/axios'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import timeGridPlugin from '@fullcalendar/timegrid'
import FullCalendar from '@fullcalendar/vue3'

export default {
  components: {
    FullCalendar,
  },
  data() {
    return {
      dialog: false,
      selectedEvent: null as any | null,
      calendarOptions: {
        plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        weekends: false,
        fixedWeekCount: false,
        showNonCurrentDates: false,
         headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
        },
        eventClick: (info: any) => {
          info.jsEvent.preventDefault()
          this.selectedEvent = {
            id: info.event.id,
            title: info.event.title,
            start: info.event.start,
            end: info.event.end,
            extendedProps: info.event.extendedProps,
          }
          this.dialog = true
        },
      },
    }
  },
  methods: {
    async fetchTele() {
      try {
        const response = await axiosIns.get(`/api/my-calendar-meetings`)

        this.calendarOptions.events = response.data.map((event: any) => ({
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          facility: event.facility,
        }))
      } catch (error) {
        console.error('❌ fetchTele failed', error)
      }
    },
    formatDate(date: Date | string | null) {
      if (!date) return ''
      const d = new Date(date)
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',  
        day: 'numeric', 
        year: 'numeric',
        weekday: 'long',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(d)
    },
  },
  mounted() {
    this.fetchTele()
  },
}
</script>

<template>
  <div>
    <FullCalendar :options="calendarOptions" />

    <!-- VDialog to show event details -->
    <VDialog v-model="dialog" max-width="500px">
      <VCard>
        <VCardTitle class="text-h6">
          {{ selectedEvent?.title }}
        </VCardTitle>
        <VCardText>
          <div><strong>Facility:</strong> {{ selectedEvent?.extendedProps?.facility }}</div>
          <div><strong>Start:</strong> {{ formatDate(selectedEvent?.start) }}</div>
          <div><strong>End:</strong> {{ formatDate(selectedEvent?.end) }}</div>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn color="primary" text @click="dialog = false">Close</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>


<style lang="scss">
@use "@core/scss/template/libs/full-calendar";

.calendars-checkbox {
  .v-label {
    color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
    opacity: var(--v-high-emphasis-opacity);
  }
}

.calendar-add-event-drawer {
  &.v-navigation-drawer:not(.v-navigation-drawer--temporary) {
    border-end-start-radius: 0.375rem;
    border-start-start-radius: 0.375rem;
  }
}

.calendar-date-picker {
  display: none;

  +.flatpickr-input {
    +.flatpickr-calendar.inline {
      border: none;
      box-shadow: none;

      .flatpickr-months {
        border-block-end: none;
      }
    }
  }

  & ~ .flatpickr-calendar .flatpickr-weekdays {
    margin-block: 0 4px;
  }
}

@media screen and (max-width: 1279px) {
  .calendar-add-event-drawer {
    border-width: 0;
  }
}
</style>
