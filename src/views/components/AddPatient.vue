<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import { axiosIns } from "@/plugins/axios";
import { onMounted, ref } from "vue";
import { VForm } from "vuetify/lib/components/index.mjs";

const { isError, errorMessage, isSuccess, successMessage } = cStatus();


const emit = defineEmits([
  "selectedExisting",
  "addedNew",
  "openProfile",
  "close",
]);

const patients = ref<any[]>([]);
const selectedPatient = ref<any>(null);
const isAddingNew = ref(false);

const patientinfo = ref({
  pat_fname: "",
  pat_mname: "",
  pat_lname: "",
  pat_birthDate: "",
  prefix_code: "",
  suffix_code: "",
  sex_code: "NA",
  regcode: "NA",
  provcode: "NA",
  citycode: "NA",
  bgycode: "NA",
  fsNumber: "NA",
  phic_member: "N",
  PCB_nhts: "N",
  uploaded: "N",
  validated: "N",
  phic_stat: "S",
  userid: "",
  date_entered: "",
  time_entered: "",
  date_updated: "",
  time_updated: "",
});

async function fetchPatients() {
  try {
    const response = await axiosIns.get("/api/patients");
    const data = response.data.data || response.data;

    patients.value = data.map((p: any) => {
      const dob = p.pat_birthDate ? new Date(p.pat_birthDate) : null;
      let age = "";
      if (dob) {
        const now = new Date();
        let years = now.getFullYear() - dob.getFullYear();
        const months = now.getMonth() - dob.getMonth();
        if (months < 0) years--;
        age = `${years} years`;
      }

      return {
        ...p,
        fullName: `${p.pat_lname || ""}, ${p.pat_fname || ""} ${p.pat_mname ? p.pat_mname.charAt(0) + "." : ""
          }`,
        age,
      };
    });
  } catch (e) {
    console.error("Error fetching patients:", e);
  }
}

onMounted(fetchPatients);

function selectPatient(p: any) {
  if (!p) return;
  selectedPatient.value = { ...p };
  isAddingNew.value = false;

  patientinfo.value.pat_fname = p.pat_fname || "";
  patientinfo.value.pat_mname = p.pat_mname || "";
  patientinfo.value.pat_lname = p.pat_lname || "";
  patientinfo.value.pat_birthDate = p.pat_birthDate || "";
}

function startAddNew() {
  selectedPatient.value = null;
  isAddingNew.value = true;

  patientinfo.value.pat_fname = "";
  patientinfo.value.pat_mname = "";
  patientinfo.value.pat_lname = "";
  patientinfo.value.pat_birthDate = "";
}

function cancelAddNew() {
  isAddingNew.value = false;
  selectedPatient.value = null;
}

function addPatient() {
  if (selectedPatient.value) {
    emit("selectedExisting", selectedPatient.value);
  } else if (isAddingNew.value) {
    emit("addedNew", patientinfo.value);
  }
  emit("close");
}

function openProfile() {
  if (selectedPatient.value) emit("openProfile", selectedPatient.value);
}
</script>

<template>
  <VForm ref="addpform">
    <VCardTitle class="d-flex justify-space-between align-center">
      <span class="text-h5">Select or Add Patient</span>
      <!-- <VBtn icon="tabler-x" variant="text" @click="emit('close')" /> -->
    </VCardTitle>

    <VCardText>
      <VRow>
        <VCol cols="12">
          <!-- Autocomplete for existing patients -->
          <VAutocomplete v-model="selectedPatient" :items="patients" item-title="fullName" item-value="id"
            label="Search Existing Patients" clearable return-object @change="selectPatient" />
        </VCol>

        <!-- Selected existing patient info (now above Add New button) -->
        <VCol cols="12" v-if="selectedPatient && !isAddingNew" class="mt-2">
          <VCard outlined class="pa-3">
            <div><b>Full Name:</b> {{ selectedPatient.fullName }}</div>
            <div><b>Birth Date:</b> {{ selectedPatient.pat_birthDate }}
              <span v-if="selectedPatient.age">({{ selectedPatient.age }})</span>
            </div>
            <div class="d-flex mt-2">
              <VBtn color="primary" @click="addPatient">Select Patient</VBtn>
              <VBtn color="secondary" class="ml-2" @click="openProfile">View Profile</VBtn>
            </div>
          </VCard>
        </VCol>

        <!-- Add New Patient Button -->
        <VCol cols="12" class="mt-2" v-if="!isAddingNew">
          <VBtn color="primary" class="w-100" @click="startAddNew">
            + Add New Patient
          </VBtn>
        </VCol>
      </VRow>

      <!-- Editable fields for new patient -->
      <VRow v-if="isAddingNew" class="mt-4" dense>
        <VCol cols="12" md="6">
          <VTextField v-model="patientinfo.pat_fname" label="First Name" />
        </VCol>
        <VCol cols="12" md="6">
          <VTextField v-model="patientinfo.pat_mname" label="Middle Name" />
        </VCol>
        <VCol cols="12" md="6">
          <VTextField v-model="patientinfo.pat_lname" label="Last Name" />
        </VCol>
        <VCol cols="12" md="6">
          <VTextField v-model="patientinfo.pat_birthDate" label="Birth Date" type="date" />
        </VCol>

        <VCol cols="12" class="d-flex justify-between mt-4">
          <VBtn color="primary" @click="addPatient">Add Patient</VBtn>
          <VBtn color="error" class="ml-2" @click="cancelAddNew">Cancel</VBtn>
        </VCol>
      </VRow>
    </VCardText>
  </VForm>
</template>
