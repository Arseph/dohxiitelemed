<script setup lang="ts">
import { useDisplay, useTheme } from 'vuetify'
import { axiosIns } from '@/plugins/axios'

interface MonthStat {
  month: string
  label: string
  total: number
  finished: number
}

interface DashboardStats {
  totals: {
    consultations: number
    upcoming: number
    finished: number
    patients: number
  }
  monthly: MonthStat[]
}

const { xs } = useDisplay()
const vuetifyTheme = useTheme()

const stats = ref<DashboardStats | null>(null)

// Starts true so the chart doesn't mount empty and get torn down mid-render when loading begins
const isLoading = ref(true)
const errorMessage = ref('')
const view = ref<'chart' | 'table'>('chart')

const fetchStats = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const { data } = await axiosIns.get<DashboardStats>('/api/dashboard/stats')

    stats.value = data
  }
  catch (error) {
    errorMessage.value = (error as any)?.response?.data?.message ?? 'Failed to load the statistics.'
  }
  finally {
    isLoading.value = false
  }
}

onMounted(fetchStats)

const cards = computed(() => {
  const t = stats.value?.totals

  return [
    { title: 'Consultations', value: t?.consultations, icon: 'tabler-video', color: 'primary' },
    { title: 'Upcoming', value: t?.upcoming, icon: 'tabler-calendar-event', color: 'info' },
    { title: 'Finished', value: t?.finished, icon: 'tabler-circle-check', color: 'success' },
    { title: 'Patients', value: t?.patients, icon: 'tabler-users', color: 'warning' },
  ]
})

const monthly = computed(() => stats.value?.monthly ?? [])
const yearTotal = computed(() => monthly.value.reduce((sum, m) => sum + m.total, 0))

const series = computed(() => [{ name: 'Consultations', data: monthly.value.map(m => m.total) }])

// Rebuilt on theme change so the axis text and grid follow light/dark mode
const chartOptions = computed(() => {
  const { colors, variables } = vuetifyTheme.current.value
  const ink = `rgba(${hexToRgb(colors['on-surface'])}, ${variables['medium-emphasis-opacity']})`
  const grid = `rgba(${hexToRgb(String(variables['border-color']))}, ${variables['border-opacity']})`

  return {
    chart: { type: 'bar', parentHeightOffset: 0, toolbar: { show: false }, fontFamily: 'inherit' },

    // The dark theme's primary green is too dim on the dark card; same lift as the page style below
    colors: [vuetifyTheme.current.value.dark ? 'rgb(138, 216, 182)' : colors.primary],
    plotOptions: {
      bar: { columnWidth: xs.value ? '55%' : '40%', borderRadius: 4, borderRadiusApplication: 'end' },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    grid: {
      borderColor: grid,
      strokeDashArray: 4,
      padding: { top: -10, left: 0, right: 0 },
      xaxis: { lines: { show: false } },
    },
    states: { hover: { filter: { type: 'darken', value: 0.85 } } },
    xaxis: {
      // Phones show "Jan"; the tooltip still names the year
      categories: monthly.value.map(m => (xs.value ? m.label.split(' ')[0] : m.label)),
      axisBorder: { show: false },
      axisTicks: { show: false },

      // Twelve labels don't fit side by side on a phone, so tilt them there
      labels: { style: { colors: ink, fontSize: '12px' }, rotate: -45, rotateAlways: xs.value, hideOverlappingLabels: false },
    },
    yaxis: {
      forceNiceScale: true,
      min: 0,
      labels: { style: { colors: ink, fontSize: '12px' }, formatter: (v: number) => String(Math.round(v)) },
    },
    tooltip: {
      theme: vuetifyTheme.current.value.dark ? 'dark' : 'light',
      x: { formatter: (_: number, { dataPointIndex }: { dataPointIndex: number }) => monthly.value[dataPointIndex]?.label ?? '' },
      y: {
        formatter: (v: number, { dataPointIndex }: { dataPointIndex: number }) =>
          `${v} (${monthly.value[dataPointIndex]?.finished ?? 0} finished)`,
      },
    },
  }
})

function hexToRgb(hex: string) {
  if (!hex.startsWith('#'))
    return hex

  const n = Number.parseInt(hex.slice(1), 16)

  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}
</script>

<template>
  <div class="dashboard">
    <div class="d-flex align-center flex-wrap gap-2 mb-6">
      <div class="me-auto">
        <h4 class="text-h4">
          Dashboard
        </h4>
        <div class="text-body-1 text-medium-emphasis">
          Teleconsultation statistics for the whole region
        </div>
      </div>
      <VBtn
        variant="tonal"
        prepend-icon="tabler-refresh"
        :loading="isLoading"
        @click="fetchStats"
      >
        Refresh
      </VBtn>
    </div>

    <VAlert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mb-6"
    >
      {{ errorMessage }}
    </VAlert>

    <!-- 👉 Totals -->
    <VRow class="mb-2">
      <VCol
        v-for="card in cards"
        :key="card.title"
        cols="6"
        md="3"
      >
        <VCard>
          <VCardText
            class="d-flex gap-4"
            :class="xs ? 'flex-column align-start' : 'align-center'"
          >
            <VAvatar
              :color="card.color"
              variant="tonal"
              rounded
              :size="xs ? 40 : 48"
            >
              <VIcon
                :icon="card.icon"
                size="28"
              />
            </VAvatar>
            <div>
              <div class="text-body-1 text-medium-emphasis">
                {{ card.title }}
              </div>
              <h4 class="text-h4">
                <VProgressCircular
                  v-if="isLoading && !stats"
                  indeterminate
                  size="20"
                  width="2"
                />
                <template v-else>
                  {{ card.value?.toLocaleString() ?? '–' }}
                </template>
              </h4>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- 👉 Consultations per month -->
    <VCard>
      <VCardItem>
        <VCardTitle class="text-wrap">
          Consultations per month
        </VCardTitle>
        <VCardSubtitle>
          Last 12 months · {{ yearTotal.toLocaleString() }} in total
        </VCardSubtitle>
        <template #append>
          <VBtnToggle
            v-model="view"
            mandatory
            density="compact"
            variant="outlined"
            divided
          >
            <VBtn
              value="chart"
              icon="tabler-chart-bar"
              aria-label="Show chart"
            />
            <VBtn
              value="table"
              icon="tabler-table"
              aria-label="Show table"
            />
          </VBtnToggle>
        </template>
      </VCardItem>

      <VCardText>
        <div
          v-if="isLoading && !stats"
          class="d-flex justify-center py-12"
        >
          <VProgressCircular indeterminate />
        </div>

        <VueApexCharts
          v-else-if="view === 'chart'"
          type="bar"
          :height="xs ? 260 : 320"
          :options="chartOptions"
          :series="series"
        />

        <VTable
          v-else
          density="compact"
        >
          <thead>
            <tr>
              <th>Month</th>
              <th class="text-end">
                Consultations
              </th>
              <th class="text-end">
                Finished
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="m in [...monthly].reverse()"
              :key="m.month"
            >
              <td>{{ m.label }}</td>
              <td class="text-end">
                {{ m.total }}
              </td>
              <td class="text-end">
                {{ m.finished }}
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCardText>
    </VCard>
  </div>
</template>

<style lang="scss" scoped>
// Lift the dim dark-theme primary for the icons and buttons on this page. VAvatar
// and VBtn carry their own .v-theme--dark class, so they need their own selector.
.v-theme--dark .dashboard,
.v-theme--dark .dashboard :deep(.v-avatar),
.v-theme--dark .dashboard :deep(.v-btn) {
  --v-theme-primary: 138, 216, 182;
}
</style>
