<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import { axiosIns } from "@/plugins/axios";
import { ref } from "vue";
import { VForm } from "vuetify/lib/components/index.mjs";


const patientform = ref<InstanceType<typeof VForm> | null>(null);
const { isError, errorMessage, isSuccess, successMessage } = cStatus();

const patientinfo = ref({
  // Manually filled by user
  pat_fname: '',
  pat_mname: '',
  pat_lname: '',
  pat_birthDate: '',

  // Non-nullable fields with dummy data
  sex_code: 'NA',
  regcode: 'NA',
  provcode: 'NA',
  citycode: 'NA',
  bgycode: 'NA',
  fsNumber: 'NA',
  phic_member: 'N',
  PCB_nhts: 'N',
  uploaded: 'N',
  validated: 'N',
  phic_stat: 'S',
});


const isSubmitting = ref(false);

// Emit events back to parent
const emit = defineEmits(["saved", "close"]);

async function savePatient() {
  try {
    // Ensure form validation
    const { valid } = await patientform.value.validate();

    if (!valid) {
      errorMessage.value = "Please fill in all required fields correctly.";
      isError.value = true;
      return;
    }

    const payload = {
      prefix_code: patientinfo.value.prefix_code ?? '',
      pat_lname: patientinfo.value.pat_lname ?? '',
      pat_fname: patientinfo.value.pat_fname ?? '',
      pat_mname: patientinfo.value.pat_mname ?? '',
      suffix_code: patientinfo.value.suffix_code ?? '',
      sex_code: patientinfo.value.sex_code ?? '',
      pat_birthDate: patientinfo.value.pat_birthDate ?? '',
      regcode: patientinfo.value.regcode ?? '',
      provcode: patientinfo.value.provcode ?? '',
      citycode: patientinfo.value.citycode ?? '',
      bgycode: patientinfo.value.bgycode ?? '',
      fsNumber: patientinfo.value.fsNumber ?? '',
      phic_member: patientinfo.value.phic_member ?? '',
      PCB_nhts: patientinfo.value.PCB_nhts ?? '',
      date_entered: patientinfo.value.date_entered ?? '',
      time_entered: patientinfo.value.time_entered ?? '',
      date_updated: patientinfo.value.date_updated ?? '',
      time_updated: patientinfo.value.time_updated ?? '',
      uploaded: patientinfo.value.uploaded ?? '',
      validated: patientinfo.value.validated ?? '',
      phic_stat: patientinfo.value.phic_stat ?? '',
      userid: patientinfo.value.userid ?? '',
    };



    console.log("Payload being sent:", payload);
    // Send request
    const response = await axiosIns.post('/api/patients/store-or-update', payload);

    // Success response handling
    successMessage.value = "Saved  plan of management.";
    isSuccess.value = true;

  } catch (error) {
    console.error("Error Adding Patient:", error);
    errorMessage.value = "Failed to add patient.";
    isError.value = true;

  }
}

// Optional: simple Vuetify rules
const required = [(v: string) => !!v || "This field is required"];
</script>

<template>
  <VContainer>
    <VForm ref="patientform">
      <pre>{{ patientinfo }}</pre>
      <VRow>
        <VCol>
          <VTextField v-model="patientinfo.pat_fname" label="First Name" :rules="required" />
        </VCol>
        <VCol>
          <VTextField v-model="patientinfo.pat_mname" label="Middle Name" />
        </VCol>
      </VRow>

      <VRow>
        <VCol>
          <VTextField v-model="patientinfo.pat_lname" label="Last Name" :rules="required" />
        </VCol>
        <VCol>
          <VTextField v-model="patientinfo.pat_birthDate" type="date" label="Birth Date" :rules="required" />
        </VCol>
      </VRow>

      <VRow justify="end" class="mt-4">
        <VCol cols="auto">
          <VBtn variant="tonal" color="grey" @click="emit('close')">
            Cancel
          </VBtn>
        </VCol>
        <VCol cols="auto">
          <VBtn color="primary" :loading="isSubmitting" @click="savePatient">
            Save
          </VBtn>
        </VCol>
      </VRow>
    </VForm>
  </VContainer>
</template>
