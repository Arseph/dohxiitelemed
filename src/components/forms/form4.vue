<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import { useDirtyTracker, useFormSync } from '@/composables/useFormSync';
import { useUser } from '@/composables/useUser';
import { axiosIns } from '@/plugins/axios';
import { computed, onMounted, ref, watch } from "vue";
import { VForm } from 'vuetify/components/VForm';
import { VCol, VRow } from "vuetify/lib/components/index.mjs";

const daform = ref<VForm>();
const { user } = useUser();
const { isError, errorMessage, isSuccess, successMessage } = cStatus();
const emit = defineEmits(['loaded'])

const props = defineProps({
  consultId: {
    type: Number,
    required: false,
  },
});

const diagass = ref({
  meeting_id: props.consultId ?? '',
  patient_id: '',
  summary_assess: '',
  diagnosis: '',
  clinical_classification: '',
  if_covid: '',
});

// Collaborative editing. The doctor and the staff member beside the patient take
// turns filling this form during the call: entering edit mode tells the other side,
// saving sends only what changed, and the other side refetches afterwards so both
// screens always show what is actually stored.
const { connected, remoteEditor, notifySaved, setEditing } = useFormSync({
  form: 'diagnosis_assessment',
  editorName: computed(() => user.value?.name ?? 'Other user'),
  onRemoteSave: () => {
    // Full refresh, including anything typed but not saved here. Keeping local edits
    // would leave the form showing something the record does not contain.
    if (props.consultId)
      fetchMeetingInfo(props.consultId)
  },
})

const daTracker = useDirtyTracker(diagass, ['meeting_id', 'patient_id'])

// Watch — clear if_covid when classification is not Covid
watch(
  () => diagass.value.clinical_classification,
  (newVal) => {
    if (newVal !== 1)
      diagass.value.if_covid = ''
  }
)

const isCovidCase = computed(() => diagass.value.clinical_classification === 1)

const isEditing = ref(false);

// Announce edit mode both ways, so the other side's banner appears and clears.
watch(isEditing, editing => setEditing(editing))


async function fetchMeetingInfo(meetId) {
  try {
    const response = await axiosIns.get(`/api/meeting-infoV2`, {
      params: { meet_id: meetId },
    });

    // ✅ v2 wraps under `data`
    const data = response.data.data;

    // ✅ diagnosis already in v2 response — no second API call needed
    const da = data.diagnosis;

    diagass.value.meeting_id = data.meetID ?? diagass.value.meeting_id;
    diagass.value.patient_id = data.patient?.id ?? null;
    diagass.value.summary_assess = da?.summary_assess ?? null;
    diagass.value.diagnosis = da?.diagnosis ?? null;
    diagass.value.clinical_classification = da?.clinical_classification ?? null;
    diagass.value.if_covid = da?.if_covid ?? null;

    // Baseline for the next save. setRecordExists decides whether that save can
    // narrow to changed fields or must send everything to satisfy NOT NULL columns.
    daTracker.setRecordExists(!!da);
    daTracker.markClean();

  } catch (error) {
    console.error("❌ Error fetching meeting info:", error);
    console.error("Details:", error.response?.data);
    errorMessage.value = "Failed to load meeting info.";
    isError.value = true;
  } finally {
    emit('loaded');
  }
}

// Sends only the fields that changed, so this save cannot overwrite columns the
// other participant edited. On success the other side is told to refetch.
async function saveUpdateDA() {
  try {
    const { valid } = await daform.value.validate();

    if (!valid) {
      errorMessage.value = "Please fill in all required fields correctly.";
      isError.value = true;
      return;
    }

    const changed = daTracker.dirty();

    if (Object.keys(changed).length) {
      await axiosIns.post('/api/save-diagnosisassessment', {
        meeting_id: diagass.value.meeting_id,
        patient_id: diagass.value.patient_id,
        ...changed,
      });
      // The row is there now, so later saves can narrow to what changed.
      daTracker.setRecordExists(true);
      daTracker.markClean();
    }

    // Tell the other participant to refetch, even if nothing changed here — their
    // copy may still be showing something older.
    notifySaved();

    successMessage.value = "Saved Diagnosis / Assessment.";
    isSuccess.value = true;
    cancelEdit();

  } catch (error) {
    console.error("Error Saving Diagnosis / Assessment:", error);
    console.error("Details:", error.response?.data); // ✅ shows exact 422 fields
    errorMessage.value = "Failed to save Diagnosis / Assessment.";
    isError.value = true;
  }
}

onMounted(() => {
  if (props.consultId) fetchMeetingInfo(props.consultId);
});

const requiredValidator = (v: any) => (v !== '' && v !== null && v !== undefined) || 'This field is required';
const radioRequiredValidator = (v: any) => (v === 0 || v === 1 || v === 2) ? true : 'This field is required';


function cancelEdit() {
  isEditing.value = false;
}
</script>

<template>
  <VForm ref="daform" style="align-self: stretch; width: 100%;">
    <VTooltip v-if="isEditing == true" text="Save" location="top">
      <template #activator="{ props }">
        <VBtn v-bind="props" variant="tonal" color="success" icon="tabler-device-floppy" size="48"
          class="fab-fixed-botr" @click="() => { saveUpdateDA(); }" />
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
    <!-- <pre>diagrass vals{{ diagass }}</pre> -->
    <VAlert v-if="remoteEditor" type="warning" variant="tonal" density="compact" class="mb-3 form-remote-editing">
      {{ remoteEditor }} is editing this form. It will refresh when they save.
    </VAlert>
    <VRow>
      <VCol>
        <VTextarea v-model="diagass.summary_assess" outlined dense auto-grow rows="2"
          :rules="[requiredValidator]" :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }">
          <template #label><span class="req-label">Summary of Assessment Findings</span></template>
        </VTextarea>
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="diagass.diagnosis" outlined dense auto-grow rows="2"
          :rules="[requiredValidator]" :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }">
          <template #label><span class="req-label">Diagnosis</span></template>
        </VTextarea>
      </VCol>
    </VRow>
    <VRow class="align-center" flex>
      <VCol class="d-flex align-center">
        <label class="req-label">
          Clinical Classification
        </label>
        <div class="d-flex align-center">
          <VRadioGroup v-model="diagass.clinical_classification" inline density="compact"
            :rules="[radioRequiredValidator]" :readonly="!isEditing"
            :class="{ 'custom-disabled': !isEditing }">
            <VRadio label="Covid-19 Case" :value="1" />
            <VRadio label="Non-Covid-19 Case" :value="0" />
          </VRadioGroup>
        </div>
      </VCol>
    </VRow>
    <VRow v-if="isCovidCase" class="align-center" flex>
      <VCol class="d-flex align-center">
        <label class="req-label">
          If Covid-19 Case
        </label>
        <div class="d-flex align-center">
          <VRadioGroup v-model="diagass.if_covid" inline density="compact"
            :rules="isCovidCase ? [radioRequiredValidator] : []" :readonly="!isEditing"
            :class="{ 'custom-disabled': !isEditing }">
            <VRadio label="Suspected Cases" :value="0" />
            <VRadio label="Probable Case" :value="1" />
            <VRadio label="Confirmed Case" :value="2" />
          </VRadioGroup>
        </div>
      </VCol>
    </VRow>
  </VForm>
</template>

<style>
.req-label::after {
  content: " *";
  color: #f44336;
  font-weight: bold;
}

.custom-disabled {
  opacity: 0.6;
  pointer-events: none;
}

/*
  Shown while the other participant is in edit mode. Deliberately loud: it is the
  only warning that this form is about to be refreshed out from under you, taking
  any unsaved typing with it.
*/
.form-remote-editing {
  border: 2px solid #ff6d00;
  color: #ff6d00 !important;
  font-weight: 800;
  letter-spacing: 0.02em;

  /* Black outline keeps the orange readable — the drawer sits over the video feed,
     so the backdrop behind it is unpredictable. */
  text-shadow:
    -1px -1px 0 #000,
    1px -1px 0 #000,
    -1px 1px 0 #000,
    1px 1px 0 #000;
}
</style>
