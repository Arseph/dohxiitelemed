<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import { useDirtyTracker } from '@/composables/useFormSync';
import { axiosIns } from '@/plugins/axios';
import { computed, onMounted, ref, watch } from "vue";
import { VForm } from 'vuetify/components/VForm';
import { VCol, VRow } from "vuetify/lib/components/index.mjs";

const daform = ref<VForm>();
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

const daTracker = useDirtyTracker(diagass, ['meeting_id', 'patient_id'])

// Watch — clear if_covid when classification is not Covid. Only while editing, so that
// switching between the two forms never touches the values.
watch(
  () => diagass.value.clinical_classification,
  (newVal) => {
    if (isEditing.value && newVal !== 1)
      diagass.value.if_covid = ''
  }
)

const isCovidCase = computed(() => diagass.value.clinical_classification === 1)


const isEditing = ref(false);

// Doctors (the accepting side) can read the requester's copy of this form, read only.
const myRole = ref<string | null>(null);
const canEdit = ref(true); // false: a doctor reading a consultation they are not part of
const otherDa = ref<Record<string, any> | null>(null);

// Doctors can switch between the doctor's form and the requester's. The requester's is always read only.
const viewing = ref<'mine' | 'other'>('mine');
const baseDa = ref<Record<string, any>>({}); // this form with no saved values
const mineDa = ref<Record<string, any>>({}); // the doctor's own saved form (restore point)
const refreshing = ref(false);
const confirmReplace = ref(false);

// The columns of this form that live in the table. All of them can be copied.
const DA_FIELDS = ['summary_assess', 'diagnosis', 'clinical_classification', 'if_covid'] as const;

function isEmpty(value: unknown) {
  return value === null || value === undefined || value === '';
}

// Copies the saved values of a row onto the form. Only non-empty values overwrite.
function applyDa(row: Record<string, any>) {
  for (const key of DA_FIELDS) {
    if (!isEmpty(row[key]))
      diagass.value[key] = row[key];
  }
}

// Switching only happens while not editing (the toggle is disabled otherwise), so no
// unsaved typing is lost. The requester's view can never be edited or saved.
function showMyForm() {
  Object.assign(diagass.value, mineDa.value);
}

function showOtherForm() {
  isEditing.value = false;
  Object.assign(diagass.value, baseDa.value);
  if (otherDa.value)
    applyDa(otherDa.value);
}

function onViewChange(view: 'mine' | 'other') {
  if (view === 'other')
    showOtherForm();
  else
    showMyForm();
}

// Reloads everything from the server and stays on the requester's form, so a doctor can
// pick up what the requester saved since the page loaded. Nothing is pushed to the page,
// so this is how the requester's form is brought up to date.
async function refreshOtherForm() {
  if (!props.consultId)
    return;

  refreshing.value = true;
  try {
    await fetchMeetingInfo(props.consultId); // also puts the view back on the doctor's form
    viewing.value = 'other';
    showOtherForm();
  }
  finally {
    refreshing.value = false;
  }
}

// Copies the requester's answers into the doctor's own form and leaves it open for
// editing. Nothing is saved until the doctor presses Save, and Cancel restores the
// saved values. overwrite=false only fills fields that are still empty.
function copyToMine(overwrite: boolean) {
  confirmReplace.value = false;
  if (!canEdit.value || !otherDa.value)
    return;

  viewing.value = 'mine';
  showMyForm();

  let copied = 0;
  for (const key of DA_FIELDS) {
    const from = otherDa.value[key] ?? null;
    const take = overwrite ? diagass.value[key] !== from : !isEmpty(from) && isEmpty(diagass.value[key]);

    if (take) {
      diagass.value[key] = from;
      copied++;
    }
  }

  if (copied)
    isEditing.value = true;

  successMessage.value = copied
    ? `Copied ${copied} field(s). Review them, then press Save.`
    : 'Nothing to copy: your form already has those answers.';
  isSuccess.value = true;
}


// ---- ICD-10 choices for the diagnosis field ----------------------------------
//
// Same ICD-10 lookup as the patient's Medical History picker. The column is free
// text (varchar 255), so a picked entry is stored as "CODE — description" and
// anything typed that matches no entry is still saved as written; older records keep
// showing what was typed.

interface DiagnosisOption { id: number; diagcode: string; diagdesc: string }

const diagnosisOptions = ref<DiagnosisOption[]>([])
const diagnosisSearch = ref('')
const isSearchingDiagnosis = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | undefined

const diagnosisLabel = (d: DiagnosisOption) => `${d.diagcode} — ${d.diagdesc}`

// Strings, not objects, so the combobox writes the label itself into the model.
const diagnosisItems = computed(() => diagnosisOptions.value.map(diagnosisLabel))

async function fetchDiagnoses(term: string) {
  isSearchingDiagnosis.value = true
  try {
    const response = await axiosIns.get('/api/diagnosis-search', {
      params: { q: term },
    })

    diagnosisOptions.value = response.data.data ?? []
  }
  catch (error) {
    console.error('Error searching diagnoses:', error)
  }
  finally {
    isSearchingDiagnosis.value = false
  }
}

// Debounced: each request scans a 22k-row table. Skipped when the search text is
// the label of an entry just picked from the list, which would match nothing and
// empty it. Not compared against the model: a single combobox copies every
// keystroke into v-model, so that test was always true and nothing was searched.
watch(diagnosisSearch, term => {
  clearTimeout(searchTimer)
  if (!isEditing.value || diagnosisItems.value.includes(term))
    return

  searchTimer = setTimeout(() => fetchDiagnoses(term ?? ''), 300)
})


async function fetchMeetingInfo(meetId) {
  try {
    viewing.value = 'mine';

    const response = await axiosIns.get(`/api/meeting-infoV2`, {
      params: { meet_id: meetId },
    });

    // ✅ v2 wraps under `data`
    const data = response.data.data;

    // ✅ diagnosis already in v2 response — no second API call needed
    const da = data.diagnosis;
    myRole.value = data.my_role ?? null;
    canEdit.value = data.can_edit ?? true;
    otherDa.value = data.other?.diagnosis ?? null;

    diagass.value.meeting_id = data.meetID ?? diagass.value.meeting_id;
    diagass.value.patient_id = data.patient?.id ?? null;
    diagass.value.summary_assess = da?.summary_assess ?? null;
    diagass.value.diagnosis = da?.diagnosis ?? null;
    diagass.value.clinical_classification = da?.clinical_classification ?? null;
    diagass.value.if_covid = da?.if_covid ?? null;

    // Snapshots for the requester view and for Cancel. `base` is this form with no
    // saved values, which the requester's answers are laid over.
    baseDa.value = {
      meeting_id: diagass.value.meeting_id,
      patient_id: diagass.value.patient_id,
      summary_assess: null,
      diagnosis: null,
      clinical_classification: null,
      if_covid: null,
    };
    mineDa.value = { ...diagass.value };

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

// Sends only the fields that changed. On success this user's own form reloads.
async function saveUpdateDA() {
  try {
    // The requester's form can never be saved from here.
    if (viewing.value !== 'mine' || !canEdit.value)
      return;

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

    // Reload this user's own form so the screen shows what the server stored. That
    // also resets the restore point, so cancelEdit() below can't bring back the
    // pre-edit values. Only this user's form reloads; the other side is untouched.
    if (props.consultId)
      await fetchMeetingInfo(props.consultId);

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


// Cancel puts the saved values back, which also undoes anything copied from the requester.
function cancelEdit() {
  Object.assign(diagass.value, mineDa.value);
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
    <VTooltip v-if="canEdit && viewing === 'mine' && isEditing == false" text="Edit" location="top">
      <template #activator="{ props }">
        <VBtn v-bind="props" variant="tonal" color="success" icon="tabler-edit" size="48" class="fab-fixed-botr" rounded
          @click="isEditing = true" />
      </template>
    </VTooltip>

    <!-- Doctors can switch to the requester's form. It is read only. -->
    <VRow v-if="myRole === 'accepter'">
      <VCol cols="12">
        <VBtnToggle v-model="viewing" mandatory divided color="primary" class="w-100 mb-4"
          :disabled="isEditing" @update:model-value="onViewChange">
          <VBtn value="mine" class="flex-grow-1">Accepter form</VBtn>
          <VBtn value="other" class="flex-grow-1">Requester form</VBtn>
        </VBtnToggle>
      </VCol>
    </VRow>
    <VAlert
      v-if="viewing === 'other'"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      <div class="d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-2">
        <!-- Message -->
        <div class="text-body-2">
          You are viewing the requester's form. It is read only.
          <span v-if="!otherDa">The requester has not filled it in yet.</span>
        </div>

        <!-- Actions -->
        <div class="d-flex align-center flex-wrap ga-2 flex-shrink-0">
          <VMenu v-if="canEdit && otherDa">
            <template #activator="{ props }">
              <VBtn
                v-bind="props"
                size="small"
                variant="tonal"
                color="success"
                prepend-icon="tabler-copy"
                append-icon="tabler-chevron-down"
              >
                Copy to my form
              </VBtn>
            </template>

            <VList density="compact">
              <VListItem
                prepend-icon="tabler-forms"
                @click="copyToMine(false)"
              >
                <VListItemTitle>Fill empty fields only</VListItemTitle>
              </VListItem>
              <VListItem
                prepend-icon="tabler-replace"
                @click="confirmReplace = true"
              >
                <VListItemTitle>Replace my form with this</VListItemTitle>
              </VListItem>
            </VList>
          </VMenu>

          <VBtn
            size="small"
            variant="tonal"
            prepend-icon="tabler-refresh"
            :loading="refreshing"
            @click="refreshOtherForm"
          >
            Refresh
          </VBtn>
        </div>
      </div>
    </VAlert>

    <VDialog v-model="confirmReplace" max-width="420">
      <VCard title="Replace your form?">
        <VCardText>
          Everything in your form will be replaced by the requester's answers. Nothing is saved until you press Save, and Cancel brings your form back.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="confirmReplace = false">Keep mine</VBtn>
          <VBtn color="warning" variant="tonal" @click="copyToMine(true)">Replace</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- <pre>diagrass vals{{ diagass }}</pre> -->
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
        <VCombobox v-model="diagass.diagnosis" v-model:search="diagnosisSearch" :items="diagnosisItems"
          outlined dense no-filter :loading="isSearchingDiagnosis" maxlength="255"
          :rules="[requiredValidator]" :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }"
          no-data-text="Type to search ICD-10 codes, or enter your own diagnosis"
          hint="Search by code (E11) or description (diabetes)" :persistent-hint="isEditing">
          <template #label><span class="req-label">Diagnosis</span></template>
        </VCombobox>
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
</style>
