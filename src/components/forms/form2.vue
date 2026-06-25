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
const emit = defineEmits(['loaded'])



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
  meeting_id: '',
  reason_consult: '',
  date_onset_illness: '',
  date_referral: '',
  facilityOptions: '', //facility list
  known_medical_history: '',
  current_medication: '',
  blood_type: '',
  clinical_status_time_consult: '',
  specific_findings: '',
});

const physexam = ref({
  // savedID: props.consultId,
  meeting_id: '',
  head: '',
  conjunctiva: '',
  con_remarks: '',
  neck: '',
  chest: '',
  breast: '',
  breast_remarks: '',
  thorax: '',
  thorax_remarks: '',
  abdomen: '',
  abdomen_remarks: '',
  genitals: '',
  genital_remarks: '',
  extremities: '',
  extremities_remarks: '',
  others: '',
  waist_circumference: '',
});

// ✅ loop data definition for exam
const examFields = [
  { field: 'conjunctiva', label: 'Conjunctiva (Eye Anatomy)', remark: 'con_remarks' },
  { field: 'neck', label: 'Neck', remark: 'neck_remarks' }, // optional if you’ll add later
  { field: 'chest', label: 'Chest', remark: 'chest_remarks' }, // optional
  { field: 'breast', label: 'Breast', remark: 'breast_remarks' },
  { field: 'thorax', label: 'Thorax', remark: 'thorax_remarks' },
  { field: 'abdomen', label: 'Abdomen', remark: 'abdomen_remarks' },
  { field: 'genitals', label: 'Genitals', remark: 'genital_remarks' },
  { field: 'extremities', label: 'Extremities', remark: 'extremities_remarks' },
]


// const meeting = ref<any>(null);
async function fetchMeetingInfo(meetId: number) {
  try {
    // Step 1: Fetch both Clinical History (CH) and Physical Exam (PE) in parallel
    const [chResponse, peResponse] = await Promise.all([
      axiosIns.get(`/api/get-clinicalhistory/${meetId}`),
      axiosIns.get(`/api/get-physicalexam/${meetId}`)
    ]);

    const ch = chResponse.data.data;
    const pe = peResponse.data.data;

    // Step 2: Handle Clinical History
    if (ch) {
      console.log("✅ Existing clinical history found:", ch);
      clinichis.value = {
        meeting_id: ch.meeting_id ?? null,
        reason_consult: ch.reason_consult ?? '',
        date_onset_illness: ch.date_onset_illness ?? null,
        date_referral: ch.date_referral ?? null,
        facilityOptions: ch.facility_id ?? null,
        known_medical_history: ch.known_medical_history ?? null,
        current_medication: ch.current_medication ?? null,
        blood_type: ch.blood_type ?? null,
        clinical_status_time_consult: ch.clinical_status_time_consult ?? null,
        specific_findings: ch.specific_findings ?? null,
      };
      console.log("✅ Clinical History fetched:", clinichis.value);
    } else {
      console.log("ℹ️ No clinical history found.");
    }

    // Step 3: Handle Physical Exam
    if (pe) {
      console.log("✅ Existing physical exam found:", pe);
      physexam.value = {
        meeting_id: pe.meeting_id ?? null,
        head: pe.head ?? '',
        conjunctiva: pe.conjunctiva ?? '',
        con_remarks: pe.con_remarks ?? '',
        neck: pe.neck ?? '',
        chest: pe.chest ?? '',
        breast: pe.breast ?? '',
        breast_remarks: pe.breast_remarks ?? '',
        thorax: pe.thorax ?? '',
        thorax_remarks: pe.thorax_remarks ?? '',
        abdomen: pe.abdomen ?? '',
        abdomen_remarks: pe.abdomen_remarks ?? '',
        genitals: pe.genitals ?? '',
        genital_remarks: pe.genital_remarks ?? '',
        extremities: pe.extremities ?? '',
        extremities_remarks: pe.extremities_remarks ?? '',
        others: pe.others ?? '',
        waist_circumference: pe.waist_circumference ?? '',
      };
      console.log("✅ Physical Exam fetched:", physexam.value);
    } else {
      console.log("ℹ️ No physical exam found.");
    }

    // Step 4: If both CH and PE are not found, fetch meeting info
    if (!ch && !pe) {
      console.log("ℹ️ No clinical history or physical exam found, fetching meeting info.");
      const meetingResponse = await axiosIns.get(`/api/meeting-infoV2`, {
        params: { meet_id: meetId },
      });
      const data = meetingResponse.data;

      // Populate Clinical History from meeting info
      clinichis.value = {
        meeting_id: data.meetID ?? null,
        reason_consult: data.title ?? '',
      };

      // Populate Physical Exam from meeting info
      physexam.value = {
        meeting_id: data.meetID ?? null,
        head: data.head ?? '',
        conjunctiva: data.conjunctiva ?? '',
        con_remarks: data.con_remarks ?? '',
        neck: data.neck ?? '',
        chest: data.chest ?? '',
        breast: data.breast ?? '',
        breast_remarks: data.breast_remarks ?? '',
        thorax: data.thorax ?? '',
        thorax_remarks: data.thorax_remarks ?? '',
        abdomen: data.abdomen ?? '',
        abdomen_remarks: data.abdomen_remarks ?? '',
        genitals: data.genitals ?? '',
        genital_remarks: data.genital_remarks ?? '',
        extremities: data.extremities ?? '',
        extremities_remarks: data.extremities_remarks ?? '',
        others: data.others ?? '',
        waist_circumference: data.waist_circumference ?? '',
      };

      console.log("✅ Meeting Info fetched and populated Clinical History & Physical Exam:", {
        clinichis: clinichis.value,
        physexam: physexam.value,
      });
    }

  } catch (error) {
    console.error("Error fetching clinical history, physical exam, or meeting info:", error);
    errorMessage.value = "Failed to fetch data.";
    isError.value = true;
  } finally {
    emit('loaded');
  }
}



onMounted(() => {
  if (props.consultId) fetchMeetingInfo(props.consultId);
  fetchFacilities();
});

async function saveUpdateCH() {
  try {
    // Ensure form validation
    const { valid } = await clinform.value.validate();

    if (!valid) {
      errorMessage.value = "Please fill in all required fields correctly.";
      isError.value = true;
      return;
    }

    // ✅ Prepare payload using all meeting data
    const payload = {
      meeting_id: clinichis.value.meeting_id,
      reason_consult: clinichis.value.reason_consult,
      date_onset_illness: clinichis.value.date_onset_illness,
      date_referral: clinichis.value.date_referral,
      facility_id: clinichis.value.facilityOptions,
      known_medical_history: clinichis.value.known_medical_history,
      current_medication: clinichis.value.current_medication,
      blood_type: clinichis.value.blood_type,
      clinical_status_time_consult: clinichis.value.clinical_status_time_consult,
      specific_findings: clinichis.value.specific_findings,
    };


    console.log("Payload being sent:", payload);
    // Send request
    const response = await axiosIns.post('/api/save-clinicalhistory', payload); //no route yet

    // Success response handling
    successMessage.value = "Saved  Clinical history.";
    isSuccess.value = true;
    cancelEdit();


  } catch (error) {
    console.error("Error Saving Clinical History:", error);
    errorMessage.value = "Failed to save Clinical History.";
    isError.value = true;

  }
}

async function saveUpdatePE() {
  try {
    // Ensure form validation
    const { valid } = await clinform.value.validate();

    if (!valid) {
      errorMessage.value = "Please fill in all required fields correctly.";
      isError.value = true;
      return;
    }

    // ✅ Prepare payload using all meeting data
    const payload = {
      meeting_id: physexam.value.meeting_id,
      head: physexam.value.head,
      conjunctiva: physexam.value.conjunctiva,
      con_remarks: physexam.value.con_remarks,
      neck: physexam.value.neck,
      chest: physexam.value.chest,
      breast: physexam.value.breast,
      breast_remarks: physexam.value.breast_remarks,
      thorax: physexam.value.thorax,
      thorax_remarks: physexam.value.thorax_remarks,
      abdomen: physexam.value.abdomen,
      abdomen_remarks: physexam.value.abdomen_remarks,
      genitals: physexam.value.genitals,
      genital_remarks: physexam.value.genital_remarks,
      extremities: physexam.value.extremities,
      extremities_remarks: physexam.value.extremities_remarks,
      others: physexam.value.others,
      waist_circumference: physexam.value.waist_circumference,
    };


    console.log("Payload being sent:", payload);
    // Send request
    const response = await axiosIns.post('/api/save-physicalexam', payload); //no route yet

    // Success response handling
    setTimeout(function () {
      successMessage.value = "Saved Physical Exam.";
    }, 1050);
    isSuccess.value = true;

  } catch (error) {
    console.error("Error Saving Physical Exam:", error);
    setTimeout(function () {
      errorMessage.value = "Failed to save Physical Exam.";
    }, 1050);
    isError.value = true;

  }
}

const requiredValidator = (v) => !!v || 'This field is required';

const isEditing = ref(false);

function cancelEdit() {
  isEditing.value = false;
}

</script>

<template>
  <VForm ref="clinform" style="align-self: stretch; width: 100%;">
    <VTooltip v-if="isEditing == true" text="Save" location="top">
      <template #activator="{ props }">
        <VBtn v-bind="props" variant="tonal" color="success" icon="tabler-device-floppy" size="48"
          class="fab-fixed-botr" @click="() => { saveUpdateCH(); saveUpdatePE(); }" />
      </template>
    </VTooltip>
    <VTooltip v-if="isEditing == true" text="Cancel" location="top">
      <template #activator="{ props }">
        <VBtn v-bind="props" variant="tonal" color="error" icon="tabler-x" size="48" class="fab-fixed-botr mr-15"
          @click="cancelEdit" />
      </template>
    </VTooltip>
    <VTooltip v-if="isEditing == false" text="Edit" location="top">
      <template #activator="{ props }">
        <VBtn v-bind="props" variant="tonal" color="success" icon="tabler-edit" size="48" class="fab-fixed-botr" rounded
          @click="isEditing = true" />
      </template>
    </VTooltip>
    <div class="d-flex flex-column justify-center">
    </div>
    <h5>
      <!-- <pre>{{ clinichis }}{{ physexam }}</pre> -->
    </h5>
    <br></br>
    <VRow>
      <VCol cols="12" md="12">
        <VTextarea v-model="clinichis.reason_consult" outlined dense hide-details auto-grow rows="2"
          label="Reason for Teleconsultation:" :rules="[requiredValidator]" :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="clinichis.date_referral" type="date" outlined dense hide-details label="Date of Referral:"
          :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
      <VCol>
        <VTextField v-model="clinichis.date_onset_illness" type="date" outlined dense hide-details
          label="Date of Onset of Illness:" :rules="[requiredValidator]" :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VAutocomplete v-model="clinichis.facilityOptions" :items="facilityOptions" item-title="facilityname"
          item-value="id" label="Name of Referral Health Facility (if Applicable):" outlined dense hide-details
          clearable persistent-hint :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="clinichis.known_medical_history" outlined dense hide-details auto-grow rows="2"
          label="Known Medical Condition/s & Medical History:" :rules="[requiredValidator]" :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="clinichis.current_medication" outlined dense hide-details label="Current Medications:"
          :rules="[requiredValidator]" :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="clinichis.blood_type" outlined dense hide-details label="Blood Type:"
          :rules="[requiredValidator]" :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="clinichis.specific_findings" outlined dense hide-details auto-grow rows="2"
          label="Specific Findings:" :rules="[requiredValidator]" :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="clinichis.clinical_status_time_consult" outlined dense hide-details auto-grow rows="2"
          label="Clinical Status at the Time of Consult:" :rules="[requiredValidator]" :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <br />
    <br />
    <VRow style="background-color: rgba(255, 0, 128, 0.15); padding: 10px;" class="rounded">
      <Vcol>
        <span class=" text-h5 font-weight-medium mb-2" style=" color:#ff66b3">
          Physical Examination (Inspection)
        </span>
      </Vcol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="physexam.head" outlined dense hide-details auto-grow rows="2" label="Head:"
          :rules="[requiredValidator]" :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow v-for="(item, index) in examFields" :key="index">
      <VCol>
        <!-- Field -->
        <VTextField v-model="physexam[item.field]" outlined dense hide-details :label="item.label + ':'" class="mb-2"
          :rules="[requiredValidator]" :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
        <!-- Remarks (hidden for Neck and Chest) -->
        <VTextarea v-if="item.field !== 'neck' && item.field !== 'chest'" v-model="physexam[item.remark]" outlined dense
          hide-details auto-grow rows="2" :label="item.label + ' Remarks:'" :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="physexam.others" outlined dense hide-details auto-grow rows="2" label="Others: "
          :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="physexam.waist_circumference" outlined dense hide-details auto-grow rows="2"
          label="Waist Circumference: " :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
  </VForm>
</template>
