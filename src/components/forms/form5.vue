<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import { useDirtyTracker } from '@/composables/useFormSync';
import { axiosIns } from '@/plugins/axios';
import { onMounted, ref } from "vue";
import { VForm } from 'vuetify/components/VForm';
import { VCol, VRow } from "vuetify/lib/components/index.mjs";

const planform = ref<VForm>();
const { isError, errorMessage, isSuccess, successMessage } = cStatus();
const emit = defineEmits(['loaded'])

const props = defineProps({
  consultId: {
    type: Number,
    required: false,
  },
});

const dialog = ref(false)

const planma = ref({
  meeting_id: props.consultId ?? '',
  patient_id: '',
  plan_management: '',
  prescription: '',
  referral: '',
  disposition: '',
  name_physician: '',
  license_no: '',
  prof_tax_receipt: '',
});

const pmTracker = useDirtyTracker(planma, ['meeting_id', 'patient_id'])

const isEditing = ref(false);

// Doctors (the accepting side) can read the requester's copy of this form, read only.
const myRole = ref<string | null>(null);
const canEdit = ref(true); // false: a doctor reading a consultation they are not part of
const otherPm = ref<Record<string, any> | null>(null);

// Doctors can switch between the doctor's form and the requester's. The requester's is always read only.
const viewing = ref<'mine' | 'other'>('mine');
const basePm = ref<Record<string, any>>({}); // this form with no saved values
const minePm = ref<Record<string, any>>({}); // the doctor's own saved form (restore point)
const refreshing = ref(false);
const confirmReplace = ref(false);

// Every column of this form, used to show the requester's answers.
const PM_FIELDS = [
  'plan_management', 'prescription', 'referral', 'disposition',
  'name_physician', 'license_no', 'prof_tax_receipt',
] as const;

// What the doctor can take from the requester. Not copied: the physician name, license
// number and tax receipt, because they identify whoever fills the form in.
const COPY_FIELDS = ['plan_management', 'prescription', 'referral', 'disposition'] as const;

function isEmpty(value: unknown) {
  return value === null || value === undefined || value === '';
}

// Copies the saved values of a row onto the form. Only non-empty values overwrite.
function applyPm(row: Record<string, any>) {
  for (const key of PM_FIELDS) {
    if (!isEmpty(row[key]))
      planma.value[key] = row[key];
  }
}

// Switching only happens while not editing (the toggle is disabled otherwise), so no
// unsaved typing is lost. The requester's view can never be edited or saved.
function showMyForm() {
  Object.assign(planma.value, minePm.value);
}

function showOtherForm() {
  isEditing.value = false;
  Object.assign(planma.value, basePm.value);
  if (otherPm.value)
    applyPm(otherPm.value);
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
  if (!canEdit.value || !otherPm.value)
    return;

  viewing.value = 'mine';
  showMyForm();

  let copied = 0;
  for (const key of COPY_FIELDS) {
    const from = otherPm.value[key] ?? null;
    const take = overwrite ? planma.value[key] !== from : !isEmpty(from) && isEmpty(planma.value[key]);

    if (take) {
      planma.value[key] = from;
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


const headers = [
  { title: 'Prescription Code', key: 'presc_code' },
  { title: 'Medicine Type', key: 'type_of_medicine' },
  { title: 'Drug Code', key: 'drugcode' },
  { title: 'Frequency', key: 'frequency' },
  { title: 'Dose Regimen', key: 'dose_regimen' },
  { title: 'Quantity', key: 'total_qty' }
]

const showDialog = ref(false)
const prescriptions = ref([])

function selectPrescription(item) {
  if (!item || !item.presc_code) return
  planma.value.prescription = item.presc_code
  showDialog.value = false
}

const loadPrescriptions = async () => {
  try {
    const res = await axiosIns.get('/api/get-prescriptions')
    const raw = res.data
    prescriptions.value = Array.isArray(raw) ? raw : (raw?.data ?? [])
  } catch (error) {
    console.error('Error fetching prescriptions:', error)
  }
}

async function fetchMeetingInfo(meetId) {
  try {
    viewing.value = 'mine';

    const response = await axiosIns.get(`/api/meeting-infoV2`, {
      params: { meet_id: meetId },
    });

    // ✅ v2 wraps under `data`
    const data = response.data.data;

    // --- Physician name from nested doctor object ---
    const docfname = data.doctor?.fname ?? null;
    const docmname = data.doctor?.mname ? `${data.doctor.mname.charAt(0)}.` : null;
    const doclname = data.doctor?.lname ?? null;
    const name_physician = [docfname, docmname, doclname].filter(Boolean).join(' ').trim();

    // ✅ Plan of management already in v2 response — no second API call needed
    const pm = data.plan_management;
    myRole.value = data.my_role ?? null;
    canEdit.value = data.can_edit ?? true;
    otherPm.value = data.other?.plan_management ?? null;

    planma.value.meeting_id = data.meetID ?? planma.value.meeting_id;
    planma.value.name_physician = pm?.name_physician ?? name_physician;
    planma.value.plan_management = pm?.plan_management ?? null;
    planma.value.prescription = pm?.prescription ?? null;
    planma.value.referral = pm?.referral ?? null;
    planma.value.disposition = pm?.disposition ?? null;
    planma.value.license_no = pm?.license_no ?? null;
    planma.value.prof_tax_receipt = pm?.prof_tax_receipt ?? null;

    // Snapshots for the requester view and for Cancel. `base` is this form with no
    // saved values, which the requester's answers are laid over.
    basePm.value = {
      meeting_id: planma.value.meeting_id,
      patient_id: planma.value.patient_id,
      plan_management: null,
      prescription: null,
      referral: null,
      disposition: null,
      name_physician: null,
      license_no: null,
      prof_tax_receipt: null,
    };
    minePm.value = { ...planma.value };

    // Baseline for the next save. setRecordExists decides whether that save can
    // narrow to changed fields or must send everything to satisfy NOT NULL columns.
    pmTracker.setRecordExists(!!pm);
    pmTracker.markClean();

  } catch (error) {
    console.error("❌ Error fetching meeting info:", error);
    console.error("Details:", error.response?.data); // shows exact validation errors
    errorMessage.value = "Failed to load meeting info.";
    isError.value = true;
  } finally {
    emit('loaded');
  }
}

async function saveUpdatePM() {
  try {
    // The requester's form can never be saved from here.
    if (viewing.value !== 'mine' || !canEdit.value)
      return;

    const { valid } = await planform.value.validate();

    if (!valid) {
      errorMessage.value = "Please fill in all required fields correctly.";
      isError.value = true;
      return;
    }

    // Only the changed fields.
    const changed = pmTracker.dirty();

    if (Object.keys(changed).length) {
      // No patient_id here — tele_plan_management is keyed on meeting_id alone and
      // has no such column.
      await axiosIns.post('/api/save-planofmanagement', {
        meeting_id: planma.value.meeting_id,
        ...changed,
      });
      // The row is there now, so later saves can narrow to what changed.
      pmTracker.setRecordExists(true);
      pmTracker.markClean();
    }

    // Reload this user's own form so the screen shows what the server stored. That
    // also resets the restore point, so cancelEdit() below can't bring back the
    // pre-edit values. Only this user's form reloads; the other side is untouched.
    if (props.consultId)
      await fetchMeetingInfo(props.consultId);

    successMessage.value = "Saved plan of management.";
    isSuccess.value = true;
    cancelEdit();

  } catch (error) {
    console.error("Error Saving plan of management:", error);
    console.error("Details:", error.response?.data); // ✅ shows exact 422 errors
    errorMessage.value = "Failed to save plan of management.";
    isError.value = true;
  }
}

onMounted(() => {
  if (props.consultId) fetchMeetingInfo(props.consultId);
  loadPrescriptions();
});

const requiredValidator = (v: any) => (v !== '' && v !== null && v !== undefined) || 'This field is required';


// Cancel puts the saved values back, which also undoes anything copied from the requester.
function cancelEdit() {
  Object.assign(planma.value, minePm.value);
  isEditing.value = false;
}

function openPrescriptionDialog() {
  if (!isEditing.value) return
  showDialog.value = true
}
</script>
<template>
  <VForm ref="planform" style="align-self: stretch; width: 100%;">
    <VTooltip v-if="isEditing == true" text="Save" location="top">
      <template #activator="{ props }">
        <VBtn v-bind="props" variant="tonal" color="success" icon="tabler-device-floppy" size="48"
          class="fab-fixed-botr" @click="() => { saveUpdatePM(); }" />
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
            <span v-if="!otherPm">The requester has not filled it in yet.</span>
          </div>

          <!-- Actions -->
          <div class="d-flex align-center flex-wrap ga-2 flex-shrink-0">
            <VMenu v-if="canEdit && otherPm">
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

    <!-- <pre>planma val{{ planma }}</pre> -->
    <VRow>
      <VCol>
        <VTextarea v-model="planma.plan_management" outlined dense auto-grow rows="2" :rules="[requiredValidator]"
          :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }">
          <template #label><span class="req-label">Plan of Management</span></template>
        </VTextarea>
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <!-- Prescription: clicking opens picker only when editing; readonly always so user can't type freely -->
        <VTextField v-model="planma.prescription" outlined dense :rules="[requiredValidator]" :readonly="true"
          :class="{ 'custom-disabled': !isEditing }" @click="openPrescriptionDialog" append-inner-icon="tabler-pill"
          hint="Click to select a prescription" persistent-hint>
          <template #label><span class="req-label">Prescription</span></template>
        </VTextField>
      </VCol>
    </VRow>

    <!-- Prescription picker dialog -->
    <VDialog v-model="showDialog" max-width="900">
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center pa-4">
          <span>Select Prescription</span>
          <VBtn icon="tabler-x" variant="text" @click="showDialog = false" />
        </VCardTitle>
        <VCardText class="pa-0">
          <VDataTable :headers="headers" :items="prescriptions" hover>
            <template #item="{ item }">
              <tr @click="selectPrescription(item)" style="cursor: pointer;">
                <td>{{ item.presc_code }}</td>
                <td>{{ item.type_of_medicine }}</td>
                <td class="align-center">{{ item.drugcode }}</td>
                <td>{{ item.frequency }}</td>
                <td>{{ item.dose_regimen }}</td>
                <td class="align-center">{{ item.total_qty }}</td>
              </tr>
            </template>
          </VDataTable>
        </VCardText>
      </VCard>
    </VDialog>

    <VRow>
      <VCol>
        <VTextarea v-model="planma.referral" outlined dense auto-grow rows="2" :rules="[requiredValidator]"
          :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }">
          <template #label><span class="req-label">Referral</span></template>
        </VTextarea>
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="planma.disposition" outlined dense auto-grow rows="2" :rules="[requiredValidator]"
          :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }">
          <template #label><span class="req-label">Disposition</span></template>
        </VTextarea>
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <!-- Physician name is auto-filled from meeting info — read-only always -->
        <VTextField v-model="planma.name_physician" outlined dense :readonly="true"
          :class="{ 'custom-disabled': !isEditing }" hint="Auto-filled from meeting record" persistent-hint>
          <template #label><span>Physician Name</span></template>
        </VTextField>
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <!-- License # is a short code, not a paragraph — use VTextField -->
        <VTextField v-model="planma.license_no" outlined dense :rules="[requiredValidator]" :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }">
          <template #label><span class="req-label">License #</span></template>
        </VTextField>
      </VCol>
      <VCol>
        <VTextField v-model="planma.prof_tax_receipt" outlined dense :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }">
          <template #label><span>Professional Tax Receipt</span></template>
        </VTextField>
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
