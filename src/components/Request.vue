<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import ErrorSnackbar from '@/components/snackbars/errors.vue';
import SuccessSnackbar from '@/components/snackbars/success.vue';
import { axiosIns } from '@/plugins/axios';
import { ref } from 'vue';
interface Facility {
  id: number
  facilityname: string
}
interface DocCat {
  id: number
  category_name: string
}
interface Patient {
  id: number
  name: string
}
const props = defineProps<{
  facility?: Facility
  facilities?: Facility[]
  docCat?: DocCat[]
  patient?: Patient[]
}>()
const { isError, errorMessage, isSuccess, successMessage } = cStatus()
const doctors = ref<{ id: number; name: string }[]>([])

const selectedFacility = ref<number | null>(null)
const selectedCategory = ref<number | null>(null)
const selectedDoctor = ref<number | null>(null)
const selectedPatient = ref<number | null>(null)
const chiefComplaint = ref<string>('')

const fetchDoctorCat = async (facilityId: number) => {
  try {
    const response = await axiosIns.get(`/api/get-doctors-facility`, {
      params: { fac_id: selectedFacility.value, cat_id: selectedCategory.value }
    })
    if (response.data.length > 0) {
      doctors.value = response.data.map((doc: any) => ({
        id: doc.id,
        name: `${doc.fname} ${doc.mname ?? ''} ${doc.lname}`.replace(/\s+/g, ' ').trim(),
      }))
    } else {
      doctors.value = []
      errorMessage.value = 'No doctors found in this category'
      isError.value = !isError.value
    }
  } catch (error) {
    console.error(error)
  }
}

const emit = defineEmits<{
  (e: 'close'): void
}>()

const isSubmitting = ref(false)
const isAccepted = ref(false)

const handleSubmit = async () => {

  if (isSubmitting.value || isAccepted.value) return

  try {
    isSubmitting.value = true

    const payload = {
      facility_id: selectedFacility.value,
      tele_cate_id: selectedCategory.value,
      doctor_id: selectedDoctor.value,
      patient_id: selectedPatient.value,
      title: chiefComplaint.value,
    };
    await axiosIns.post(`/api/sched-pending`, payload)
    successMessage.value = "Successfully Request Teleconsultation.";
    isSuccess.value = true;
    isAccepted.value = true
    setTimeout(() => emit('close'), 800)
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ||
      "Something went wrong. Please try again.";
    isError.value = true;
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <VForm @submit.prevent="handleSubmit">
    <VRow>
      <!-- Facility -->
      <VCol cols="12">
        <VAutocomplete v-model="selectedFacility" :items="props.facilities" item-title="facilityname" item-value="id"
          label="Facility" placeholder="Select Facility" />

      </VCol>

      <!-- Doctor Category -->
      <VCol cols="12" v-if="selectedFacility">
        <VSelect v-model="selectedCategory" :items="props.docCat" item-title="category_name" item-value="id"
          label="Doctor Category" placeholder="Select Category" @update:model-value="fetchDoctorCat" />
      </VCol>

      <!-- Doctor -->
      <VCol cols="12" v-if="doctors.length > 0">
        <VSelect v-model="selectedDoctor" :items="doctors" item-title="name" item-value="id" label="Doctor"
          placeholder="Select Doctor" />
      </VCol>

      <!-- Patient -->
      <VCol cols="12" v-if="selectedDoctor">
        <VSelect v-model="selectedPatient" :items="props.patient" item-title="name" item-value="id" label="Patient"
          placeholder="Select Patient" />
      </VCol>

      <!-- Chief Complaint -->
      <VCol cols="12" v-if="selectedPatient">
        <AppTextField v-model="chiefComplaint" label="Chief Complaint" placeholder="Enter complaint" />
      </VCol>

      <VCol cols="12" class="d-flex justify-end gap-4">
        <VCardActions>
          <VBtn type="reset" color="secondary" variant="tonal">
            Reset
          </VBtn>
          <VBtn type="submit" color="success" variant="tonal" :disabled="isSubmitting || isAccepted">
            Submit
          </VBtn>
        </VCardActions>
      </VCol>
    </VRow>
  </VForm>
  <ErrorSnackbar :message="errorMessage" :visible="isError" @update:visible="isError = $event" />
  <SuccessSnackbar :message="successMessage" :visible="isSuccess" @update:visible="isSuccess = $event" />
</template>
