<template>
    <div v-if="data.length === 0" class="text-center py-4 text-medium-emphasis">
        No teleconsultation found
    </div>
    <VList
        v-else
        lines="two"
        border
        style="overflow-x: hidden;"
    >
        <template
        v-for="(data, index) of data"
        :key="data.id"
        >
        <VListItem>
            <VListItemTitle class="pa-3">
                <h2>{{ data.title }}</h2>
            </VListItemTitle>
            <VListItemSubtitle class="mt-1">
            <VBadge
                dot
                location="start center"
                offset-x="2"
                color="primary"
                class="me-3"
            >
                <span class="ms-4">{{data.encoded.facility.facilityname}}</span>
            </VBadge>
            <VSpacer></VSpacer>
             <VChip
                pill
                :label="false"
                class="mt-3"
            >
                <VIcon
                    start
                    icon="tabler-clock"
                    color="warning"
                />
                <span>{{ formatTime(data.from_time) }} - {{ formatTime(data.to_time) }}</span>
                <span class="text-sm text-disabled ml-3">Starts {{ humanReadable(`${data.date_meeting} ${data.from_time}`) }}</span>
            </VChip>
            </VListItemSubtitle>

            <template #append>
            <VBtn size="small">
                Join
            </VBtn>
            </template>
        </VListItem>
        <VDivider v-if="data.length > 1" />
        </template>
    </VList>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import { VIcon } from 'vuetify/lib/components/index.mjs'

dayjs.extend(customParseFormat)
dayjs.extend(relativeTime)
const humanReadable = (time: string) => {
  return dayjs(time).fromNow()
}
const parseTime = (time?: string) => {
  const t = (time ?? '').trim()
  const formats = ['HH:mm:ss', 'HH:mm', 'H:mm:ss', 'H:mm']
  for (const f of formats) {
    const d = dayjs(t, f, true) // strict parsing
    if (d.isValid()) return d
  }
  return null
}

const formatTime = (time?: string) => {
  const d = parseTime(time)
  return d ? d.format('h:mm A') : ''
}
const props = defineProps<{
    data: any
    active_id: number
}>()
const data = computed(() =>
  props.data.filter((item: any) => item.Creator === props.active_id)
)
</script>
