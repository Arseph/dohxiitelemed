<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import { useUser } from '@/composables/useUser';
import { axiosIns } from '@/plugins/axios';
import { ref } from "vue";
import { VForm } from 'vuetify/components/VForm';
import { VCol, VRow, VTextField } from "vuetify/lib/components/index.mjs";

const clinform = ref<VForm>();
const { user } = useUser();
const { isError, errorMessage, isSuccess, successMessage } = cStatus();


console.log(user.value);

// Props — so this form can be reused for different calls
const props = defineProps({
  consultId: {
    type: Number,
    required: false,
  },
});

// ✅ Reusable function to load facilities
const facilityOptions = ref([]);

async function fetchFacilities() {
  try {
    const response = await axiosIns.get('/api/tele/facilities');
    // Sort the data alphabetically, just in case
    facilityOptions.value = response.data.data.sort((a, b) => a.facilityname.localeCompare(b.facilityname));
  } catch (error) {
    console.error('Error fetching facilities:', error);
  }
}



const clinichis = ref({
  // savedID: props.consultId,
  meetID: '',
  reason_consult: '',
  date_diagnosis: '',
  time_diagnosis: '',
  date_onset_illness: '',
  date_referral: '',
  facilityOptions: '',
  known_medical_history: '',
  current_medication: '',
  blood_type: '',
  clinical_status_time_consult: '',
  specific_findings: '',
  head: '',
  conjunctiva: '',
  con_remarks: '',
  neck: '',
  chest: '',
  abdomen: '',
  abdomen_remakrs: '',
  genitals: '',
  genitals_remakrs: '',
  extremities: '',
  extrimities_remarks: '',
  others: '',
  waist_circumference: '',
});


// const meeting = ref<any>(null);

async function fetchMeetingInfo(meetId: number) {
  try {
    const response = await axiosIns.get(`/api/admin-patient-meeting-info`, {
      params: { meet_id: meetId },
    });

    const data = response.data;

    // DOC name 
    const docfname = data.docfname ?? '';

    clinichis.value = {
      meetID: data.meetID,
      reason_consult: data.title ?? null,
      time_diagnosis: data.time_diagnosis ?? null,






    };

    console.log("Clinical History fetched:", clinichis.value);

  } catch (error) {
    console.error("Error fetching clinical history:", error);
    errorMessage.value = "Failed to fetch clnical history.";
    isError.value = true;
  }
}


onMounted(() => {
  if (props.consultId) fetchMeetingInfo(props.consultId);
  fetchFacilities();
});

async function saveUpdateDP() {
  try {
    // Ensure form validation
    const { valid } = await demProf.value.validate();

    if (!valid) {
      errorMessage.value = "Please fill in all required fields correctly.";
      isError.value = true;
      return;
    }

    // ✅ Prepare payload using all meeting data
    const payload = {
      meeting_id: clinichis.value.meetID,
      reason_consult: clinichis.value.reason_consult,
      date_diagnosis: clinichis.value.date_diagnosis,
      time_diagnosis: clinichis.value.time_diagnosis,
      date_onset_illness: clinichis.value.date_onset_illness,
      date_referral: clinichis.value.date_referral,
      facilityOptions: clinichis.value.facilityOptions,
      known_medical_history: clinichis.value.known_medical_history,
      current_medication: clinichis.value.current_medication,
      blood_type: clinichis.value.blood_type,
      clinical_status_time_consult: clinichis.value.clinical_status_time_consult,
      specific_findings: clinichis.value.specific_findings,
      head: clinichis.value.head,
      conjunctiva: clinichis.value.conjunctiva,
      con_remarks: clinichis.value.con_remarks,
      neck: clinichis.value.neck,
      chest: clinichis.value.chest,
      abdomen: clinichis.value.abdomen,
      abdomen_remakrs: clinichis.value.abdomen_remakrs,
      genitals: clinichis.value.genitals,
      genitals_remakrs: clinichis.value.genitals_remakrs,
      extremities: clinichis.value.extremities,
      extrimities_remarks: clinichis.value.extrimities_remarks,
      others: clinichis.value.others,
      waist_circumference: clinichis.value.waist_circumference,
    };


    console.log("Payload being sent:", payload);
    // Send request
    const response = await axiosIns.post('/api/save-clinical-history', payload); //no route yet

    // Success response handling
    successMessage.value = "Saved demographic profile.";
    isSuccess.value = true;

  } catch (error) {
    console.error("Error Saving Clinical History:", error);
    errorMessage.value = "Failed to save Clinical History.";
    isError.value = true;

  }
}
</script>

<template>
  <VForm ref="clinform">
    <div class="d-flex flex-column justify-center">
    </div>
    <h5>
      <!-- <pre>{{ clinichis }}</pre> -->
    </h5>
    <br></br>
    <VRow>
      <VCol>
        <VTextarea v-model="clinichis.reason_consult" outlined dense hide-details auto-grow rows="2"
          label="Reason for Teleconsultation:" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="clinichis.date_onset_illness" type="datetime-local" outlined dense hide-details
          label="Date of Onset of Illness:" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VAutocomplete v-model="clinichis.refhlthfac" :items="facilityOptions" item-title="facilityname"
          label="Name of Referral Health Facility (if Applicable):" outlined dense hide-details clearable
          persistent-hint />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="clinichis.known_medical_history" outlined dense hide-details auto-grow rows="2"
          label="Known Medical Condition/s & Medical History:" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="clinichis.current_medication" outlined dense hide-details label="Current Medications:" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="clinichis.specific_findings" outlined dense hide-details label="Blood Type:" />
      </VCol>
    </VRow>
    <VRow class="align-center">
      <VCol>
        <h5 class="text-h5 font-weight-medium mb-2">Physical Examination(Inspection)</h5>
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="clinichis.clinical_status_time_consult" outlined dense hide-details auto-grow rows="2"
          label="Clinical Status at the Time of Consult:" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="clinichis.specific_findings" outlined dense hide-details auto-grow rows="2"
          label="Specific Findings:" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="clinichis.head" outlined dense hide-details auto-grow rows="2" label="Head:" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="clinichis.conjunctiva" outlined dense hide-details label="Conjunctiva (eye anatomy): " />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="clinichis.con_remarks" outlined dense hide-details auto-grow rows="2"
          label="Conjunctiva Remarks:" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="clinichis.neck" outlined dense hide-details label="Neck:" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="clinichis.chest" outlined dense hide-details auto-grow rows="2" label="Chest: " />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="clinichis.abdomen" outlined dense hide-details label="Abdomen:" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="clinichis.abdomen_remakrs" outlined dense hide-details auto-grow rows="2"
          label="Abdomen Remarks: " />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="clinichis.genitals" outlined dense hide-details label="Genitals:" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="clinichis.genitals_remakrs" outlined dense hide-details auto-grow rows="2"
          label="Genitals Remarks: " />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="clinichis.extremities" outlined dense hide-details label="Extremities:" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="clinichis.extrimities_remarks" outlined dense hide-details auto-grow rows="2"
          label="Extremities Remarks: " />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="clinichis.others" outlined dense hide-details auto-grow rows="2" label="Others: " />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="clinichis.waist_circumference" outlined dense hide-details auto-grow rows="2"
          label="Waist Circumference: " />
      </VCol>
    </VRow>
  </VForm>
</template>
