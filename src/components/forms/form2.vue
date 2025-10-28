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
    const response = await axiosIns.get(`/api/meeting-info`, {
      params: { meet_id: meetId },
    });

    const data = response.data;

    // DOC name 
    const docfname = data.docfname ?? '';

    // ✅ Clinical History
    clinichis.value = {
      meeting_id: data.meetID ?? null,
      reason_consult: data.reason_consult ?? '',
      date_onset_illness: data.date_onset_illness ?? '',
      date_referral: data.date_referral ?? '',
      facilityOptions: data.facilityOptions ?? '',
      known_medical_history: data.known_medical_history ?? '',
      current_medication: data.current_medication ?? '',
      blood_type: data.blood_type ?? '',
      clinical_status_time_consult: data.clinical_status_time_consult ?? '',
      specific_findings: data.specific_findings ?? '',
    };

    // ✅ Physical Exam
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

    console.log("Clinical History fetched:", clinichis.value);

    // 🔹 Step 3: Try to fetch existing Clinical History
    if (clinichis.value.meeting_id) {
      const chResponse = await axiosIns.get(`/api/get-clinicalhistory/${clinichis.value.meeting_id}`);
      const ch = chResponse.data.data;

      if (ch) {
        console.log("✅ Existing clinical history found:", ch);

        // Merge existing ch data into meeting.value
        clinichis.value.meeting_id = ch.meeting_id ?? null;
        clinichis.value.reason_consult = ch.reason_consult ?? null;
        clinichis.value.date_onset_illness = ch.date_onset_illness ?? null;
        clinichis.value.date_referral = ch.date_referral ?? null;
        clinichis.value.facilityOptions = ch.facility_id ?? null;
        clinichis.value.known_medical_history = ch.known_medical_history ?? null;
        clinichis.value.current_medication = ch.current_medication ?? null;
        clinichis.value.blood_type = ch.blood_type ?? null;
        clinichis.value.clinical_status_time_consult = ch.clinical_status_time_consult ?? null;
        clinichis.value.specific_findings = ch.specific_findings ?? null;

      } else {
        console.log("ℹ️ No clinical history found for this meeting ID.");
      }
    }

    // 🔹 Step 4: Try to fetch existing physical exam
    if (physexam.value.meeting_id) {
      const peResponse = await axiosIns.get(`/api/get-physicalexam/${physexam.value.meeting_id}`);
      const pe = peResponse.data.data;

      if (pe) {
        console.log("✅ Physical exam history found:", pe);

        // Merge existing pe data into meeting.value
        physexam.value.meeting_id = pe.meeting_id ?? null;
        physexam.value.head = pe.head ?? null;
        physexam.value.conjunctiva = pe.conjunctiva ?? null;
        physexam.value.con_remarks = pe.con_remarks ?? null;
        physexam.value.neck = pe.neck ?? null;
        physexam.value.chest = pe.chest ?? null;
        physexam.value.breast = pe.breast ?? null;
        physexam.value.breast_remarks = pe.breast_remarks ?? null;
        physexam.value.thorax = pe.thorax ?? null;
        physexam.value.abdomen = pe.abdomen ?? null;
        physexam.value.abdomen_remarks = pe.abdomen_remarks ?? null;
        physexam.value.genitals = pe.genitals ?? null;
        physexam.value.genital_remarks = pe.genital_remarks ?? null;
        physexam.value.extremities = pe.extremities ?? null;
        physexam.value.extremities_remarks = pe.extremities_remarks ?? null;
        physexam.value.others = pe.others ?? null;
        physexam.value.waist_circumference = pe.waist_circumference ?? null;

      } else {
        console.log("ℹ️ No physical exam  found for this meeting ID.");
      }
    }



  } catch (error) {
    console.error("Error fetching clinical history or physical exam:", error);
    // errorMessage.value = "Failed to fetch clnical history or physical exam:";
    // isError.value = true;
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
    successMessage.value = "Saved Physical Exam.";
    isSuccess.value = true;

  } catch (error) {
    console.error("Error Saving Physical Exam:", error);
    errorMessage.value = "Failed to save Physical Exam.";
    isError.value = true;

  }
}

const requiredValidator = (v) => !!v || 'This field is required'
</script>

<template>
  <VForm ref="clinform">
    <VBtn variant="tonal" color="success" icon="tabler-device-floppy" size="48"
      @click="() => { saveUpdateCH(); saveUpdatePE(); }" class="fab-fixed-top">
    </VBtn>
    <div class="d-flex flex-column justify-center">
    </div>
    <h5>
      <!-- <pre>{{ clinichis }}{{ physexam }}</pre> -->
    </h5>
    <br></br>
    <VRow>
      <VCol>
        <VTextarea v-model="clinichis.reason_consult" outlined dense hide-details auto-grow rows="2"
          label="Reason for Teleconsultation:" :rules="[requiredValidator]" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="clinichis.date_referral" type="date" outlined dense hide-details
          label="Date of Referral:" />
      </VCol>
      <VCol>
        <VTextField v-model="clinichis.date_onset_illness" type="date" outlined dense hide-details
          label="Date of Onset of Illness:" :rules="[requiredValidator]" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VAutocomplete v-model="clinichis.facilityOptions" :items="facilityOptions" item-title="facilityname"
          item-value="id" label="Name of Referral Health Facility (if Applicable):" outlined dense hide-details
          clearable persistent-hint />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="clinichis.known_medical_history" outlined dense hide-details auto-grow rows="2"
          label="Known Medical Condition/s & Medical History:" :rules="[requiredValidator]" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="clinichis.current_medication" outlined dense hide-details label="Current Medications:"
          :rules="[requiredValidator]" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="clinichis.blood_type" outlined dense hide-details label="Blood Type:"
          :rules="[requiredValidator]" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="clinichis.specific_findings" outlined dense hide-details auto-grow rows="2"
          label="Specific Findings:" :rules="[requiredValidator]" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="clinichis.clinical_status_time_consult" outlined dense hide-details auto-grow rows="2"
          label="Clinical Status at the Time of Consult:" :rules="[requiredValidator]" />
      </VCol>
    </VRow>
    <br />
    <br />
    <VRow
      style="background-color: rgba(255, 0, 128, 0.15); padding-top: 4%; padding-left: 4%; padding-bottom: 2%; border-radius: 5px;">
      <Vcol>
        <h5 class=" text-h5 font-weight-medium mb-2" style="margin-left: -10px; color:#ff66b3">
          Physical Examination (Inspection)
        </h5>
      </Vcol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="physexam.head" outlined dense hide-details auto-grow rows="2" label="Head:"
          :rules="[requiredValidator]" />
      </VCol>
    </VRow>
    <VRow v-for="(item, index) in examFields" :key="index">
      <VCol>
        <!-- Field -->
        <VTextField v-model="physexam[item.field]" outlined dense hide-details :label="item.label + ':'" class="mb-2"
          :rules="[requiredValidator]" />
        <!-- Remarks (hidden for Neck and Chest) -->
        <VTextarea v-if="item.field !== 'neck' && item.field !== 'chest'" v-model="physexam[item.remark]" outlined dense
          hide-details auto-grow rows="2" :label="item.label + ' Remarks:'" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="physexam.others" outlined dense hide-details auto-grow rows="2" label="Others: " />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="physexam.waist_circumference" outlined dense hide-details auto-grow rows="2"
          label="Waist Circumference: " />
      </VCol>
    </VRow>
  </VForm>
</template>
