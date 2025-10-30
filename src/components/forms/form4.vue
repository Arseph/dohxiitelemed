<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import { useUser } from '@/composables/useUser';
import { axiosIns } from '@/plugins/axios';
import { ref } from "vue";
import { VForm } from 'vuetify/components/VForm';
import { VCol, VRow } from "vuetify/lib/components/index.mjs";

const daform = ref<VForm>();
const { user } = useUser();
const { isError, errorMessage, isSuccess, successMessage } = cStatus();
const emit = defineEmits(['loaded'])


// Props — so this form can be reused for different calls
const props = defineProps({
  consultId: {
    type: Number,
    required: false,
  },
});

const diagass = ref({
  // savedID: props.consultId,
  meeting_id: props.consultId ?? '',
  patient_id: '',
  summary_assess: '',
  diagnosis: '',
  clinical_classification: '',
  if_covid: '',
});

// Watch for changes
watch(
  () => diagass.value.clinical_classification,
  (newVal) => {
    if (newVal != 1) {
      diagass.value.if_covid = ''
    }
  }
)


async function fetchMeetingInfo() {
  try {
    // Fetch meeting info
    // const response = await axiosIns.get(`/api/meeting-info`, {
    //   params: { meet_id: meetId },
    // });

    // const data = response.data;

    // // Populate meeting data (defaults to null if missing)
    // diagass.value = {
    //   meeting_id: data.meetID ?? null,
    //   patient_id: data.patID ?? null,

    // };

    // console.log("✅ Meeting info fetched:", diagass.value);

    // 🔹 Step 3: Try to fetch existing Demographic Profile
    if (diagass.value.meeting_id) {
      const daResponse = await axiosIns.get(`/api/get-diagnosisassessment/${diagass.value.meeting_id}`);
      const da = daResponse.data.data;

      if (da) {
        console.log("✅ Existing Diagnosis / Assessment found:", da);

        // Merge existing DP data into diagass.value
        diagass.value.meeting_id = da.meeting_id ?? null;
        diagass.value.patient_id = da.patient_id ?? null;
        diagass.value.summary_assess = da.summary_assess ?? null;
        diagass.value.diagnosis = da.diagnosis ?? null;
        diagass.value.clinical_classification = da.clinical_classification ?? null;
        diagass.value.if_covid = da.if_covid ?? null;
      } else {
        console.log("ℹ️ No Diagnosis / Assessment found for this meeting ID.");
      }
    }

  } catch (error) {
    console.error("❌ Error fetching meeting info or DA:", error);
    errorMessage.value = "Failed to load meeting info.";
    isError.value = true;
  } finally {
    emit('loaded');
  }
}

async function saveUpdateDA() {
  try {
    // Ensure form validation
    const { valid } = await daform.value.validate();

    if (!valid) {
      errorMessage.value = "Please fill in all required fields correctly.";
      isError.value = true;
      return;
    }

    // ✅ Prepare payload using all meeting data
    const payload = {
      meeting_id: diagass.value.meeting_id,
      patient_id: diagass.value.patient_id,
      summary_assess: diagass.value.summary_assess,
      diagnosis: diagass.value.diagnosis,
      clinical_classification: diagass.value.clinical_classification,
      if_covid: diagass.value.if_covid,
    };


    console.log("Payload being sent:", payload);
    // Send request
    const response = await axiosIns.post('/api/save-diagnosisassessment', payload);

    // Success response handling
    successMessage.value = "Saved  Diagnosis / Assessment.";
    isSuccess.value = true;

  } catch (error) {
    console.error("Error Saving Diagnosis / Assessment:", error);
    errorMessage.value = "Failed to save Diagnosis / Assessment.";
    isError.value = true;

  }
}

onMounted(() => {
  fetchMeetingInfo();
});

const requiredValidator = (v) => !!v || 'This field is required'
</script>

<template>
  <VForm ref="daform" style="align-self: stretch; width: 100%;">
    <VTooltip text="Save" location="top">
      <template #activator="{ props }">
        <VBtn v-bind="props" variant="tonal" color="success" icon="tabler-device-floppy" size="48" class="fab-fixed-top"
          @click="() => { saveUpdateDA(); }" />
      </template>
    </VTooltip>
    <!-- <pre>diagrass vals{{ diagass }}</pre> -->
    <VRow>
      <VCol>
        <VTextarea v-model="diagass.summary_assess" outlined dense hide-details auto-grow rows="2"
          label="Summary of Assessment Findings:" :rules="[requiredValidator]" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="diagass.diagnosis" outlined dense hide-details auto-grow rows="2" label="Diagnosis:"
          :rules="[requiredValidator]" />
      </VCol>
    </VRow>
    <VRow class="align-center" flex>
      <VCol class="d-flex align-center">
        <label>
          Clinical Classification:
        </label>
        <div class="d-flex align-center">
          <VRadioGroup v-model="diagass.clinical_classification" inline hide-details density="compact"
            :rules="[v => v === 2 || v === 0 || v === 1 ? true : 'This field is required']">
            <VRadio label="Covid-19 Case" :value="1" />
            <VRadio label="Non-Covid-19 Case" :value="0" />
          </VRadioGroup>
        </div>
      </VCol>
    </VRow>
    <VRow v-if="diagass.clinical_classification == 1" class="align-center" flex>
      <VCol class="d-flex align-center">
        <label>
          If Covid-19 Case:
        </label>
        <div class="d-flex align-center">
          <VRadioGroup v-model="diagass.if_covid" inline hide-details density="compact">
            <VRadio label="Suspected Cases " :value="0" />
            <VRadio label="Probable Case " :value="1" />
            <VRadio label="Confirmed Case " :value="2" />
          </VRadioGroup>
        </div>
      </VCol>
    </VRow>
  </VForm>
</template>
