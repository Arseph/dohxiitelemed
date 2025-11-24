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

const profileformp = ref({ ...props.patient });
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
    { title: 'Single', value: '0' },
    { title: 'Married', value: '1' },
    { title: 'Widowed', value: '2' },
    { title: 'Separated', value: '3' },
    { title: 'Divorced', value: '4' },
];

const indigenGroup = [
    { title: 'Igorot', value: '0' },
    { title: 'Aeta', value: '1' },
    { title: 'Mangyan', value: '2' },
    { title: 'Lumad', value: '3' },
    { title: 'Moro', value: '4' },
    { title: 'Palawano', value: '5' },
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

const philheatlhStatusTypes = [
    // Direct Contributors
    { title: "Employed", value: "E" },
    { title: "Self-Employed", value: "S" },
    { title: "Professional Practitioner", value: "P" },
    { title: "OFW", value: "O" },

    // Indirect Contributors / Sponsored
    { title: "Indigent / Sponsored", value: "I" },
    { title: "Lifetime Member", value: "L" },
    { title: "Senior Citizen", value: "C" }, // sometimes "C" or "S"
    { title: "Persons with Disability", value: "D" },

    // Dependents / Others
    { title: "Dependent", value: "X" },  // commonly "X"
    { title: "Kasambahay", value: "K" },
];

const relationshipToMember = [
    { code: 'S', text: 'Self' },
    { code: 'H', text: 'Spouse' },
    { code: 'C', text: 'Child' },
    { code: 'P', text: 'Parent' },
    { code: 'B', text: 'Sibling' },
    { code: 'O', text: 'Other' }
];



// // same as patient tick
// const sameAsPatient = ref(false);

// function applyPatientName() {
//     if (sameAsPatient.value) {
//         profileformp.value.pMemberFname = profileformp.value.pat_fname || "";
//         profileformp.value.pMemberMname = profileformp.value.pat_mname || "";
//         profileformp.value.pMemberLname = profileformp.value.pat_lname || "";
//         profileformp.value.pMemberBdate = profileformp.value.pat_birthDate || "";
//     }
// }


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
        Object.assign(profileformp, newVal);

        // Re-apply names if user ticked the checkbox
        // if (sameAsPatient.value) {
        //     applyPatientName();
        // }
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

        // Clone all fields into profileformp.value
        profileformp.value = { ...data };

        // console.log("✅ Patient profile loaded:", profileformp.value);

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

        // Vuetify validation
        const valid = await patientpform.value.validate();
        if (!valid) {
            errorMessage.value = "Please correct the errors before saving.";
            isError.value = true;
            return;
        }

        // Custom required validation (empty or N/A)
        for (const key in requiredFields) {
            const value = profileformp.value[key];

            if (!value || value === "" || value === "N/A" || value === "NA" || value === null) {
                isError.value = true;
                errorMessage.value = `${requiredFields[key]} is required and cannot be empty or 'N/A'.`;
                return;
            }
        }

        // Build FormData
        const formData = new FormData();
        for (const key in profileformp.value) {
            if (profileformp.value[key] != null) {
                formData.append(key, profileformp.value[key]);
            }
        }

        // File input
        if (profileformp.value.pat_image instanceof File) {
            formData.append("pat_image", profileformp.value.pat_image);
        }

        await axiosIns.post("/api/patients/store-or-update", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        successMessage.value = "Patient information saved successfully!";
        isSuccess.value = true;

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

    // Assign the uploaded file
    profileformp.value.pat_image = file;

    // Mark as uploaded
    profileformp.value.uploaded = "1";

    //Set current date in YYYY-MM-DD format
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    profileformp.value.date_uploaded = `${yyyy}-${mm}-${dd}`;

    // Preview logic
    const reader = new FileReader();
    reader.onload = () => {
        previewUrl.value = reader.result as string;
    };
    reader.readAsDataURL(file);
}


//lock fields
const isEditing = ref(false);

onMounted(async () => {
    fetchPatientProfile(profileformp.value.id);
    fetchCountries();
    fetchRegions();
    fetchCities();
    fetchBarangay();
    fetchProvince();
})

const toUpperCase = (field: string) => {
    if (field in profileformp.value) {
        profileformp.value[field] = profileformp.value[field]?.toUpperCase();
    }
};

const requiredValidator = (v) => !!v || 'This field is required'

const requiredFields = {
    prefix_code: "Prefix",
    pat_fname: "First Name",
    pat_mname: "Middle Name",
    pat_lname: "Last Name",
    sex_code: "Sex",
    pat_birthDate: "Birth Date",

    fsNumber: "Family Serial Number",
    PCB_nhts: "PCB Eligible",

    regcode: "Region",
    provcode: "Province",
    citycode: "City/Municipality",
    bgycode: "Barangay",
};

//income formatting
const displayIncome = ref("");

watch(
    () => profileformp.value.monthly_income,
    (val) => {
        displayIncome.value = formatNumber(val);
    },
    { immediate: true }
);

function formatWithCommas(e: any) {
    let val = e.target.value;

    // Remove everything except digits
    val = val.replace(/\D/g, "");

    // Save raw number to model
    profileformp.value.monthly_income = val;

    // Add commas for display
    displayIncome.value = formatNumber(val);
}

function formatNumber(val: string) {
    if (!val) return "";
    return Number(val).toLocaleString("en-US");
}


</script>

<template>
    <VForm ref="patientpform">
        <h2>Patient Profile</h2>
        <!-- <pre>{{ profileformp }}</pre> -->
        <br />
        <VCol>

            <!-- Photo Upload -->
            <!-- PREVIEW -->
            <VRow v-if="previewUrl">
                <VCol class="d-flex justify-center">
                    <VAvatar size="200" class="mx-auto elevation-1 avatar-border-blue" rounded="lg" variant="tonal">
                        <img :src="previewUrl" alt="Preview"
                            style="width: 100%; height: 100%; object-fit: contain; object-position: center;"
                            :readonly="!isEditing" />
                    </VAvatar>
                </VCol>
            </VRow>
            <VRow>
                <VCol>
                    <VFileInput label="Upload Photo" accept="image/*" capture="environment" @change="onImageSelected"
                        variant="outlined" :readonly="!isEditing" />
                </VCol>
            </VRow>


            <!-- Master & Temporary IDs -->
            <!-- <VRow>
                    <VCol>
                        <VTextField v-model="profileformp.master_patient_perm_id" label="Master Patient Permanent ID:" :readonly="!isEditing"/>
                    </VCol>
                    <VCol>
                        <VTextField v-model="profileformp.pat_temp_id" label="Temporary Patient ID:" :readonly="!isEditing"/>
                    </VCol>
                </VRow> -->

            <!-- Name Details -->
            <VRow class="mt-5">
                <VCol cols="12" md="3">
                    <VTextField v-model="profileformp.prefix_code" label="Prefix:"
                        @input="() => { toUpperCase('prefix_code'); }" :readonly="!isEditing"
                        :rules="[requiredValidator]" />
                </VCol>
                <VCol cols="12" md="6">
                    <VTextField v-model="profileformp.pat_fname" label="First Name:" :readonly="!isEditing"
                        @input="() => { toUpperCase('pat_fname'); }" :rules="[requiredValidator]" />
                </VCol>
                <VCol cols="12" md="3">
                    <VTextField v-model="profileformp.pat_mname" label="Middle Name:" :readonly="!isEditing"
                        @input="() => { toUpperCase('pat_mname'); }" :rules="[requiredValidator]" />
                </VCol>
            </VRow>
            <VRow class="mt-5">
                <VCol cols="12" md="6">
                    <VTextField v-model="profileformp.pat_lname" label="Last Name:" :readonly="!isEditing"
                        @input="() => { toUpperCase('pat_lname'); }" :rules="[requiredValidator]" />
                </VCol>
                <VCol cols="12" md="3">
                    <VTextField v-model="profileformp.suffix_code" label="Suffix (Jr., II, etc.):"
                        :readonly="!isEditing" @input="() => { toUpperCase('suffix_code'); }" />
                </VCol>
                <VCol>
                    <VSelect v-model="profileformp.sex_code" :items="[
                        { title: 'Male', value: 'Male' },
                        { title: 'Female', value: 'Female' }]" label="Sex:" variant="outlined" clearable
                        :readonly="!isEditing" :rules="[requiredValidator]" />
                </VCol>
            </VRow>

            <!-- Sex, Birth, Civil Status -->
            <VRow class="mt-5">
                <VCol>
                    <VTextField v-model="profileformp.pat_birthDate" label="Birth Date:" type="date"
                        :readonly="!isEditing" />
                </VCol>
                <VCol>
                    <VTextField v-model="profileformp.pat_birthplace" label="Birthplace:" :readonly="!isEditing"
                        @input="() => { toUpperCase('pat_birthplace'); }" />
                </VCol>
                <VCol>
                    <VSelect v-model="profileformp.civil_stat_code" :items="civilStatusOptions" label="Civil Status:"
                        item-title="title" item-value="value" variant="outlined" clearable :readonly="!isEditing" />
                </VCol>
            </VRow>

            <!-- Maiden Name (if married female) -->
            <div v-if="['MRS.', 'MRS'].includes(profileformp.prefix_code) || profileformp.sex_code == 'Female' && profileformp.civil_stat_code == 1"
                class="mt-3 mb-1" style="color:#1976d2">If Married(Spouse):
            </div>
            <VRow
                v-if="['MRS.', 'MRS'].includes(profileformp.prefix_code) || profileformp.sex_code == 'Female' && profileformp.civil_stat_code == 1">
                <VCol>
                    <VTextField v-model="profileformp.maiden_middlename" label="Maiden Middle Name:"
                        :readonly="!isEditing" @input="() => { toUpperCase('maiden_middlename'); }" />
                </VCol>
                <VCol>
                    <VTextField v-model="profileformp.maiden_lastname" label="Maiden Last Name:" :readonly="!isEditing"
                        @input="() => { toUpperCase('maiden_lastname'); }" />
                </VCol>
            </VRow>

            <!-- Education & Occupation -->
            <VRow>
                <VCol>
                    <VSelect v-model="profileformp.educattainment" :items="educationalAttainments"
                        label="Educational Attainment:" item-title="text" item-value="code" clearable
                        :readonly="!isEditing" />
                </VCol>
                <VCol>
                    <VSelect v-model="profileformp.occupation_code" label="Employment Status:"
                        :items="employmentStatusOptions" item-title="title" item-value="value" variant="outlined"
                        clearable :readonly="!isEditing" @input="() => { toUpperCase('prefix_code'); }" />
                </VCol>
            </VRow>
            <VRow>
                <VCol>
                    <VTextField v-model="profileformp.occupation_sp" label="Specific Occupation:" :readonly="!isEditing"
                        @input="() => { toUpperCase('occupation_sp'); }" />
                </VCol>
                <VCol>
                    <VTextField v-model="profileformp.date_of_effectivity" label="Date of Effectivity:" type="date"
                        :readonly="!isEditing" />
                </VCol>
            </VRow>

            <!-- Employer & Income -->
            <VRow>
                <VCol>
                    <VTextField v-model="profileformp.enlist_date" label="Date of Enlisted:" type="date"
                        :readonly="!isEditing" />
                </VCol>
                <VCol>
                    <VTextField v-model="profileformp.phic_employer_name" label="Name of Employer:"
                        :readonly="!isEditing" @input="() => { toUpperCase('phic_employer_name'); }" />
                </VCol>
            </VRow>
            <VRow>
                <VCol>
                    <VTextField v-model="profileformp.phic_employer_no" label="Employer PHIC No.:"
                        :readonly="!isEditing" @input="() => { toUpperCase('phic_employer_no'); }" />
                </VCol>
                <VCol cols="12" md="3">
                    <VTextField v-model="displayIncome" label="Monthly Income:" prefix="₱" :readonly="!isEditing"
                        @input="formatWithCommas" />
                </VCol>
                <VCol cols="12" md="3">
                    <VAutocomplete v-model="profileformp.nationality" :items="nationalityList" item-title="nationality"
                        item-value="num_code" label="Nationality:" outlined hide-details clearable persistent-hint
                        :readonly="!isEditing" />
                </VCol>
            </VRow>

            <!-- Tax / Religion / Ethnicity -->
            <VRow>
                <VCol>
                    <VTextField type="number" v-model="profileformp.tax_id_num" label="TIN No.:"
                        :readonly="!isEditing" />
                </VCol>
                <VCol>
                    <VAutocomplete v-model="profileformp.religion_code" :items="religions" label="Religion:"
                        item-title="text" item-value="code" clearable autocomplete :readonly="!isEditing" />
                </VCol>;
            </VRow>
            <VRow>
                <VCol cols="12" md="5">
                    <VCheckbox v-model="profileformp.IndigenousGroup" label="Indigenous Group Member" hide-details
                        density="compact" :true-value="'1'" :false-value="'0'" :readonly="!isEditing" />
                </VCol>
                <VCol cols="12" md="4">
                    <VTextField v-model="profileformp.ethnic_code" label="Ethnic Group:" clearable
                        :readonly="!isEditing" @input="() => { toUpperCase('ethnic_code'); }" />
                </VCol>
                <VCol cols="12" md="3">
                    <VTextField v-model="profileformp.bloodtype_code" label="Blood Type:" clearable
                        :readonly="!isEditing" @input="() => { toUpperCase('bloodtype_code'); }" />
                </VCol>
            </VRow>

            <!-- Mother's Info -->
            <VRow>
                <VCol>
                    <VTextField v-model="profileformp.mot_fname" label="Mother’s First Name:" :readonly="!isEditing"
                        @input="() => { toUpperCase('mot_fname'); }" />
                </VCol>
                <VCol>
                    <VTextField v-model="profileformp.mot_mname" label="Mother’s Middle Name:" :readonly="!isEditing"
                        @input="() => { toUpperCase('mot_mname'); }" />
                </VCol>
            </VRow>
            <VRow>
                <VCol>
                    <VTextField v-model="profileformp.mot_lname" label="Mother’s Last Name:" :readonly="!isEditing"
                        @input="() => { toUpperCase('mot_lname'); }" />
                </VCol>
                <VCol>
                    <VTextField v-model="profileformp.mot_birthdate" label="Mother’s Birthdate:" type="date"
                        :readonly="!isEditing" />
                </VCol>
            </VRow>

            <!-- Household / Family Information -->
            <VRow>
                <VCol cols="12" md="4">
                    <VTextField v-model="profileformp.family_member_code" label="Family Member Code"
                        :readonly="!isEditing" />
                </VCol>

                <VCol cols="12" md="8">
                    <VTextField v-model="profileformp.family_member_sp" label="Family Member (Specify)"
                        :readonly="!isEditing" @input="() => { toUpperCase('family_member_sp'); }" />
                </VCol>
            </VRow>

            <VRow>
                <VCol cols="12" md="3">
                    <VCheckbox v-model="profileformp.PCB_nhts" label="PCB Eligible" hide-details density="compact"
                        :true-value="'1'" :false-value="'0'" class="ml-3" :readonly="!isEditing" />
                </VCol>
                <VCol cols="12" md="5">
                    <VCheckbox v-model="profileformp.cct_nhts" label="Pantawid Pamilya Member" hide-details
                        density="compact" :true-value="'1'" :false-value="'0'" class="ml-3" :readonly="!isEditing" />
                </VCol>
                <VCol cols="12" md="4">
                    <VCheckbox v-model="profileformp.nhts" label="DSWD 4Ps Member" hide-details density="compact"
                        :true-value="'1'" :false-value="'0'" class="ml-3" :readonly="!isEditing" />
                </VCol>
            </VRow>

            <VRow class="mt-5">
                <VCol cols="12" md="4">
                    <VTextField v-model="profileformp.hhnumber" label="4Ps Household Number" :readonly="!isEditing" />
                </VCol>
                <VCol cols="12" md="4">
                    <VTextField v-model="profileformp.fsNumber" label="Family Serial Number" :readonly="!isEditing"
                        :rules="[requiredValidator]" />
                </VCol>
                <VCol cols="12" md="4">
                    <VTextField v-model="profileformp.Patient_Type" label="Patient Type" :readonly="!isEditing"
                        @input="() => { toUpperCase('Patient_Type'); }" />
                </VCol>
            </VRow>

            <!-- Address -->
            <VRow>
                <VCol>
                    <VAutocomplete v-model="profileformp.country_code" :items="nationalityList"
                        item-title="en_short_name" item-value="num_code" label="Country:" outlined hide-details
                        clearable persistent-hint :readonly="!isEditing" />
                </VCol>
            </VRow>
            <VRow>
                <VCol>
                    <VTextField v-model="profileformp.fhNumber" label="House No./Lot/Bldg:" :readonly="!isEditing"
                        @input="() => { toUpperCase('fhNumber'); }" />
                </VCol>
                <VCol>
                    <VTextField v-model="profileformp.pat_str" label="Street:" :readonly="!isEditing"
                        @input="() => { toUpperCase('pat_str'); }" />
                </VCol>
            </VRow>
            <VRow class="mt-5">
                <VCol>
                    <VAutocomplete v-model="profileformp.regcode" :items="regionList" item-title="reg_desc"
                        item-value="reg_code" label="Region:" outlined hide-details clearable :readonly="!isEditing"
                        :rules="[requiredValidator]" />
                </VCol>
                <VCol>
                    <VAutocomplete v-model="profileformp.provcode" :items="provinceList" item-title="prov_name"
                        item-value="prov_code" label="Province:" outlined hide-details clearable :readonly="!isEditing"
                        :rules="[requiredValidator]" />
                </VCol>
            </VRow>
            <VRow>
                <VCol>
                    <VAutocomplete v-model="profileformp.citycode" :items="cityList" item-title="muni_name"
                        item-value="zipcode" label="Municipality/City:" clearable :readonly="!isEditing"
                        :rules="[requiredValidator]" />
                </VCol>
                <VCol>
                    <VAutocomplete v-model="profileformp.bgycode" :items="barangayList" item-title="brg_name"
                        item-value="brg_psgc" label="Barangay:" clearable :readonly="!isEditing"
                        :rules="[requiredValidator]" />
                </VCol>
                <VCol>
                    <VTextField type="number" v-model="profileformp.zipcode" label="ZIP Code:" :readonly="!isEditing" />
                </VCol>
            </VRow>
            <VRow>
                <VCol>
                    <VTextField v-model="profileformp.patient_address" label="Complete Address:" :readonly="!isEditing"
                        @input="() => { toUpperCase('patient_address'); }" />
                </VCol>
            </VRow>

            <!-- Contact -->
            <VRow>
                <VCol>
                    <VTextField v-model="profileformp.pat_email" label="Email Address:" :readonly="!isEditing"
                        @input="() => { toUpperCase('pat_email'); }" />
                </VCol>
                <VCol>
                    <VTextField type="number" v-model="profileformp.pat_mobile" label="Mobile Number:"
                        :readonly="!isEditing" />
                </VCol>
                <VCol>
                    <VTextField type="number" v-model="profileformp.pat_landline" label="Landline:"
                        :readonly="!isEditing" />
                </VCol>
            </VRow>

            <!-- PhilHealth Info -->
            <VRow>
                <VCol>
                    <VCheckbox v-model="profileformp.phic_member" label="PhilHealth Member" hide-details
                        density="compact" :true-value="'1'" :false-value="'0'" class="ml-3" :readonly="!isEditing" />
                </VCol>
                <VCol>
                    <VTextField v-model="profileformp.pat_philhealth" label="PhilHealth ID.:" :readonly="!isEditing" />
                </VCol>
                <VCol cols="12" md="4">
                    <VTextField v-model="profileformp.phil_sub_code" label="Philhealth Subcode"
                        :readonly="!isEditing" />
                </VCol>
            </VRow>
            <VRow>
                <VCol>
                    <VSelect v-model="profileformp.philhealth_status_code" :items="philheatlhStatusTypes"
                        label="PhilHealth Type:" item-title="title" item-value="value" variant="outlined" clearable
                        :readonly="!isEditing" />
                </VCol>
                <VCol cols="12" md="4">
                    <VSelect v-model="profileformp.type_of_membership" label="PhilHealth Category:" :items="[
                        { title: 'Direct Contributor', value: 'Direct Contributor' },
                        { title: 'Indirect Contributors', value: 'Indirect Contributors' }
                    ]" item-title="title" item-value="value" variant="outlined" clearable :readonly="!isEditing" />
                </VCol>
                <VCol cols="12" md="4">
                    <VSelect v-model="profileformp.phic_stat" label="Philhealth Status" :items="[
                        { title: 'Active', value: '1' },
                        { title: 'Inactive', value: '0' }]" item-title="title" item-value="value" variant="outlined"
                        :readonly="!isEditing" />
                </VCol>
            </VRow>
            <!-- <VRow>
                <VCol>
                    <VCheckbox v-model="sameAsPatient" label="Member Name as Patient Name" density="compact"
                        @change="applyPatientName" :readonly="!isEditing" />
                </VCol>
            </VRow> -->

            <div v-if="profileformp.philhealth_status_code === 'X'" class="mt-3 mb-1" style="color:#1976d2">If
                Dependent:
            </div>
            <VRow v-if="profileformp.philhealth_status_code === 'X'">
                <VCol>
                    <VRow>
                        <VCol cols="12" md="6">
                            <VSelect v-model="profileformp.pDependentType_code" :items="relationshipToMember"
                                label="Relationship to Member:" item-title="text" item-value="code" variant="outlined"
                                clearable :readonly="!isEditing" />
                        </VCol>
                        <VCol cols="12" md="6">
                            <VTextField v-model="profileformp.pMemberFname" label="Member First Name:"
                                :readonly="!isEditing" @input="() => { toUpperCase('pMemberFname'); }" />
                        </VCol>
                    </VRow>
                    <VRow>
                        <VCol cols="12" md="">
                            <VTextField v-model="profileformp.pMemberMname" label="Member Middle Name:"
                                :readonly="!isEditing" @input="() => { toUpperCase('pMemberMname'); }" />
                        </VCol>
                        <VCol cols="12" md="6">
                            <VTextField v-model="profileformp.pMemberLname" label="Member Last Name:"
                                :readonly="!isEditing" @input="() => { toUpperCase('pMemberLname'); }" />
                        </VCol>
                    </VRow>
                    <VRow v-if="profileformp.philhealth_status_code === 'X'">
                        <VCol cols="12" md="6">
                            <VTextField type="date" v-model="profileformp.pMemberBdate" label="Member Birth Date:"
                                :readonly="!isEditing" />
                        </VCol>
                        <VCol>
                            <VTextField v-model="profileformp.pMemberSuffix" label="Member Suffix"
                                :readonly="!isEditing" @input="() => { toUpperCase('pMemberSuffix'); }" />
                        </VCol>
                        <VCol>
                            <VSelect v-model="profileformp.pMemberSex" label="Member Sex" :items="[
                                { title: 'Male', value: '0' },
                                { title: 'Female', value: '1' }]" />
                        </VCol>
                    </VRow>
                </VCol>
            </VRow>
            <VRow>
                <VCol>
                    <VTextField type="date" v-model="profileformp.PHIEsubmitted_date" label="PHIE Submit Date:"
                        :readonly="!isEditing" />
                </VCol>
                <VCol class="d-flex">
                    <VCheckbox v-model="profileformp.validated" label="Validated" hide-details density="compact"
                        :true-value="'1'" :false-value="'0'" :readonly="!isEditing" />
                    <VCheckbox v-model="profileformp.PHIESYNC" label="Synced" hide-details density="compact"
                        :true-value="'1'" :false-value="'0'" class="ml-3" :readonly="!isEditing" />
                </VCol>
            </VRow>
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
            <VRow>
            </VRow>
        </VCol>
    </VForm>
</template>
