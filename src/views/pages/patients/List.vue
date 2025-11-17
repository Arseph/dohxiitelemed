<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import ErrorSnackbar from "@/components/snackbars/errors.vue";
import SuccessSnackbar from "@/components/snackbars/success.vue";
import { axiosIns } from "@/plugins/axios";
import { computed, onMounted, ref } from "vue";
import { VCol } from "vuetify/lib/components/index.mjs";
import AddPatient from "../../components/AddPatient.vue";
import PatientProfile from "../../components/PatientProfile.vue";

const { isError, errorMessage, isSuccess, successMessage } = cStatus();

// Table and dialog state
const patients = ref<any[]>([]);
const isLoading = ref(false);
const search = ref("");
const showAddDialog = ref(false);
const selectedPatient = ref(null);
const showProfileDialog = ref(false);

// Table headers
const headers = [
  { title: "Name", key: "name" },
  { title: "Sex", key: "sex_code" },
  { title: "Age / DOB", key: "age" },
  { title: "Barangay", key: "brg_name" },
  { title: "Contact", key: "pat_mobile" },
  { title: "Actions", value: "actions", sortable: false },
];

// Fetch patient data
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

        ageOnly = `${years} years${months > 0 ? ` and ${months} months` : ""}`;
        formattedDob = dob.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        ageDobDisplay = `${formattedDob}<br>${ageOnly} old`;
      }

      return {
        ...p,
        name: `${p.pat_lname || ""}, ${p.pat_fname || ""} ${p.pat_mname ? p.pat_mname.charAt(0) + "." : ""
          }`,
        age_dob: ageDobDisplay || "N/A",
        age: ageOnly || "N/A",
        dob_formatted: formattedDob,
      };
    });

    successMessage.value = "Successfully Loaded Patient List.";
    isSuccess.value = true;
  } catch (error) {
    console.error("❌ Error fetching patients:", error);
    errorMessage.value = "Failed to load patient list.";
    isError.value = true;
  } finally {
    isLoading.value = false;
  }
}

// Computed filtered patients
const filteredPatients = computed(() => {
  if (!search.value) return patients.value;

  return patients.value.filter((p) =>
    p.name.toLowerCase().includes(search.value.toLowerCase())
  );
});

// Open profile dialog
function openProfileDialog(patient: any) {
  selectedPatient.value = patient;
  showProfileDialog.value = true;
}

// Save function
async function savePatient(patientData: any, isExisting: boolean) {
  try {
    let payload = {};

    if (isExisting) {
      payload = { id: patientData.id };
    } else {
      payload = patientData;
    }

    await axiosIns.post("/api/patients/store-or-update", payload);

    successMessage.value = isExisting
      ? "Patient selected successfully."
      : "Patient added successfully.";
    isSuccess.value = true;

    fetchPatients();
    showAddDialog.value = false;
  } catch (error) {
    console.error("❌ Error saving patient:", error);
    errorMessage.value = "Failed to save patient.";
    isError.value = true;
  }
}

function handleAddPatientExisting(patient: any) {
  savePatient(patient, true);
}

function handleAddPatientNew(patient: any) {
  // Normalize names for comparison
  const fname = (patient.pat_fname || "").trim().toLowerCase();
  const mname = (patient.pat_mname || "").trim().toLowerCase();
  const lname = (patient.pat_lname || "").trim().toLowerCase();

  // Check for duplicates
  const duplicate = patients.value.find(p =>
    (p.pat_fname || "").trim().toLowerCase() === fname &&
    (p.pat_mname || "").trim().toLowerCase() === mname &&
    (p.pat_lname || "").trim().toLowerCase() === lname
  );

  if (duplicate) {
    isError.value = true;
    errorMessage.value = "Patient already exists in list";
    return; // stop here
  }

  // No duplicates, proceed to save
  savePatient(patient, false);
}


onMounted(fetchPatients);
</script>

<template>
  <ErrorSnackbar :message="errorMessage" :visible="isError" @update:visible="isError = $event" />
  <SuccessSnackbar :message="successMessage" :visible="isSuccess" @update:visible="isSuccess = $event" />

  <VContainer fluid class="pa-4">
    <!-- Header -->
    <VRow class="mb-4" align="center" justify="space-between">
      <VCol>
        <h2 class="text-h4">Patient List</h2>
      </VCol>

      <VCol class="d-flex justify-end">
        <VTextField prepend-inner-icon="tabler-search" v-model="search" label="Search Patients" clearable
          class="mb-4" />
      </VCol>

      <VCol class="d-flex justify-end">
        <VBtn class="btn-teal" variant="tonal" color="primary" @click="showAddDialog = true">
          + Add Patient
        </VBtn>
      </VCol>
    </VRow>

    <!-- Patient Table -->
    <VDataTable :headers="headers" :items="filteredPatients" :loading="isLoading" class="elevation-1" item-key="id"
      hover>
      <template #item.age="{ item }">
        <span v-html="item.age_dob"></span> <!-- display formatted age/DOB -->
      </template>

      <template #item.actions="{ item }">
        <VBtn class="btn-teal" variant="tonal" size="small" @click="openProfileDialog(item)">
          View
        </VBtn>
      </template>
    </VDataTable>

    <!-- Add Patient Dialog -->
    <VDialog v-model="showAddDialog" max-width="700px" persistent>
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center">
          <VIcon icon="tabler-user-plus" />
          <span class="text-h5">Add Patient</span>
          <VBtn icon="tabler-x" variant="text" color="white" @click="showAddDialog = false" />
        </VCardTitle>

        <VCardText>
          <AddPatient @close="showAddDialog = false" @selected-existing="handleAddPatientExisting"
            @added-new="handleAddPatientNew" @open-profile="openProfileDialog" />
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Profile Dialog -->
    <VDialog v-model="showProfileDialog" persistent>
      <VCard>
        <VCardTitle class="d-flex justify-end">
          <VBtn icon="tabler-x" variant="text" @click="showProfileDialog = false" />
        </VCardTitle>

        <VCardText>
          <PatientProfile v-if="selectedPatient" :patient="selectedPatient" @close="showProfileDialog = false"
            @saved="fetchPatients" />
        </VCardText>
      </VCard>
    </VDialog>
  </VContainer>
</template>
