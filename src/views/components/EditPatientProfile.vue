<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import ErrorSnackbar from "@/components/snackbars/errors.vue";
import SuccessSnackbar from "@/components/snackbars/success.vue";
import { axiosIns } from "@/plugins/axios";
import { ref, watch } from "vue";
import { VRow } from "vuetify/lib/components/index.mjs";

const patientpform = ref<VForm>();
const { isError, errorMessage, isSuccess, successMessage } = cStatus();
const props = defineProps({
    patient: { type: Object, required: true },
});
const emit = defineEmits(["close", "updated"]);

const form = ref({ ...props.patient });
const isSaving = ref(false);

const religions = [
    { code: 'AGLIP', text: 'AGLIPAY' },
    { code: 'ALLY', text: 'ALLIANCE OF BIBLE CHRISTIAN COMMUNITIES' },
    { code: 'ANGLI', text: 'ANGLICAN' },
    { code: 'BAPTI', text: 'AGLIPAY' }, // looks like a duplicate in your PHP
    { code: 'BRNAG', text: 'BORN AGAIN CHRISTIAN' },
    { code: 'BUDDH', text: 'BUDDHISM' },
    { code: 'CATHO', text: 'CATHOLIC' },
    { code: 'XTIAN', text: 'CHRISTIAN' },
    { code: 'CHOG', text: 'CHURCH OF GOD' },
    { code: 'EVANG', text: 'EVANGELICAL' },
    { code: 'IGNIK', text: 'IGLESIA NI CRISTO' },
    { code: 'MUSLI', text: 'ISLAM' },
    { code: 'JEWIT', text: 'JEHOVAHS WITNESS' },
    { code: 'MORMO', text: 'LDS-MORMONS' },
    { code: 'LRCM', text: 'LIFE RENEWAL CHRISTIAN MINISTRY' },
    { code: 'LUTHR', text: 'LUTHERAN' },
    { code: 'METOD', text: 'METHODIST' },
    { code: 'PENTE', text: 'PENTECOSTAL' },
    { code: 'PROTE', text: 'PROTESTANT' },
    { code: 'SVDAY', text: 'SEVENTH DAY ADVENTIST' },
    { code: 'UCCP', text: 'UCCP' },
    { code: 'UNKNO', text: 'UNKNOWN' },
    { code: 'WESLY', text: 'WESLEYAN' },
];

const educationalAttainments = [
    { code: '01', text: 'ELEMENTARY EDUCATION' },
    { code: '02', text: 'HIGH SCHOOL EDUCATION' },
    { code: '03', text: 'COLLEGE' },
    { code: '04', text: 'POSTGRADUATE PROGRAM' },
    { code: '05', text: 'NO FORMAL EDUCATION' },
    { code: '06', text: 'NOT APPLICABLE' },
    { code: '07', text: 'VOCATIONAL' },
];

const idTypes = [
    { code: 'umid', text: 'UMID' },
    { code: 'dl', text: "DRIVER'S LICENSE" },
    { code: 'passport', text: 'PASSPORT ID' },
    { code: 'postal', text: 'POSTAL ID' },
    { code: 'tin', text: 'TIN ID' },
    { code: 'none', text: 'NOT APPLICABLE' },
];

// country list
const nationalityList = ref([]);

// Fetch countries
async function fetchCountries() {
    try {
        const response = await axiosIns.get('/api/tele/countries');
        // Sort the data alphabetically, just in case
        nationalityList.value = response.data.data.sort((a, b) => a.en_short_name.localeCompare(b.en_short_name));
    } catch (error) {
        console.error('Error fetching countries:', error);
    }
}

// region list
const regionList = ref([]);

// Fetch region
async function fetchRegions() {
    try {
        const response = await axiosIns.get('/api/tele/regions');
        // Sort the data alphabetically, just in case
        regionList.value = response.data.data.sort((a, b) => a.reg_desc.localeCompare(b.reg_desc));
    } catch (error) {
        console.error('Error fetching regions:', error);
    }
}

// city list
const cityList = ref([]);

// Fetch city
async function fetchCities() {
    try {
        const response = await axiosIns.get('/api/tele/cities');
        // Sort the data alphabetically, just in case
        cityList.value = response.data.data.sort((a, b) => a.muni_name.localeCompare(b.muni_name));
    } catch (error) {
        console.error('Error fetching cities:', error);
    }
}

// province list
const provinceList = ref([]);

// Fetch province
async function fetchProvince() {
    try {
        const response = await axiosIns.get('/api/tele/provinces');
        // Sort the data alphabetically, just in case
        provinceList.value = response.data.data.sort((a, b) => a.prov_name.localeCompare(b.prov_name));
    } catch (error) {
        console.error('Error fetching provinces:', error);
    }
}

// barangay list
const barangayList = ref([]);

// Fetch barangay
async function fetchBarangay() {
    try {
        const response = await axiosIns.get('/api/tele/barangays');
        // Sort the data alphabetically, just in case
        barangayList.value = response.data.data.sort((a, b) => a.brg_name.localeCompare(b.brg_name));
    } catch (error) {
        console.error('Error fetching barangays:', error);
    }
}


//conver data ype brgy
const bgycodec = ref(null);

function convertBgyCode() {
    if (props.patient.bgycode) {
        bgycodec.value = Number(props.patient.bgycode);
        form.value.bgycode = bgycodec.value;
        props.patient.bgycode = bgycodec.value;
        console.log("[convertBgyCode] Converted bgycode:", bgycodec.value);
    } else {
        bgycodec.value = null;
        form.value.bgycode = null;
        props.patient.bgycode = null;
        console.log("[convertBgyCode] No bgycode to convert");
    }
}


watch(
    () => props.patient,
    (newVal) => {
        form.value = { ...newVal };
    },
    { immediate: true }
);

async function fetchPatientProfile(patientId) {
    try {

        // Fetch patient profile
        const response = await axiosIns.get(`/api/patients/${patientId}`);
        const data = response.data.data ?? response.data; // handle wrapped responses

        if (!data) {
            console.warn("⚠️ No patient data found for ID:", patientId);
            errorMessage.value = "Patient profile not found.";
            isError.value = true;
            return;
        }

        // Clone all fields into form.value
        form.value = { ...data };

        console.log("✅ Patient profile loaded:", form.value);

        successMessage.value = "Patient profile loaded successfully!";
        isSuccess.value = true;

    } catch (error) {
        console.error("❌ Error fetching patient profile:", error);
        errorMessage.value = "Failed to load patient profile.";
        isError.value = true;
    }
}



async function saveChanges() {
    try {
        isSaving.value = true;

        // Validate form before submitting
        const valid = await patientpform.value.validate();
        if (!valid) {
            errorMessage.value = "Please correct the errors before saving.";
            isError.value = true;
            return;
        }

        // Build payload: clone form.value
        const payload = { ...form.value };

        // Optional: remove backend-managed fields so Laravel handles them
        delete payload.date_entered;
        delete payload.time_entered;
        delete payload.date_updated;
        delete payload.time_updated;

        // Optional: ensure ID is included for updates
        // Laravel controller will check this to update vs create
        if (form.value.id) {
            payload.id = form.value.id;
        }

        // Send save request
        await axiosIns.post('/api/patients/store-or-update', payload);

        // Success snackbar
        successMessage.value = "Patient information saved successfully!";
        isSuccess.value = true;

        // Emit events to parent
        emit("updated");
        emit("close");

    } catch (error) {
        console.error("Error saving patient:", error);
        errorMessage.value = "Failed to save patient information.";
        isError.value = true;
    } finally {
        isSaving.value = false;
    }
}



onMounted(async () => {
    fetchPatientProfile(form.value.id);
    convertBgyCode();
    fetchCountries();
    fetchRegions();
    fetchCities();
    fetchBarangay();
    fetchProvince();
})
</script>

<template>
    <ErrorSnackbar :message="errorMessage" :visible="isError" @update:visible="isError = $event" absolute bottom left />
    <SuccessSnackbar :message="successMessage" :visible="isSuccess" @update:visible="isSuccess = $event" absolute bottom
        left />
    <VForm ref="patientpform">
        <h2>Patient Profile</h2>
        <!-- <pre>{{ form }}</pre> -->
        <br />
        <VRow>
            <VCol>
                <VRow>
                    <VCol>
                        <VSelect v-model="form.philhealth_status_code" label="Philhealth Status:" :items="[
                            { title: 'None', value: '0' },
                            { title: 'Member', value: '1' },
                            { title: 'Dependent', value: '2' },
                        ]" item-title="title" item-value="value" variant="outlined" clearable />
                    </VCol>
                    <VCol>
                        <VTextField v-model="form.pat_philhealh" label="PhilHealth ID:" />
                    </VCol>
                </VRow>
                <VRow>
                    <VCol>
                        <VTextField v-model="form.pat_fname" label="First Name:" />
                    </VCol>
                    <VCol>
                        <VTextField v-model="form.pat_mname" label="Middle Name:" />
                    </VCol>
                </VRow>
                <VRow>
                    <VCol>
                        <VTextField v-model="form.pat_lname" label="Last Name:" />
                    </VCol>
                    <VCol>
                        <VTextField v-model="form.pat_mobile" label="Contact Number:" />
                    </VCol>
                </VRow>
                <VRow>
                    <VCol>
                        <VTextField v-model="form.pat_birthDate" label="Birth Date:" type="date" />
                    </VCol>
                    <VCol>
                        <VTextField v-model="form.sex_code" label="Sex:" />
                    </VCol>
                </VRow>
                <VRow>
                    <VCol>
                        <VSelect v-model="form.civil_stat_code" label="Civil Status:" :items="[
                            { title: 'Single', value: 's' },
                            { title: 'Married', value: '1' },
                            { title: 'Widowed', value: '2' },
                            { title: 'Separated', value: '3' },
                            { title: 'Divorced', value: '4' },
                        ]" item-title="title" item-value="value" variant="outlined" clearable />
                    </VCol>
                    <VCol>
                        <VAutocomplete v-model="form.religion_code" :items="religions" label="Religion:"
                            item-title="text" item-value="code" clearable autocomplete />
                    </VCol>
                </VRow>
                <VRow>
                    <VCol>
                        <VSelect v-model="form.educattainment" :items="educationalAttainments"
                            label="Educational Attainment:" item-title="text" item-value="code" clearable />
                    </VCol>
                    <VCol>
                        <VTextField v-model="form.occupation_code" label="Occupation:" />
                    </VCol>
                </VRow>
                <VRow>
                    <VCol>
                        <VTextField v-model="form.monthly_income" label="Monthly Income:" />
                    </VCol>
                    <!-- <VCol>
                        <VSelect v-model="form.id_type" :items="idTypes" label="Select ID:" item-title="text"
                            item-value="code" clearable autocomplete :menu-props="{ maxHeight: '300' }" />
                    </VCol> -->
                </VRow>
                <VRow>
                    <!-- <VCol>
                        <VTextField v-model="form.idkyet" label="CRN:" />
                    </VCol> -->
                    <VCol>
                        <VAutocomplete v-model="form.nationality" :items="nationalityList" item-title="nationality"
                            item-value="num_code" label="Nationality:" outlined dense hide-details clearable
                            persistent-hint />
                    </VCol>
                </VRow>
                <VRow>
                    <VCol>
                        <VTextField v-model="form.fhNumber" label="House no./Lot/Bldg:" />
                    </VCol>
                    <VCol>
                        <VTextField v-model="form.pat_str" label="Street:" />
                    </VCol>
                </VRow>
                <VRow>
                    <VCol>
                        <VAutocomplete v-model="form.regcode" :items="regionList" item-title="reg_desc"
                            item-value="reg_code" label="Region:" outlined dense hide-details clearable
                            persistent-hint />
                    </VCol>
                    <VCol>
                        <VAutocomplete v-model="form.provcode" :items="provinceList" item-title="prov_name"
                            item-value="prov_code" label="Province:" outlined dense hide-details clearable
                            persistent-hint />
                    </VCol>
                </VRow>
                <VRow>
                    <VCol>
                        <VAutocomplete v-model="form.zipcode" :items="cityList" item-title="muni_name"
                            item-value="zipcode" label="Municipality:" outlined dense hide-details clearable
                            persistent-hint />
                    </VCol>
                    <VCol>
                        <VAutocomplete v-model="form.bgycode" :items="barangayList" item-title="brg_name"
                            item-value="brg_psgc" label="Barangay:" outlined dense hide-details clearable
                            persistent-hint />
                    </VCol>
                </VRow>
                <VRow>
                    <VCol>
                        <VTextField v-model="form.patient_address" label="Complete Address :" />
                    </VCol>
                </VRow>
                <VRow>
                    <VCol class="d-flex justify-end">
                        <VBtn color="primary" :loading="isSaving" @click="saveChanges">
                            Save</VBtn>
                        <!-- <VBtn variant="tonal" @click="$emit('close')">Cancel</VBtn> -->
                    </VCol>
                </VRow>
            </VCol>
        </VRow>
    </VForm>
</template>
