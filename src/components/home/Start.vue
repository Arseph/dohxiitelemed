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
                <h2 :class="{ 'text-disabled': isFinished(data) }">{{ data.title }}</h2>
                <VChip v-if="isFinished(data)" size="small" color="success" variant="tonal" class="mt-1">
                    <VIcon start icon="tabler-circle-check" size="16" />
                    Finished
                </VChip>
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
            <VBtn size="small" :disabled="!isMeetingOngoing(data) || isFinished(data)" @click="startConsult(data)">
                {{ isFinished(data) ? 'Finished' : 'Start' }}
            </VBtn>
            </template>
        </VListItem>
        <VDivider v-if="data.length > 1" />
        </template>
    </VList>
</template>
<script setup lang="ts">
import { axiosIns } from '@/plugins/axios';
import CryptoJS from 'crypto-js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useRouter } from 'vue-router';
import { VIcon } from 'vuetify/lib/components/index.mjs';
dayjs.extend(customParseFormat)
dayjs.extend(relativeTime)
const router = useRouter()
const props = defineProps<{
    data: any
    active_id: number
}>()
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
/**
 * is_finished is an int column, and older rows have it null rather than 0, so this
 * has to be a truthiness check — `=== 1` would miss anything stored as "1".
 */
const isFinished = (item: any) => Boolean(Number(item?.is_finished))

const isMeetingOngoing = (item: any) => {
  const start = dayjs(`${item.date_meeting} ${item.from_time}`, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD H:mm'])
  const end = dayjs(`${item.date_meeting} ${item.to_time}`, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD H:mm'])
  const now = dayjs()
  return now.isAfter(start)
}
const data = computed(() =>
  props.data.filter((item: any) => item.RequestTo === props.active_id)
)
const startConsult = async (item: any) => {
    const response = await axiosIns.get(`/api/enter-consult`, {
    params: { consult_id: item.id }
    })
    if(response.data.is_finished) {
        alert('Teleconsultation finished!')
        return
    }
    sessionStorage.setItem('consultationData', JSON.stringify(item))
    const conid = item.id
    const secretKey = 'SecretKey'
    const encryptedId = CryptoJS.AES.encrypt(conid.toString(), secretKey).toString()

    const routeData = router.resolve({
        name: 'tele.consultation',
        params: { id: encryptedId },
    })
    window.open(routeData.href, '_blank')
};
</script>
