<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import { useUser } from '@/composables/useUser';
import { axiosIns } from '@/plugins/axios';
import { onMounted, ref } from "vue";
import { VForm } from 'vuetify/components/VForm';
import { VCol, VRow } from "vuetify/lib/components/index.mjs";

const planform = ref<VForm>();
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

// function selectPrescription(item) {
//   planma.value.prescription = `${item.presc_code} - ${item.drug_code}`
//   showDialog.value = false
// }

function selectPrescription(item) {
  if (!item || !item.presc_code) return
  planma.value.prescription = item.presc_code
  showDialog.value = false
}

const loadPrescriptions = async () => {
  try {
    const res = await axiosIns.get('/api/get-prescriptions')
    // Guard: some APIs wrap data in a `data` key, others return the array directly
    const raw = res.data
    prescriptions.value = Array.isArray(raw) ? raw : (raw?.data ?? [])
  } catch (error) {
    console.error('Error fetching prescriptions:', error)
  }
}


async function fetchMeetingInfo(meetId) {
  try {
    // Fetch meeting info
    const response = await axiosIns.get(`/api/meeting-info`, {
      params: { meet_id: meetId },
    });

    const data = response.data;

    // --- Physician name ---
    const docfname = data.docfname ?? null;
    const docmname = data.docmname ? `${data.docmname.charAt(0)}.` : null;
    const doclname = data.doclname ?? null;

    const name_physician = [docfname, docmname, doclname].filter(Boolean).join(' ').trim();

    // Only patch meeting_id and name_physician — don't wipe the rest of the ref
    planma.value.meeting_id = data.meetID ?? planma.value.meeting_id;
    planma.value.name_physician = name_physician || planma.value.name_physician;

    console.log("✅ Meeting info fetched:", planma.value);

    // 🔹 Step 3: Try to fetch existing Demographic Profile
    if (planma.value.meeting_id) {
      const pmResponse = await axiosIns.get(`/api/get-planofmanagement/${planma.value.meeting_id}`);
      const pm = pmResponse.data.data;

      if (pm) {
        console.log("✅ Existing plan of management found:", pm);

        // Merge existing DP data into diagass.value
        planma.value.meeting_id = pm.meeting_id ?? null;
        planma.value.plan_management = pm.plan_management ?? null;
        planma.value.prescription = pm.prescription ?? null;
        planma.value.referral = pm.referral ?? null;
        planma.value.disposition = pm.disposition ?? null;
        planma.value.name_physician = pm.name_physician ?? null;
        // planma.value.signature = pm.signature ?? null;
        planma.value.license_no = pm.license_no ?? null;
        planma.value.prof_tax_receipt = pm.prof_tax_receipt ?? null;
      } else {
        console.log("ℹ️ No plan of management found for this meeting ID.");
      }
    }

  } catch (error) {
    console.error("❌ Error fetching meeting info or PM:", error);
    errorMessage.value = "Failed to load meeting info.";
    isError.value = true;
  } finally {
    emit('loaded');
  }
}

async function saveUpdatePM() {
  try {
    // Ensure form validation
    const { valid } = await planform.value.validate();

    if (!valid) {
      errorMessage.value = "Please fill in all required fields correctly.";
      isError.value = true;
      return;
    }

    // ✅ Prepare payload using all meeting data
    const payload = {
      meeting_id: planma.value.meeting_id,
      plan_management: planma.value.plan_management,
      prescription: planma.value.prescription,
      referral: planma.value.referral,
      disposition: planma.value.disposition,
      name_physician: planma.value.name_physician,
      // signature: planma.value.signature,
      license_no: planma.value.license_no,
      prof_tax_receipt: planma.value.prof_tax_receipt,
    };


    console.log("Payload being sent:", payload);
    // Send request
    const response = await axiosIns.post('/api/save-planofmanagement', payload);

    // Success response handling
    successMessage.value = "Saved  plan of management.";
    isSuccess.value = true;
    cancelEdit();

  } catch (error) {
    console.error("Error Saving plan of management:", error);
    errorMessage.value = "Failed to save plan of management.";
    isError.value = true;

  }
}

onMounted(() => {
  if (props.consultId) fetchMeetingInfo(props.consultId);
  loadPrescriptions();

});

// Validators — !!v fails for 0; use explicit check instead
const requiredValidator = (v: any) => (v !== '' && v !== null && v !== undefined) || 'This field is required';

const isEditing = ref(false);

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
