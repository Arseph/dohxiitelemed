<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import { useDirtyTracker, useFormSync } from '@/composables/useFormSync';
import { useUser } from '@/composables/useUser';
import { axiosIns } from '@/plugins/axios';
import { computed, onMounted, ref, watch } from "vue";
import { VForm } from 'vuetify/components/VForm';
import { VCol, VRow } from "vuetify/lib/components/index.mjs";

const planform = ref<VForm>();
const { user } = useUser();
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

// Collaborative editing — see useFormSync. The doctor and the staff member beside
// the patient take turns: entering edit mode tells the other side, saving sends only
// what changed, and the other side refetches so both screens match the record.
const { connected, remoteEditor, notifySaved, setEditing } = useFormSync({
  form: 'plan_of_management',
  editorName: computed(() => user.value?.name ?? 'Other user'),
  onRemoteSave: () => {
    if (props.consultId)
      fetchMeetingInfo(props.consultId)
  },
})

const pmTracker = useDirtyTracker(planma, ['meeting_id', 'patient_id'])

const isEditing = ref(false);

// Announce edit mode both ways, so the other side's banner appears and clears.
watch(isEditing, editing => setEditing(editing))

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

    planma.value.meeting_id = data.meetID ?? planma.value.meeting_id;
    planma.value.name_physician = pm?.name_physician ?? name_physician;
    planma.value.plan_management = pm?.plan_management ?? null;
    planma.value.prescription = pm?.prescription ?? null;
    planma.value.referral = pm?.referral ?? null;
    planma.value.disposition = pm?.disposition ?? null;
    planma.value.license_no = pm?.license_no ?? null;
    planma.value.prof_tax_receipt = pm?.prof_tax_receipt ?? null;

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
    const { valid } = await planform.value.validate();

    if (!valid) {
      errorMessage.value = "Please fill in all required fields correctly.";
      isError.value = true;
      return;
    }

    // Only the changed fields, so this save cannot overwrite columns the other
    // participant edited from their own stale copy.
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

    notifySaved();

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


function cancelEdit() {
  isEditing.value = false;
}

function openPrescriptionDialog() {
  if (!isEditing.value) return
  showDialog.value = true
}
</script>
<template>
  <VForm ref="planform" style="align-self: stretch; width: 100%;">
    <VAlert v-if="remoteEditor" type="warning" variant="tonal" density="compact" class="mb-3 form-remote-editing">
      {{ remoteEditor }} is editing this form. It will refresh when they save.
    </VAlert>
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
    <VTooltip v-if="isEditing == false" text="Edit" location="top">
      <template #activator="{ props }">
        <VBtn v-bind="props" variant="tonal" color="success" icon="tabler-edit" size="48" class="fab-fixed-botr" rounded
          @click="isEditing = true" />
      </template>
    </VTooltip>
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
