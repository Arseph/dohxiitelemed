<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import { axiosIns } from "@/plugins/axios";
import { ref, watch } from "vue";
import { VBtn, VRow, VTextField } from "vuetify/lib/components/index.mjs";

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

const civilStatusOptions = [
    { title: 'Single', value: 'S' },
    { title: 'Married', value: 'M' },
    { title: 'Widowed', value: 'W' },
    { title: 'Separated', value: 'P' },
    { title: 'Divorced', value: 'D' },
];


const employmentStatusOptions = [
    { title: 'Regular / Permanent', value: 'Regular / Permanent' },
    { title: 'Probationary', value: 'Probationary' },
    { title: 'Casual', value: 'Casual' },
    { title: 'Contractual', value: 'Contractual' },
    { title: 'Temporary', value: 'Temporary' },
    { title: 'Part-time', value: 'Part-time' },
    { title: 'Full-time', value: 'Full-time' },
    { title: 'Self-Employed', value: 'Self-Employed' },
    { title: 'Unemployed', value: 'Unemployed' },
    { title: 'Retired', value: 'Retired' },
    { title: 'Student', value: 'Student' },
    { title: 'Housewife / Homemaker', value: 'Housewife / Homemaker' },
    { title: 'Overseas Foreign Worker', value: 'Overseas Foreign Worker' },
    { title: 'Volunteer', value: 'Volunteer' },
    { title: 'Disabled / Not able to work', value: 'Disabled / Not able to work' },
    { title: 'Job Order', value: 'Job Order' },
    { title: 'Apprentice', value: 'Apprentice' },
    { title: 'Intern', value: 'Intern' },
    { title: 'Consultant', value: 'Consultant' },
    { title: 'Business Owner', value: 'Business Owner' },
    { title: 'Farmer / Agricultural Worker', value: 'Farmer / Agricultural Worker' },
    { title: 'Fisherman', value: 'Fisherman' },
];



// country list
const nationalityList = ref([]);

// Fetch countries
async function fetchCountries() {
    try {
        const response = await axiosIns.get('/api/tele/countries');
        // Map the data to convert num_code to string
        nationalityList.value = response.data.data
            .map(country => ({
                ...country,
                num_code: country.num_code.toString()
            }))
            .sort((a, b) => a.en_short_name.localeCompare(b.en_short_name));
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
        // Convert zipcode to string, then sort alphabetically
        cityList.value = response.data.data
            .map(city => ({
                ...city,
                zipcode: city.zipcode?.toString() || ''
            }))
            .sort((a, b) => a.muni_name.localeCompare(b.muni_name));
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
        // Map to convert brg_psgc to string, then sort alphabetically
        barangayList.value = response.data.data
            .map(barangay => ({
                ...barangay,
                brg_psgc: barangay.brg_psgc?.toString() || ''
            }))
            .sort((a, b) => a.brg_name.localeCompare(b.brg_name));
    } catch (error) {
        console.error('Error fetching barangays:', error);
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

        // console.log("✅ Patient profile loaded:", form.value);

        successMessage.value = "Patient profile loaded successfully!";
        isSuccess.value = true;

    } catch (error) {
        console.error("❌ Error fetching patient profile:", error);
        errorMessage.value = "Failed to load patient profile.";
        isError.value = true;
    }
}



// async function saveChanges() {
//     try {
//         isSaving.value = true;

//         // Validate form before submitting
//         const valid = await patientpform.value.validate();
//         if (!valid) {
//             errorMessage.value = "Please correct the errors before saving.";
//             isError.value = true;
//             return;
//         }

//         // Build payload: clone form.value
//         const payload = { ...form.value };

//         // Optional: remove backend-managed fields so Laravel handles them
//         delete payload.date_entered;
//         delete payload.time_entered;
//         delete payload.date_updated;
//         delete payload.time_updated;

//         // Optional: ensure ID is included for updates
//         // Laravel controller will check this to update vs create
//         if (form.value.id) {
//             payload.id = form.value.id;
//         }

//         // Send save request
//         await axiosIns.post('/api/patients/store-or-update', payload);

//         // Success snackbar
//         successMessage.value = "Patient information saved successfully!";
//         isSuccess.value = true;

//         // Emit events to parent
//         emit("updated");
//         emit("close");

//     } catch (error) {
//         console.error("Error saving patient:", error);
//         errorMessage.value = "Failed to save patient information.";
//         isError.value = true;
//     } finally {
//         isSaving.value = false;
//     }
// }

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

        // ✅ Build FormData (for file + text data)
        const formData = new FormData();

        // Loop through all fields in the form
        for (const key in form.value) {
            if (form.value[key] !== null && form.value[key] !== undefined) {
                formData.append(key, form.value[key]);
            }
        }

        // If there's an uploaded image file, append it
        if (form.value.pat_image instanceof File) {
            formData.append("pat_image", form.value.pat_image);
        }

        // ✅ POST with multipart/form-data
        await axiosIns.post("/api/patients/store-or-update", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        // Success snackbar
        successMessage.value = "Patient information saved successfully!";
        isSuccess.value = true;

        // Emit events to parent
        emit("updated");
        emit("close");
        isEditing.value = false;
    } catch (error) {
        console.error("❌ Error saving patient:", error);
        errorMessage.value = "Failed to save patient information.";
        isError.value = true;
    } finally {
        isSaving.value = false;
    }
}

function cancelEdit() {
    // optionally reload original patient data
    isEditing.value = false;
}

//picture test
const previewUrl = ref<string | null>(null);

function onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    form.value.pat_image = file;

    const reader = new FileReader();
    reader.onload = () => {
        previewUrl.value = reader.result as string;
    };
    reader.readAsDataURL(file);
}

//lock fields
const isEditing = ref(false);




onMounted(async () => {
    fetchPatientProfile(form.value.id);
    fetchCountries();
    fetchRegions();
    fetchCities();
    fetchBarangay();
    fetchProvince();
})
</script>

<template>
    <VForm ref="patientpform">
        <h2>Patient Profile</h2>
        <!-- <pre>{{ form }}</pre> -->
        <br />
        <VRow>
            <VCol>

                <!-- Photo Upload -->
                <!-- PREVIEW -->
                <VRow v-if="previewUrl">
                    <VCol class="d-flex justify-center">
                        <VAvatar size="200" class="border border-success" rounded="circle">
                            <img :src="previewUrl" alt="Preview"
                                style="width: 100%; height: 100%; object-fit: contain; object-position: center;"
                                :readonly="!isEditing" />
                        </VAvatar>
                    </VCol>
                </VRow>
                <VRow>
                    <VCol>
                        <VFileInput label="Upload Photo" accept="image/*" capture="environment"
                            @change="onImageSelected" variant="outlined" :readonly="!isEditing" />
                    </VCol>
                </VRow>


                <!-- Master & Temporary IDs -->
                <!-- <VRow>
                    <VCol>
                        <VTextField v-model="form.master_patient_perm_id" label="Master Patient Permanent ID:" :readonly="!isEditing"/>
                    </VCol>
                    <VCol>
                        <VTextField v-model="form.pat_temp_id" label="Temporary Patient ID:" :readonly="!isEditing"/>
                    </VCol>
                </VRow> -->

                <!-- Name Details -->
                <VRow>
                    <VCol cols="12" md="3">
                        <VTextField v-model="form.prefix_code" label="Prefix (Mr., Mrs., etc.):"
                            :readonly="!isEditing" />
                    </VCol>
                    <VCol cols="12" md="6">
                        <VTextField v-model="form.pat_fname" label="First Name:" :readonly="!isEditing" />
                    </VCol>
                    <VCol cols="12" md="3">
                        <VTextField v-model="form.pat_mname" label="Middle Name:" :readonly="!isEditing" />
                    </VCol>
                </VRow>
                <VRow>
                    <VCol cols="12" md="6">
                        <VTextField v-model="form.pat_lname" label="Last Name:" :readonly="!isEditing" />
                    </VCol>
                    <VCol cols="12" md="3">
                        <VTextField v-model="form.suffix_code" label="Suffix (Jr., II, etc.):" :readonly="!isEditing" />
                    </VCol>
                    <VCol>
                        <VSelect v-model="form.sex_code" :items="sexOptions" label="Sex:" variant="outlined" clearable
                            :readonly="!isEditing" />
                    </VCol>
                </VRow>

                <!-- Sex, Birth, Civil Status -->
                <VRow>
                    <VCol>
                        <VTextField v-model="form.pat_birthDate" label="Birth Date:" type="date"
                            :readonly="!isEditing" />
                    </VCol>
                    <VCol>
                        <VTextField v-model="form.pat_birthplace" label="Birthplace:" :readonly="!isEditing" />
                    </VCol>
                    <VCol>
                        <VSelect v-model="form.civil_stat_code" :items="civilStatusOptions" label="Civil Status:"
                            item-title="title" item-value="value" variant="outlined" clearable :readonly="!isEditing" />
                    </VCol>
                </VRow>

                <!-- Maiden Name (if married female) -->
                <VRow v-if="['Mrs.', 'Mrs', 'mrs.', 'mrs'].includes(form.prefix_code)">
                    <VCol>
                        <VTextField v-model="form.maiden_middlename" label="Maiden Middle Name:"
                            :readonly="!isEditing" />
                    </VCol>
                    <VCol>
                        <VTextField v-model="form.maiden_lastname" label="Maiden Last Name:" :readonly="!isEditing" />
                    </VCol>
                </VRow>

                <!-- Education & Occupation -->
                <VRow>
                    <VCol>
                        <VSelect v-model="form.educattainment" :items="educationalAttainments"
                            label="Educational Attainment:" item-title="text" item-value="code" clearable
                            :readonly="!isEditing" />
                    </VCol>
                    <VCol>
                        <VSelect v-model="form.occupation_code" label="Employment Status:"
                            :items="employmentStatusOptions" item-title="title" item-value="value" variant="outlined"
                            clearable :readonly="!isEditing" />
                    </VCol>
                </VRow>
                <VRow>
                    <VCol>
                        <VTextField v-model="form.occupation_sp" label="Specific Occupation:" :readonly="!isEditing" />
                    </VCol>
                    <VCol>
                        <VTextField v-model="form.date_of_effectivity" label="Date of Effectivity:" type="date"
                            :readonly="!isEditing" />
                    </VCol>
                </VRow>

                <!-- Employer & Income -->
                <VRow>
                    <VCol>
                        <VTextField v-model="form.phic_employer_name" label="Name of Employer:"
                            :readonly="!isEditing" />
                    </VCol>
                    <VCol>
                        <VTextField v-model="form.phic_employer_no" label="Employer PHIC No.:" :readonly="!isEditing" />
                    </VCol>
                </VRow>
                <VRow>
                    <VCol>
                        <VTextField type="number" v-model="form.monthly_income" label="Monthly Income:"
                            :readonly="!isEditing" />
                    </VCol>
                    <VCol>
                        <VAutocomplete v-model="form.nationality" :items="nationalityList" item-title="nationality"
                            item-value="num_code" label="Nationality:" outlined dense hide-details clearable
                            persistent-hint :readonly="!isEditing" />
                    </VCol>
                </VRow>

                <!-- Tax / Religion / Ethnicity -->
                <VRow>
                    <VCol>
                        <VTextField type="number" v-model="form.tax_id_num" label="TIN No.:" :readonly="!isEditing" />
                    </VCol>
                    <VCol>
                        <VAutocomplete v-model="form.religion_code" :items="religions" label="Religion:"
                            item-title="text" item-value="code" clearable autocomplete :readonly="!isEditing" />
                    </VCol>
                </VRow>
                <VRow>
                    <VCol>
                        <VTextField v-model="form.IndigenousGroup" label="Indigenous Group:" :readonly="!isEditing" />
                    </VCol>
                    <VCol>
                        <VTextField v-model="form.ethnic_code" label="Ethnic Group:" clearable :readonly="!isEditing" />
                    </VCol>
                    <VCol>
                        <VTextField v-model="form.bloodtype_code" label="Blood Type:" clearable
                            :readonly="!isEditing" />
                    </VCol>
                </VRow>

                <!-- Mother's Info -->
                <VRow>
                    <VCol>
                        <VTextField v-model="form.mot_fname" label="Mother’s First Name:" :readonly="!isEditing" />
                    </VCol>
                    <VCol>
                        <VTextField v-model="form.mot_mname" label="Mother’s Middle Name:" :readonly="!isEditing" />
                    </VCol>
                    <VCol>
                        <VTextField v-model="form.mot_lname" label="Mother’s Last Name:" :readonly="!isEditing" />
                    </VCol>
                    <VCol>
                        <VTextField v-model="form.mot_birthdate" label="Mother’s Birthdate:" type="date"
                            :readonly="!isEditing" />
                    </VCol>
                </VRow>

                <!-- Address -->
                <VRow>
                    <VCol>
                        <VAutocomplete v-model="form.country_code" :items="nationalityList" item-title="en_short_name"
                            item-value="num_code" label="Country:" outlined dense hide-details clearable persistent-hint
                            :readonly="!isEditing" />
                    </VCol>
                </VRow>
                <VRow>
                    <VCol>
                        <VTextField v-model="form.fhNumber" label="House No./Lot/Bldg:" :readonly="!isEditing" />
                    </VCol>
                    <VCol>
                        <VTextField v-model="form.pat_str" label="Street:" :readonly="!isEditing" />
                    </VCol>
                </VRow>
                <VRow>
                    <VCol>
                        <VAutocomplete v-model="form.regcode" :items="regionList" item-title="reg_desc"
                            item-value="reg_code" label="Region:" outlined dense hide-details clearable
                            :readonly="!isEditing" />
                    </VCol>
                    <VCol>
                        <VAutocomplete v-model="form.provcode" :items="provinceList" item-title="prov_name"
                            item-value="prov_code" label="Province:" outlined dense hide-details clearable
                            :readonly="!isEditing" />
                    </VCol>
                </VRow>
                <VRow>
                    <VCol>
                        <VAutocomplete v-model="form.citycode" :items="cityList" item-title="muni_name"
                            item-value="zipcode" label="Municipality/City:" clearable :readonly="!isEditing" />
                    </VCol>
                    <VCol>
                        <VAutocomplete v-model="form.bgycode" :items="barangayList" item-title="brg_name"
                            item-value="brg_psgc" label="Barangay:" clearable :readonly="!isEditing" />
                    </VCol>
                    <VCol>
                        <VTextField type="number" v-model="form.zipcode" label="ZIP Code:" :readonly="!isEditing" />
                    </VCol>
                </VRow>
                <VRow>
                    <VCol>
                        <VTextField v-model="form.patient_address" label="Complete Address:" :readonly="!isEditing" />
                    </VCol>
                </VRow>

                <!-- Contact -->
                <VRow>
                    <VCol>
                        <VTextField v-model="form.pat_email" label="Email Address:" :readonly="!isEditing" />
                    </VCol>
                    <VCol>
                        <VTextField type="number" v-model="form.pat_mobile" label="Mobile Number:"
                            :readonly="!isEditing" />
                    </VCol>
                    <VCol>
                        <VTextField type="number" v-model="form.pat_landline" label="Landline:"
                            :readonly="!isEditing" />
                    </VCol>
                </VRow>

                <!-- PhilHealth Info -->
                <VRow>
                    <VCol>
                        <VSelect v-model="form.philhealth_status_code" label="PhilHealth Status:" :items="[
                            { title: 'None', value: '0' },
                            { title: 'Member', value: '1' },
                            { title: 'Dependent', value: '2' }
                        ]" item-title="title" item-value="value" variant="outlined" clearable :readonly="!isEditing" />
                    </VCol>
                    <VCol>
                        <VTextField v-model="form.pat_philhealth" label="PhilHealth ID:" :readonly="!isEditing" />
                    </VCol>
                </VRow>

                <!-- Save/edit Button -->
                <!-- <VRow>
                    <VCol class="d-flex justify-end">
                        <VBtn color="primary" :loading="isSaving" @click="saveChanges">Save</VBtn>
                    </VCol>
                </VRow> -->
                <VRow class="justify-end mb-4">
                    <VCol>
                        <VBtn v-if="!isEditing" color="primary" @click="isEditing = true">
                            Edit
                        </VBtn>

                        <VBtn v-if="isEditing" color="success" @click="saveChanges">
                            Save
                        </VBtn>

                        <VBtn v-if="isEditing" color="error" class="ml-2" @click="cancelEdit">
                            Cancel
                        </VBtn>
                    </VCol>
                </VRow>
            </VCol>
        </VRow>
    </VForm>
</template>
