<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import { useUser } from '@/composables/useUser';
import { axiosIns } from '@/plugins/axios';
import { ref } from "vue";
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
  // savedID: props.consultId,
  meeting_id: '',
  plan_management: '',
  prescription: '',
  referral: '',
  disposition: '',
  name_physician: '',
  // signature: '',
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
    console.log('Fetching prescriptions...')
    const res = await axiosIns.get('/api/get-prescriptions')
    console.log('Prescriptions response:', res.data)
    prescriptions.value = res.data
    console.log('Prescriptions stored in ref:', prescriptions.value)
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

    //surname first
    // const name_physician2 = [doclname ? `${doclname},` : '', docfname || '', docmname || '']
    //   .filter(Boolean)
    //   .join(' ')
    //   .trim();


    // Populate meeting data (defaults to null if missing)
    planma.value = {
      meeting_id: data.meetID ?? null,
      name_physician: name_physician ?? null,

    };

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

const requiredValidator = (v) => !!v || 'This field is required'
</script>

<template>
  <VForm ref="planform" style="align-self: stretch; width: 100%;">
    <VTooltip text="Save" location="top">
      <template #activator="{ props }">
        <VBtn v-bind="props" variant="tonal" color="success" icon="tabler-device-floppy" size="48" class="fab-fixed-top"
          @click="() => { saveUpdatePM(); }" />
      </template>
    </VTooltip>
    <!-- <pre>planma val{{ planma }}</pre> -->
    <VRow>
      <VCol>
        <VTextarea v-model="planma.plan_management" outlined dense hide-details auto-grow rows="2"
          label="Plan of Management:" :rules="[requiredValidator]" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="planma.prescription" outlined dense hide-details auto-grow rows="2" label="Prescription:"
          @click="showDialog = true" readonly :rules="[requiredValidator]" />
      </VCol>
    </VRow>
    <VDialog v-model="showDialog">
      <VDataTable :headers="headers" :items="prescriptions">
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
    </VDialog>
    <VRow>
      <VCol>
        <VTextarea v-model="planma.referral" outlined dense hide-details auto-grow rows="2" label="Referral:"
          :rules="[requiredValidator]" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="planma.disposition" outlined dense hide-details auto-grow rows="2" label="Disposition:"
          :rules="[requiredValidator]" />
      </VCol>
    </VRow>
    <!-- <VCard class="pa-4" elevation="2">
    <VSheet class="d-flex align-center justify-center border rounded" color="grey-lighten-3" height="150">
      <span class="text-grey">Signature pad will appear here</span>
    </VSheet>
  </VCard>
  <VTextField />
  <div class="d-flex align-center justify-center"><label>Name & Signature of Physician</label></div>
  <br></br> -->
    <VRow>
      <VCol>
        <VTextarea v-model="planma.license_no" outlined dense hide-details auto-grow rows="2" label="License #:"
          :rules="[requiredValidator]" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea v-model="planma.prof_tax_receipt" outlined dense hide-details auto-grow rows="2"
          label="Professional Tax Receipt:" />
      </VCol>
    </VRow>
  </VForm>
</template>
