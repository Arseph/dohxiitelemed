<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import { useUser } from '@/composables/useUser';
import { axiosIns } from '@/plugins/axios';
import { ref } from "vue";
import { VForm } from 'vuetify/components/VForm';
import { VCol, VRow, VTextField } from "vuetify/lib/components/index.mjs";

const refForm = ref<VForm>();
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

const clinichis = ref({
  // savedID: props.consultId,
  meetID: '',
  title: '',
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
      title: data.title,
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
});
</script>

<template>
  <div class="d-flex flex-column justify-center">
  </div>
  <h5>
    <pre>{{ clinichis }}</pre>
  </h5>
  <br></br>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Reason for Teleconsultation:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextField outlined dense hide-details label="Date of Onset of Illness:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VSelect v-model="clinichis.refhlthfac" :items="['Member', 'Dependent', 'None']"
        label="Name of Referral Health Facility (if Applicable): " outlined dense hide-details />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Known Medical Condition/s & Medical History:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextField outlined dense hide-details label="Current Medications:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextField outlined dense hide-details label="Blood Type:" />
    </VCol>
  </VRow>
  <VRow class="align-center">
    <VCol>
      <h5 class="text-h5 font-weight-medium mb-2">Physical Examination(Inspection)</h5>
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Clinical Status at the Time of Consult:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Specific Findings:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Head:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextField outlined dense hide-details label="Conjunctiva (eye anatomy): " />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Conjunctiva Remarks:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextField outlined dense hide-details label="Neck:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Chest: " />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextField outlined dense hide-details label="Abdomen:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Abdomen Remarks: " />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextField outlined dense hide-details label="Genitals:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Genitals Remarks: " />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextField outlined dense hide-details label="Extremities:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Extremities Remarks: " />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Others: " />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Waist Circumference: " />
    </VCol>
  </VRow>
</template>
