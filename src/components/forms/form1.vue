<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
// import { useUser } from '@/composables/useUser';
import { axiosIns } from '@/plugins/axios';
import { ref } from "vue";
import { VForm } from 'vuetify/components/VForm';
import { VCol, VRow, VTextarea, VTextField } from "vuetify/lib/components/index.mjs";

// const { user } = useUser();
const { isError, errorMessage, isSuccess, successMessage } = cStatus();

// const isLoading = ref(false)

// Props — so this form can be reused for different calls
const props = defineProps({
  consultId: {
    type: Number,
    required: false,
  },
});

const philheatlhStatusTypes = [
  // Dependents / Others
  { title: "Member", value: "1" },
  { title: "Dependent", value: "0" },
];

const civilStatusOptions = [
  { title: 'Single', value: '0' },
  { title: 'Married', value: '1' },
  { title: 'Widowed', value: '2' },
  { title: 'Separated', value: '3' },
  { title: 'Divorced', value: '4' },
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

const religions = [
  { code: 'AGLIP', text: 'AGLIPAY' },
  { code: 'ALLY', text: 'ALLIANCE OF BIBLE CHRISTIAN COMMUNITIES' },
  { code: 'ANGLI', text: 'ANGLICAN' },
  { code: 'BAPTI', text: 'BAPTIST' },
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

const meeting = ref({
  // savedID: props.consultId,
  facID: null,
  meetID: null,
  name_physician: null,
  name_physician2: null,
  date_meeting: null,
  from_time: null,
  datetimemeet: null,
  facility_full_address: null,
  tele_partner_platform: null,
  prior_tele_proper: null,
  is_patient_accompanied: null,
  case_no: null,
  phic_status: null,
  phic_id: null,
  fname: null,
  mname: null,
  lname: null,
  phone_no: null,
  dob: null,
  sex: null,
  civil_status: null,
  name_of_companion: null,
  relationship: null,
  religion: null,
  edu_attain: null,
  occupation: null,
  monthly_income: null,
  id_type: null,
  id_type_no: null,
  nationality_id: null,
  house_no: null,
  street: null,
  region: null,
  province: null,
  muni_name: null,
  brgy: null,
  patientfulladd: null,
  pbrgyname: null,
  pmuniname: null,
  pprov: null,
});

const emit = defineEmits(['loaded'])

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

//save/update
const demProf = ref(null)

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
    const name_physician2 = [doclname ? `${doclname},` : '', docfname || '', docmname || '']
      .filter(Boolean)
      .join(' ')
      .trim();

    // --- Meeting time ---
    let datetimemeet = null;
    if (data.date_meeting && data.from_time) {
      const date = data.date_meeting;
      const time = data.from_time.slice(0, 5);
      datetimemeet = `${date}T${time}`;
    }

    // --- Facility address ---
    const facname = data.FacName ?? null;
    const brg_name = data.brgyname ?? null;
    const muni_name = data.muniname ?? null;
    const prov_name = data.provname ?? null;
    const reg_desc = data.regname ?? null;

    const facility_full_address = [facname, brg_name, muni_name, prov_name, reg_desc]
      .filter(Boolean)
      .join(', ');

    // --- Patient address ---
    const house_no = data.hhnumber ?? null;
    const street = data.pat_str ?? null;
    const pbrgyname = data.bgycode ?? null;
    const pmuniname = data.citycode ?? null;
    const pprov = data.provcode ?? null;
    const region = data.regcode ?? null;


    const pfabrgyname = data.pbrgyname ?? null;
    const pfamuniname = data.pmuniname ?? null;
    const pfaprov = data.pprov ?? null;

    const patientfulladd = [house_no, street, pfabrgyname, pfamuniname, pfaprov, region ? `Region ${region}` : null]
      .filter(Boolean)
      .join(', ');

    // Populate meeting data (defaults to null if missing)
    meeting.value = {
      facID: data.facID ?? null,
      meetID: data.meetID ?? null,
      name_physician,
      name_physician2,
      date_meeting: data.date_meeting ?? null,
      from_time: data.from_time ?? null,
      datetimemeet,
      facility_full_address,
      tele_partner_platform: null,
      prior_tele_proper: null,
      is_patient_accompanied: null,
      case_no: data.meetID ?? null,
      phic_status: data.philhealth_status_code ?? null,
      phic_id: data.pat_philhealth ?? null,
      fname: data.pat_fname ?? null,
      mname: data.pat_mname ?? null,
      lname: data.pat_lname ?? null,
      phone_no: data.pat_mobile ?? null,
      dob: data.pat_birthDate ?? null,
      sex: data.sex_code ?? null,
      civil_status: data.civil_stat_code ?? null,
      religion: data.religion_code ?? null,
      edu_attain: data.educattainment ?? null,
      occupation: data.occupation_sp ?? null,
      monthly_income: data.monthly_income ?? null,
      id_type: data.id_type ?? null,
      id_type_no: data.id_type_no ?? null,
      nationality_id: data.nationality ?? null,
      house_no: house_no ?? null,
      street: street ?? null,
      region: region ?? null,
      pbrgyname,
      pmuniname,
      pprov,
      province: prov_name ?? null,
      muni_name: muni_name ?? null,
      brgy: brg_name ?? null,
      patientfulladd,
      name_of_companion: null,
      relationship: null,
    };

    console.log("✅ Meeting info fetched:", meeting.value);

    // 🔹 Step 3: Try to fetch existing Demographic Profile
    if (meeting.value.meetID) {
      const dpResponse = await axiosIns.get(`/api/get-demoprofile/${meeting.value.meetID}`);
      const dp = dpResponse.data.data;

      if (dp) {
        console.log("✅ Existing demographic profile found:", dp);

        // Merge existing DP data into meeting.value
        meeting.value.tele_partner_platform = dp.tele_partner_platform ?? null;
        meeting.value.prior_tele_proper = dp.prior_tele_proper ?? null;
        meeting.value.is_patient_accompanied = dp.is_patient_accompanied ?? null;
        meeting.value.case_no = dp.case_no ?? null;
        meeting.value.name_of_companion = dp.name_of_companion ?? null;
        meeting.value.relationship = dp.relationship ?? null;
        meeting.value.phone_no = dp.phone_no ?? meeting.value.phone_no;
      } else {
        console.log("ℹ️ No demographic profile found for this meeting ID.");
      }
    }

  } catch (error) {
    console.error("❌ Error fetching meeting info or DP:", error);
    errorMessage.value = "Failed to load meeting info.";
    isError.value = true;
  } finally {
    emit('loaded');
  }
}

onMounted(() => {
  if (props.consultId) fetchMeetingInfo(props.consultId);
  fetchCountries();
  fetchRegions();
  fetchCities();
  fetchBarangay();
  fetchProvince();

});

async function saveUpdateDP() {
  try {
    // Ensure form validation
    const { valid } = await demProf.value.validate();

    if (!valid) {
      errorMessage.value = "Please fill in all required fields correctly.";
      isError.value = true;
      return;
    }

    // ✅ Prepare payload using all meeting data
    const payload = {
      meeting_id: meeting.value.meetID,
      name_physician: meeting.value.name_physician2,
      address_health: meeting.value.facility_full_address,
      tele_partner_platform: meeting.value.tele_partner_platform,
      prior_tele_proper: meeting.value.prior_tele_proper,
      is_patient_accompanied: meeting.value.is_patient_accompanied,
      case_no: meeting.value.case_no,
      name_of_companion: meeting.value.name_of_companion,
      relationship: meeting.value.relationship,
      phone_no: meeting.value.phone_no,

    };

    console.log("Payload being sent:", payload);
    // Send request
    const response = await axiosIns.post('/api/save-demoprofile', payload);

    // Success response handling
    successMessage.value = "Saved demographic profile.";
    isSuccess.value = true;
    cancelEdit();

  } catch (error) {
    console.error("Error Saving Demographic Profile:", error);
    errorMessage.value = "Failed to save demographic profile.";
    isError.value = true;

  }
}

const requiredValidator = (v) => !!v || 'This field is required';

const isEditing = ref(false);

function cancelEdit() {
  isEditing.value = false;
}

</script>
<template>
  <VForm ref="demProf" style="align-self: stretch; width: 100%;">
    <VTooltip v-if="isEditing == true" text="Save" location="top">
      <template #activator="{ props }">
        <VBtn v-bind="props" variant="tonal" color="success" icon="tabler-device-floppy" size="48"
          class="fab-fixed-botr" @click="saveUpdateDP" />
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
    <div class="d-flex flex-column justify-center">
    </div>
    <br></br>

    <VRow>
      <VCol cols="12" md="6">
        <VTextField v-model="meeting.name_physician" outlined dense hide-details label="Name of physician:"
          :rules="[requiredValidator]" :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
      <VCol cols="12" md="6" class="centered-col">
        <VTextField type="datetime-local" v-model="meeting.datetimemeet" outlined dense hide-details
          label="Date and Time of Teleconsultation" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea auto-grow rows="2" v-model="meeting.facility_full_address" outlined dense hide-details
          label="Name and Address of Health Facility (if applicable):" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol cols="12" md="6" class="centered-col">
        <VTextField v-model="meeting.tele_partner_platform" label="Name of Telemedicine Partner (if applicable):"
          outlined dense hint="If none, Indicate telemedicine platform being used:"
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow class="align-center">
      <VCol>
        <VRadioGroup v-model="meeting.prior_tele_proper"
          label="Prior to teleconsultation proper, obtain patient consent:" inline :rules="[
            v => v === 0 || v === 1 ? true : 'This field is required']" :class="{ 'custom-disabled': !isEditing }">
          <VRadio label="Yes" :value="1" />
          <VRadio label="No" :value="0" />
        </VRadioGroup>
      </VCol>
    </VRow>
    <VRow class="align-center">
      <VCol>
        <VRadioGroup v-model="meeting.is_patient_accompanied"
          label="Is patient accompanied/assisted by another person during the consultation: " inline :rules="[
            v => v === 0 || v === 1 ? true : 'This field is required']" :class="{ 'custom-disabled': !isEditing }">
          <VRadio label="Yes" :value="1" />
          <VRadio label="No" :value="0" />
        </VRadioGroup>
      </VCol>
    </VRow>
    <VRow class="align-center">
      <VCol>
        <h5 class="text-h5 font-weight-medium mb-2">Patient Profile</h5>
      </VCol>
      <VCol inline>
        <div class="d-flex align-center">
          <label class="mr-2">Case #:</label>
          <VTextField v-model="meeting.case_no" outlined dense hide-details disabled :rules="[requiredValidator]"
            :class="{ 'custom-disabled': !isEditing }" />
        </div>
      </VCol>
    </VRow>
    <VRow class="align-center">
      <VCol>
        <VSelect v-model="meeting.phic_status" :items="philheatlhStatusTypes" label="PhilHealth Type:"
          item-title="title" item-value="value" variant="outlined" clearable :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
      <VCol>
        <VTextField v-model="meeting.phic_id" outlined dense hide-details label="PhilHealth ID:" disabled />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="meeting.fname" outlined dense hide-details label="First Name: "
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
      <VCol>
        <VTextField v-model="meeting.mname" outlined dense hide-details label="Middle Name: "
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="meeting.lname" outlined dense hide-details label="Last Name: "
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
      <VCol>
        <VTextField v-model="meeting.phone_no" outlined dense hide-details label="Contact Number: "
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="meeting.dob" type="date" outlined dense hide-details label="Birth Date: "
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
      <VCol>
        <VSelect v-model="meeting.sex" :items="['Male', 'Female']" label="Sex:" outlined dense hide-details
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VSelect v-model="meeting.civil_status" :items="civilStatusOptions" label="Civil Status:" item-title="title"
          item-value="value" variant="outlined" clearable :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
      <VCol>
        <VAutocomplete v-model="meeting.religion" :items="religions" label="Religion:" item-title="text"
          item-value="code" clearable autocomplete :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <!-- Show only when Married or Divorced -->
    <VRow v-if="['Married', 'Divorced', 'Separated'].includes(meeting.civil_status)">
      <VCol>
        <VTextField v-model="meeting.relationship" outlined dense hide-details label="Relationship"
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
      <!-- Show only when Married or Divorced -->
      <VCol>
        <VTextField v-model="meeting.name_of_companion" outlined dense hide-details label="Name of Companion"
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VSelect v-model="meeting.edu_attain" :items="educationalAttainments" label="Educational Attainment:"
          item-title="text" item-value="code" clearable :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
      <VCol>
        <VTextField v-model="meeting.occupation" outlined dense hide-details label="Occupation: "
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="meeting.monthly_income" outlined dense hide-details label="Monthly Income: "
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
      <VCol>
        <VSelect v-model="meeting.id_type" :items="[
          'NOT APPLICABLE',
          'UMID',
          'DRIVERS LICENSE',
          'PASSPORT ID',
          'POSTAL ID',
          'TIN ID',
        ]" label="Select ID: " outlined dense hide-details :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="meeting.id_type_no" outlined dense hide-details label="CRN: "
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
      <VCol>
        <VAutocomplete v-model="meeting.nationality_id" :items="nationalityList" item-title="nationality"
          item-value="num_code" label="Nationality:" outlined hide-details clearable persistent-hint
          :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="meeting.house_no" outlined dense hide-details label="House no./Lot/Bldg: "
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
      <VCol>
        <VTextField v-model="meeting.street" outlined dense hide-details label="Street: "
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VAutocomplete v-model="meeting.region" :items="regionList" item-title="reg_desc" item-value="reg_code"
          label="Region:" outlined hide-details clearable :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }" :rules="[requiredValidator]" />
      </VCol>
      <VCol>
        <VAutocomplete v-model="meeting.pprov" :items="provinceList" item-title="prov_name" item-value="prov_code"
          label="Province:" outlined hide-details clearable :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }" :rules="[requiredValidator]" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VAutocomplete v-model="meeting.pmuniname" :items="cityList" item-title="muni_name" item-value="zipcode"
          label="Municipality/City:" clearable :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }"
          :rules="[requiredValidator]" />
      </VCol>
      <VCol>
        <VAutocomplete v-model="meeting.pbrgyname" :items="barangayList" item-title="brg_name" item-value="brg_psgc"
          label="Barangay:" clearable :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <label>Complete Address :</label>
        <VTextarea v-model="meeting.patientfulladd" row="2" outlined :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
  </VForm>
</template>
