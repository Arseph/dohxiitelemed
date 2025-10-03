<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import ErrorSnackbar from '@/components/snackbars/errors.vue';
import SuccessSnackbar from '@/components/snackbars/success.vue';
import { axiosIns } from '@/plugins/axios';
import { ref } from 'vue';
const props = defineProps<{
  data: any[]
}>()
const { isError, errorMessage, isSuccess, successMessage } = cStatus()
const patient = props.data.patFname + ' ' + props.data.patLname
const chiefComplaint = props.data.title

// Teleconsultation scheduling
const teleDate = ref<string | null>(null)
const duration = ref('15 Minutes')
const time = ref<string | null>(null)

const durations = ['15 Minutes', '30 Minutes', '45 Minutes', '60 Minutes']

const handleAccept = async () => {
  try {
    const cleanDuration = duration.value.replace(' Minutes', '').trim()

    const response = await axiosIns.post(
      `/api/accept-decline-meeting/${props.data.id}`,
      { 
        action: 'Accept',
        date_from: teleDate.value,
        duration: cleanDuration,
        time: time.value 
      }
    )
    successMessage.value = "Successfully Accepted Teleconsultation."
    isSuccess.value = true
  } catch (error) {
     errorMessage.value = error.response?.data?.message ||
      "Something went wrong. Please try again.";
    isError.value = !isError.value
  } finally { 
  }
}

const handleDecline = () => {
  alert(`Can't Decline Teleconsultation!, Try again later` )
}

const formatDate = (date: Date | string | null) => {
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
}
</script>

<template>
    <VCardText>
        <div><strong>Facility:</strong> {{ props.data.facility.facilityname }}</div>
        <div><strong>Date and Time Requested:</strong> {{ formatDate(props.data.reqDate) }}</div>
    </VCardText>

    <VForm @submit.prevent="handleAccept">
        <VRow>
            <VCol cols="12">
                <AppTextField v-model="patient" label="Patient" readonly />
                </VCol>
            <VCol cols="12">
            <AppTextField v-model="chiefComplaint" label="Chief Complaint" readonly />
        </VCol>
            <VCol cols="12" md="4">
                <AppDateTimePicker
                v-model="teleDate"
                label="Date of teleconsultation"
                placeholder="Select Date"
                />
            </VCol>
            <VCol cols="12" md="4">
                <VSelect
                class="mt-7"
                v-model="duration"
                :items="durations"
                label="Duration"
                />
            </VCol>
            <VCol cols="12" md="4">
                <AppDateTimePicker
                v-model="time"
                label="Time"
                type="time"
                placeholder="Select Time"
                :config="{ enableTime: true, noCalendar: true, dateFormat: 'H:i' }"
                :rules="[requiredValidator]"
                />
            </VCol>
        </VRow>
        
        <VRow>
            <VCol cols="12" class="d-flex justify-end gap-4">
                <VBtn color="error" @click="handleDecline" >Decline</VBtn>
                <VBtn type="submit"  color="success">Accept</VBtn>
            </VCol>
        </VRow>
    </VForm>
    <ErrorSnackbar
    :message="errorMessage"
    :visible="isError"
    @update:visible="isError = $event"
    />
    <SuccessSnackbar
    :message="successMessage"
        :visible="isSuccess"
        @update:visible="isSuccess = $event"
    />
</template>
