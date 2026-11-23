<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import { useDirtyTracker } from '@/composables/useFormSync';
import { useUser } from '@/composables/useUser';
import { axiosIns } from '@/plugins/axios';
import { computed, ref } from "vue";
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

// This card holds two records (clinical history and physical exam), so there is one
// dirty tracker per record. Each save sends only what changed.

// clinichis stores the facility under 'facilityOptions' but the column is
// 'facility_id', so dirtiness is tracked on the payload shape, not the model.
const chPayload = computed(() => ({
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
}))

const chTracker = useDirtyTracker(chPayload, ['meeting_id'])
const peTracker = useDirtyTracker(physexam, ['meeting_id'])

const isEditing = ref(false);

// Doctors (the accepting side) can read the requester's copy of these forms, read only.
const myRole = ref<string | null>(null);
const canEdit = ref(true); // false: a doctor reading a consultation they are not part of
const otherCH = ref<Record<string, any> | null>(null);
const otherPE = ref<Record<string, any> | null>(null);

// Doctors can switch between the accepter's form and the requester's. The requester's
// is always read only.
const viewing = ref<'mine' | 'rhu'>('mine');
const ownCH = ref<Record<string, any>>({}); // the doctor's own copy, set after every load
const ownPE = ref<Record<string, any>>({});

// Maps a saved row (the doctor's own, or the requester's) onto the form's field names.
function chFromRow(ch: Record<string, any>) {
  return {
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
}

function peFromRow(pe: Record<string, any>) {
  return {
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
}

async function fetchMeetingInfo(meetId: number) {
  try {
    viewing.value = 'mine';

    // Step 1: Fetch both Clinical History (CH) and Physical Exam (PE) in parallel
    const [chResponse, peResponse] = await Promise.all([
      axiosIns.get(`/api/get-clinicalhistory/${meetId}`),
      axiosIns.get(`/api/get-physicalexam/${meetId}`)
    ]);

    const ch = chResponse.data.data;
    const pe = peResponse.data.data;
    myRole.value = chResponse.data.my_role ?? null;
    canEdit.value = chResponse.data.can_edit ?? true;
    otherCH.value = chResponse.data.other ?? null;
    otherPE.value = peResponse.data.other ?? null;

    // Step 2: Handle Clinical History
    if (ch) {
      console.log("✅ Existing clinical history found:", ch);
      clinichis.value = chFromRow(ch);
      console.log("✅ Clinical History fetched:", clinichis.value);
    } else {
      console.log("ℹ️ No clinical history found.");
    }

    // Step 3: Handle Physical Exam
    if (pe) {
      console.log("✅ Existing physical exam found:", pe);
      physexam.value = peFromRow(pe);
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
      // meeting-infoV2 wraps its payload: { data: { meetID, ... } }. Reading one
      // level short left every field undefined, so meeting_id went up as null.
      const data = meetingResponse.data.data;

      // Populate Clinical History from meeting info
      // Merge, don't replace — a fresh object here dropped the other eight
      // fields off the model, so the save payload read undefined for them.
      Object.assign(clinichis.value, {
        meeting_id: data.meetID ?? null,
        reason_consult: data.title ?? '',
      });

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

    // The doctor's own copy, restored when switching back from the requester's form.
    ownCH.value = { ...clinichis.value };
    ownPE.value = { ...physexam.value };

    // Baseline for working out what is dirty on the next save. Covers every branch
    // above, so it sits at the end of the try rather than inside one of them.
    // setRecordExists decides whether the next save can narrow to changed
    // fields, or must send everything to satisfy NOT NULL columns on INSERT.
    chTracker.setRecordExists(!!ch);
    peTracker.setRecordExists(!!pe);
    chTracker.markClean();
    peTracker.markClean();

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
    if (viewing.value !== 'mine' || !canEdit.value)
      return false;

    // Ensure form validation
    const { valid } = await clinform.value.validate();

    if (!valid) {
      errorMessage.value = "Please fill in all required fields correctly.";
      isError.value = true;
      return false;
    }

    // Only the changed fields, so this save cannot overwrite what the other
    // participant edited from our own stale copy.
    const changed = chTracker.dirty();

    if (Object.keys(changed).length) {
      await axiosIns.post('/api/save-clinicalhistory', {
        meeting_id: clinichis.value.meeting_id,
        ...changed,
      });
      // The row is there now, so later saves can narrow to what changed.
      chTracker.setRecordExists(true);
      chTracker.markClean();
    }

    // Success response handling
    successMessage.value = "Saved  Clinical history.";
    isSuccess.value = true;
    cancelEdit();
    return true;


  } catch (error) {
    console.error("Error Saving Clinical History:", error);
    errorMessage.value = (error as any)?.response?.data?.message ?? "Failed to save Clinical History.";
    isError.value = true;
    return false;

  }
}

async function saveUpdatePE() {
  try {
    if (viewing.value !== 'mine' || !canEdit.value)
      return false;

    // Ensure form validation
    const { valid } = await clinform.value.validate();

    if (!valid) {
      errorMessage.value = "Please fill in all required fields correctly.";
      isError.value = true;
      return false;
    }

    const changed = peTracker.dirty();

    if (Object.keys(changed).length) {
      await axiosIns.post('/api/save-physicalexam', {
        meeting_id: physexam.value.meeting_id,
        ...changed,
      });
      // The row is there now, so later saves can narrow to what changed.
      peTracker.setRecordExists(true);
      peTracker.markClean();
    }

    // Success response handling
    setTimeout(function () {
      successMessage.value = "Saved Physical Exam.";
    }, 1050);
    isSuccess.value = true;
    return true;

  } catch (error) {
    console.error("Error Saving Physical Exam:", error);
    setTimeout(function () {
      errorMessage.value = (error as any)?.response?.data?.message ?? "Failed to save Physical Exam.";
    }, 1050);
    isError.value = true;
    return false;
  }
}

const requiredValidator = (v) => !!v || 'This field is required';


function cancelEdit() {
  isEditing.value = false;
}

// Switching only happens while not editing (the toggle is disabled otherwise), so no
// unsaved typing is lost. The requester's view can never be edited or saved.
function showMyForm() {
  Object.assign(clinichis.value, ownCH.value);
  Object.assign(physexam.value, ownPE.value);
}

function showRhuForm() {
  isEditing.value = false;
  Object.assign(clinichis.value, chFromRow(otherCH.value ?? {}));
  Object.assign(physexam.value, peFromRow(otherPE.value ?? {}));
}

function onViewChange(view: 'mine' | 'rhu') {
  if (view === 'rhu')
    showRhuForm();
  else
    showMyForm();
}

// Reloads everything from the server and stays on the requester's form, so a doctor can
// pick up what the requester saved since the page loaded. Nothing is pushed to the page
// any more, so this is how the requester's form is brought up to date.
const refreshing = ref(false);

async function refreshRhuForm() {
  if (!props.consultId)
    return;

  refreshing.value = true;
  try {
    await fetchMeetingInfo(props.consultId); // also puts the view back on the doctor's form
    viewing.value = 'rhu';
    showRhuForm();
  }
  finally {
    refreshing.value = false;
  }
}

// Cancel button: put the doctor's own saved values back, which also undoes a copy.
// (cancelEdit stays as it is, because the saves call it once they succeed.)
function discardEdits() {
  showMyForm();
  isEditing.value = false;
}

const confirmReplace = ref(false);

function isEmpty(value: unknown) {
  return value === null || value === undefined || value === '';
}

// Copies the requester's answers into the doctor's own form and leaves it open for
// editing. Nothing is saved until the doctor presses Save, and Cancel restores the
// saved values. overwrite=false only fills fields that are still empty.
function copyToMine(overwrite: boolean) {
  confirmReplace.value = false;
  if (!canEdit.value || (!otherCH.value && !otherPE.value))
    return;

  viewing.value = 'mine';
  showMyForm();

  let copied = 0;
  const take = (target: Record<string, any>, row: Record<string, any>) => {
    for (const [key, from] of Object.entries(row)) {
      if (key === 'meeting_id')
        continue;

      const doCopy = overwrite ? target[key] !== from : !isEmpty(from) && isEmpty(target[key]);
      if (doCopy) {
        target[key] = from;
        copied++;
      }
    }
  };

  take(clinichis.value, chFromRow(otherCH.value ?? {}));
  take(physexam.value, peFromRow(otherPE.value ?? {}));

  if (copied)
    isEditing.value = true;

  successMessage.value = copied
    ? `Copied ${copied} field(s). Review them, then press Save.`
    : 'Nothing to copy: your form already has those answers.';
  isSuccess.value = true;
}

// One after the other, not in parallel, so the reload below sees both rows.
async function saveAll() {
  const chOk = await saveUpdateCH();
  const peOk = await saveUpdatePE();

  // Reload this user's own form so the screen shows what the server stored. Only
  // after both saves went through, so a failed validation can't wipe unsaved typing.
  // The other participant's form is not touched.
  if (chOk && peOk && props.consultId)
    await fetchMeetingInfo(props.consultId);
}

</script>

<template>
  <VForm ref="clinform" style="align-self: stretch; width: 100%;">
    <VTooltip v-if="isEditing == true" text="Save" location="top">
      <template #activator="{ props }">
        <VBtn v-bind="props" variant="tonal" color="success" icon="tabler-device-floppy" size="48"
          class="fab-fixed-botr" @click="saveAll" />
      </template>
    </VTooltip>
    <VTooltip v-if="isEditing == true" text="Cancel" location="top">
      <template #activator="{ props }">
        <VBtn v-bind="props" variant="tonal" color="error" icon="tabler-x" size="48" class="fab-fixed-botr mr-15"
          @click="discardEdits" />
      </template>
    </VTooltip>
    <VTooltip v-if="canEdit && viewing === 'mine' && isEditing == false" text="Edit" location="top">
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

    <!-- Doctors can switch to the requester's form. It is read only. -->
    <VRow v-if="myRole === 'accepter'">
      <VCol cols="12">
        <VBtnToggle v-model="viewing" mandatory divided color="primary" class="w-100 mb-4"
          :disabled="isEditing" @update:model-value="onViewChange">
          <VBtn value="mine" class="flex-grow-1">Accepter form</VBtn>
          <VBtn value="rhu" class="flex-grow-1">Requester form</VBtn>
        </VBtnToggle>
      </VCol>
    </VRow>
    <VAlert
        v-if="viewing === 'rhu'"
        type="info"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        <div class="d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-2">
          <!-- Message -->
          <div class="text-body-2">
            You are viewing the requester's form. It is read only.
            <span v-if="!otherCH && !otherPE">The requester has not filled it in yet.</span>
          </div>

          <!-- Actions -->
          <div class="d-flex align-center flex-wrap ga-2 flex-shrink-0">
            <VMenu v-if="canEdit && (otherCH || otherPE)">
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
              @click="refreshRhuForm"
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

    <VRow>
      <VCol cols="12" md="12">
        <VTextarea v-model="clinichis.reason_consult" outlined dense hide-details auto-grow rows="2"
          label="Reason for Teleconsultation:" :rules="[requiredValidator]" :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol cols="12" sm>
        <VTextField v-model="clinichis.date_referral" type="date" outlined dense hide-details label="Date of Referral:"
          :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
      <VCol cols="12" sm>
        <VTextField v-model="clinichis.date_onset_illness" type="date" outlined dense hide-details
          label="Date of Onset of Illness:" :rules="[requiredValidator]" :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol cols="12" sm>
        <VAutocomplete v-model="clinichis.facilityOptions" :items="facilityOptions" item-title="facilityname"
          item-value="id" label="Name of Referral Health Facility (if Applicable):" outlined dense hide-details
          clearable persistent-hint :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol cols="12" sm>
        <VTextarea v-model="clinichis.known_medical_history" outlined dense hide-details auto-grow rows="2"
          label="Known Medical Condition/s & Medical History:" :rules="[requiredValidator]" :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol cols="12" sm>
        <VTextField v-model="clinichis.current_medication" outlined dense hide-details label="Current Medications:"
          :rules="[requiredValidator]" :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol cols="12" sm>
        <VTextField v-model="clinichis.blood_type" outlined dense hide-details label="Blood Type:"
          :rules="[requiredValidator]" :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol cols="12" sm>
        <VTextarea v-model="clinichis.specific_findings" outlined dense hide-details auto-grow rows="2"
          label="Specific Findings:" :rules="[requiredValidator]" :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol cols="12" sm>
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
      <VCol cols="12" sm>
        <VTextarea v-model="physexam.head" outlined dense hide-details auto-grow rows="2" label="Head:"
          :rules="[requiredValidator]" :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow v-for="(item, index) in examFields" :key="index">
      <VCol cols="12" sm>
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
      <VCol cols="12" sm>
        <VTextarea v-model="physexam.others" outlined dense hide-details auto-grow rows="2" label="Others: "
          :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol cols="12" sm>
        <VTextarea v-model="physexam.waist_circumference" outlined dense hide-details auto-grow rows="2"
          label="Waist Circumference: " :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
  </VForm>
</template>
