<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import { axiosIns } from "@/plugins/axios";
import { onMounted, ref } from "vue";
import { VForm } from "vuetify/lib/components/index.mjs";

const { isError, errorMessage, isSuccess, successMessage } = cStatus();
const addpform = ref(null)

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
  sex_code: "",
  regcode: "NA",
  provcode: "N/A",
  citycode: "N/A",
  bgycode: "N/A",
  fsNumber: "N/A",
  phic_member: "1",
  PCB_nhts: "0",
  uploaded: "0",
  validated: "0",
  phic_stat: "0",
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

async function addPatient() {
  // Selecting existing patient — no validation needed
  if (selectedPatient.value) {
    emit("selectedExisting", selectedPatient.value);
    emit("close");
    return;
  }

  // Adding new patient — must validate required fields
  if (isAddingNew.value) {
    const form = addpform.value;
    if (!form) return;

    const { valid } = await form.validate();

    if (!valid) {
      isError.value = true;
      errorMessage.value = "Please fill in all required fields.";
      return;
    }

    emit("addedNew", patientinfo.value);
    emit("close");
  }
}


function openProfile() {
  if (selectedPatient.value) emit("openProfile", selectedPatient.value);
}

const getImageUrl = (path: string) => {
  if (!path) return "";
  return `${import.meta.env.VITE_APP_BACKEND_URL}/${path}`;
};

onMounted(fetchPatients);

const toUpperCase = (field: string) => {
  if (field in patientinfo.value) {
    patientinfo.value[field] = patientinfo.value[field]?.toUpperCase();
  }
};

const requiredValidator = (v) => !!v || 'This field is required'
</script>

<template>
  <VForm ref="addpform">
    <VCardText>
      <VRow>
        <!-- <pre>{{ selectedPatient }}</pre> -->
        <VCol cols="12">
          <!-- Autocomplete for existing patients -->
          <VAutocomplete v-model="selectedPatient" :items="patients" item-title="fullName" item-value="id"
            label="Search Existing Patients" clearable return-object @change="selectPatient" @click="cancelAddNew" />
        </VCol>

        <!-- Selected existing patient info (now above Add New button) -->
        <VCol cols="12" v-if="selectedPatient && !isAddingNew" class="mt-2">
          <VCard outlined class="pa-3">
            <VRow no-gutters>
              <VCol cols="12" md="2">
                <VAvatar size="80" class="mx-auto elevation-1"
                  style="border: 3px solid #1976d2; border-radius: 50%; overflow: hidden;">
                  <template v-if="previewImage || selectedPatient.pat_image">
                    <img :src="previewImage || getImageUrl(selectedPatient.pat_image)" alt="Profile Picture"
                      style="width: 100%; height: 100%; object-fit: contain; object-position: center;" />
                  </template>
                  <template v-else>
                    <VIcon icon="tabler-user-circle" size="126" color="blue-grey-darken-2" />
                  </template>
                </VAvatar>
              </VCol>
              <VCol>
                <b>Full Name:</b> {{ selectedPatient.fullName }} <br />
                <b>Birth Date:</b> {{ selectedPatient.pat_birthDate }}
                <span v-if="selectedPatient.age">({{ selectedPatient.age }})</span> <br />
                <VBtn color="primary" @click="addPatient">Select Patient</VBtn>
                <VBtn color="secondary" class="ml-2" @click="openProfile">View Profile</VBtn>
              </VCol>
            </VRow>
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
      <VRow v-if="isAddingNew" class="mt-4">
        <VCol cols="12" md="6" class="d-flex">
          <VTextField @input="() => { toUpperCase('pat_fname'); }" v-model="patientinfo.pat_fname" label="First Name"
            :rules="[requiredValidator]" />
        </VCol>
        <VCol cols="12" md="6" class="d-flex">
          <VTextField @input="() => { toUpperCase('pat_mname'); }" v-model="patientinfo.pat_mname" label="Middle Name"
            :rules="[requiredValidator]" />
        </VCol>
      </VRow>
      <VRow v-if="isAddingNew">
        <VCol cols=" 12" md="6" class="d-flex">
          <VTextField @input="() => { toUpperCase('pat_lname'); }" v-model="patientinfo.pat_lname" label="Last Name"
            :rules="[requiredValidator]" />
        </VCol>
        <VCol cols="12" md="3" class="d-flex">
          <VSelect v-model="patientinfo.sex_code" label="Sex:" variant="outlined" clearable :rules="[requiredValidator]"
            :items="[{ title: 'Male', value: 'Male' }, { title: 'Female', value: 'Female' }]" />
        </VCol>
        <VCol cols="12" md="3" class="d-flex">
          <VTextField v-model="patientinfo.pat_birthDate" label="Birth Date" type="date" :rules="[requiredValidator]" />
        </VCol>
      </VRow>
      <VRow v-if="isAddingNew">
        <VCol cols=" 12" class="d-flex justify-between mt-4">
          <VBtn color="primary" @click="addPatient">Add Patient</VBtn>
          <VBtn color="error" class="ml-2" @click="cancelAddNew">Cancel</VBtn>
        </VCol>
      </VRow>
    </VCardText>
  </VForm>
</template>
