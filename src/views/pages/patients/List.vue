<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import ErrorSnackbar from "@/components/snackbars/errors.vue";
import SuccessSnackbar from "@/components/snackbars/success.vue";
import { axiosIns } from "@/plugins/axios";
import { onMounted, ref } from "vue";
import { VCol } from "vuetify/lib/components/index.mjs";
import AddPatient from "../../components/AddPatient.vue";
import PatientProfile from "../../components/PatientProfile.vue";

const { isError, errorMessage, isSuccess, successMessage } = cStatus();

// 🔹 Reactive states
const patients = ref([]);
const isLoading = ref(false);
const showAddDialog = ref(false);

// 🔹 Edit state
const selectedPatient = ref(null);
const showProfileDialog = ref(false);

// 🔹 Table headers
const headers = [
  { title: "Name", key: "name" },
  { title: "Sex", key: "sex_code" },
  { title: "Age / DOB", key: "age_dob" },
  { title: "Barangay", key: "brg_name" },
  { title: "Contact", key: "pat_mobile" },
  { title: "Actions", key: "actions", sortable: false },
];


// 🔹 Fetch patient data
async function fetchPatients() {
  try {
    isLoading.value = true;
    const response = await axiosIns.get("/api/patients");
    const data = response.data.data || response.data;

    patients.value = data.map((p: any) => {
      const dob = p.pat_birthDate ? new Date(p.pat_birthDate) : null;
      let ageDobDisplay = "";
      let ageOnly = "";
      let formattedDob = "N/A";

      if (dob) {
        const today = new Date();
        let years = today.getFullYear() - dob.getFullYear();
        let months = today.getMonth() - dob.getMonth();
        if (months < 0) {
          years--;
          months += 12;
        }

        // ✅ Age only
        ageOnly = `${years} years${months > 0 ? ` and ${months} months` : ""}`;

        // ✅ Formatted DOB
        formattedDob = dob.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        // ✅ Full DOB + age (for display)
        ageDobDisplay = `${formattedDob}<br>${ageOnly} old`;
      }

      return {
        ...p,
        name: `${p.pat_lname || ""}, ${p.pat_fname || ""} ${p.pat_mname ? p.pat_mname.charAt(0) + "." : ""}`,
        age_dob: ageDobDisplay || "N/A",
        age: ageOnly || "N/A",
        dob_formatted: formattedDob, // ✅ Added formatted DOB separately
      };
    });

    successMessage.value = "Successfully Loaded Patient List.";
    isSuccess.value = true;

  } catch (error) {
    console.error("❌ Error fetching patients:", error);
  } finally {
    isLoading.value = false;
  }
}


// 🔹 Handle Add
function handleSaved() {
  fetchPatients();
  showAddDialog.value = false;
}

// 🔹 Handle Edit
function openProfileDialog(patient: any) {
  selectedPatient.value = patient;
  showProfileDialog.value = true;
}

function handlePatientUpdated(updatedPatient) {
  const index = patients.findIndex(p => p.id === updatedPatient.id);
  if (index !== -1) {
    patients[index] = { ...updatedPatient };
  }

  // Also update selectedPatient if currently open
  if (selectedPatient && selectedPatient.id === updatedPatient.id) {
    selectedPatient = { ...updatedPatient };
  }
}


onMounted(fetchPatients);
</script>
<template>
  <ErrorSnackbar :message="errorMessage" :visible="isError" @update:visible="isError = $event" />
  <SuccessSnackbar :message="successMessage" :visible="isSuccess" @update:visible="isSuccess = $event" />
  <VContainer fluid class="pa-4">
    <!-- Header -->
    <VRow class="mb-4" align="center" justify="space-between">
      <VCol cols="12" md="6">
        <h2 class="text-h4">Patient List</h2>
      </VCol>
      <VCol cols="12" md="3" class="text-md-end text-center">
        <VBtn class="btn-teal" variant="tonal" color="primary" @click="showAddDialog = true">+ Add Patient</VBtn>
      </VCol>
    </VRow>

    <!-- Patient Table -->
    <VDataTable :headers="headers" :items="patients" :loading="isLoading" class="elevation-1" item-key="id" hover>
      <!-- ✅ Custom cell for DOB / Age to render <br> -->
      <template #item.age_dob="{ item }">
        <span v-html="item.age_dob"></span>
      </template>

      <!-- 🔹 Actions -->
      <template #item.actions="{ item }">
        <VBtn class="btn-teal" variant="tonal" size="small" @click="openProfileDialog(item)">
          View
        </VBtn>
      </template>
    </VDataTable>

    <!-- ✅ Add Patient Dialog -->
    <VDialog v-model="showAddDialog" max-width="700px" persistent>
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center">
          <VIcon icon="tabler-user-plus" />
          <span class="text-h5">
            Add New Patient
          </span>
          <VBtn icon="tabler-x" variant="text" color="white" @click="showAddDialog = false" />
        </VCardTitle>
        <VCardText>
          <AddPatient @close="showAddDialog = false" @saved="handleSaved" /> <!-- Updated to AddPatient -->
        </VCardText>
      </VCard>
    </VDialog>

    <!-- profile dialogue -->
    <!-- <VDialog v-model="showProfileDialog" max-width="100%" persistent> -->
    <VDialog v-model="showProfileDialog" persistent>
      <VCard>
        <VCardTitle class="d-flex justify-end">
          <!-- <div class="text-h5">
            <VIcon icon="tabler-user-edit" start /> Patient Profile
          </div> -->
          <VBtn icon="tabler-x" variant="text" @click="showProfileDialog = false" />
        </VCardTitle>

        <VCardText>
          <PatientProfile v-if="selectedPatient" :patient="selectedPatient" @close="showProfileDialog = false"
            @updated="handlePatientUpdated" />
        </VCardText>
      </VCard>
    </VDialog>
  </VContainer>
</template>
