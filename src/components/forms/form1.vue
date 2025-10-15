<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
// import { useUser } from '@/composables/useUser';
import { axiosIns } from '@/plugins/axios';
import { ref } from "vue";
import { VForm } from 'vuetify/components/VForm';
import { VCol, VRow, VTextarea, VTextField } from "vuetify/lib/components/index.mjs";

// const { user } = useUser();
const { isError, errorMessage, isSuccess, successMessage } = cStatus();

// console.log(user.value);

// Props — so this form can be reused for different calls
const props = defineProps({
  consultId: {
    type: Number,
    required: false,
  },
});

const meeting = ref({
  // savedID: props.consultId,
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

// const meeting = ref<any>(null);

//save/update
const demProf = ref(null)

async function fetchMeetingInfo(meetId) {
  try {
    // Fetch meeting info
    const response = await axiosIns.get(`/api/admin-patient-meeting-info`, {
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
    const house_no = data.house_no ?? null;
    const street = data.street ?? null;
    const pbrgyname = data.pbrgyname ?? null;
    const pmuniname = data.pmuniname ?? null;
    const pprov = data.pprov ?? null;
    const region = data.region ?? null;

    const patientfulladd = [house_no, street, pbrgyname, pmuniname, pprov, region ? `Region ${region}` : null]
      .filter(Boolean)
      .join(', ');

    // Populate meeting data (defaults to null if missing)
    meeting.value = {
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
      phic_status: data.phic_status ?? null,
      phic_id: data.phic_id ?? null,
      fname: data.fname ?? null,
      mname: data.mname ?? null,
      lname: data.lname ?? null,
      phone_no: data.contact ?? null,
      dob: data.dob ?? null,
      sex: data.sex ?? null,
      civil_status: data.civil_status ?? null,
      religion: data.religion ?? null,
      edu_attain: data.edu_attain ?? null,
      occupation: data.occupation ?? null,
      monthly_income: data.monthly_income ?? null,
      id_type: data.id_type ?? null,
      id_type_no: data.id_type_no ?? null,
      nationality_id: data.nationality_id ?? null,
      house_no,
      street,
      region,
      pbrgyname,
      pmuniname,
      pprov,
      province: data.province ?? null,
      muni_name: pmuniname ?? null,
      brgy: data.brgy ?? null,
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
  }
}


onMounted(() => {
  if (props.consultId) fetchMeetingInfo(props.consultId);
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

  } catch (error) {
    console.error("Error Saving Demographic Profile:", error);
    errorMessage.value = "Failed to save demographic profile.";
    isError.value = true;

  }
}
</script>
<template>
  <VForm ref="demProf">
    <VBtn variant="tonal" color="success" icon="tabler-device-floppy" size="48" @click="saveUpdateDP"
      class="fab-fixed-top">
    </VBtn>
    <div class="d-flex flex-column justify-center">
    </div>
    <br></br>
    <h5>
      <pre>{{ meeting }}</pre>
    </h5>

    <VRow>
      <VCol cols="12" md="6">
        <VTextField v-model="meeting.name_physician" outlined dense hide-details label="Name of physician:" />
      </VCol>
      <VCol cols="12" md="6" class="centered-col">
        <VTextField type="datetime-local" v-model="meeting.datetimemeet" outlined dense hide-details
          label="Date and Time of Teleconsultation" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea auto-grow rows="2" v-model="meeting.facility_full_address" outlined dense hide-details
          label="Name and Address of Health Facility (if applicable):" />
      </VCol>
    </VRow>
    <VRow>
      <VCol cols="12" md="6" class="centered-col">
        <VTextField v-model="meeting.tele_partner_platform" label="Name of Telemedicine Partner (if applicable):"
          outlined dense hint="If none, Indicate telemedicine platform being used:" />
      </VCol>
    </VRow>
    <VRow class="align-center">
      <VCol>
        <VRadioGroup v-model="meeting.prior_tele_proper"
          label="Prior to teleconsultation proper, obtain patient consent:" inline>
          <VRadio label="Yes" :value="1" />
          <VRadio label="No" :value="0" />
        </VRadioGroup>
      </VCol>
    </VRow>
    <VRow class="align-center">
      <VCol>
        <VRadioGroup v-model="meeting.is_patient_accompanied"
          label="Is patient accompanied/assisted by another person during the consultation: " inline>
          <VRadio label="Yes" :value="1" />
          <VRadio label="No" :value="2" />
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
          <VTextField v-model="meeting.case_no" outlined dense hide-details style="max-width: 200px" />
        </div>
      </VCol>
    </VRow>
    <VRow class="align-center">
      <VCol>
        <VSelect v-model="meeting.phic_status" :items="['Member', 'Dependent', 'None']" label="PhilHealth Status:"
          outlined dense hide-details />
      </VCol>
      <VCol>
        <VTextField v-model="meeting.phic_id" outlined dense hide-details label="PhilHealth ID:" disabled />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="meeting.fname" outlined dense hide-details label="First Name: " />
      </VCol>
      <VCol>
        <VTextField v-model="meeting.mname" outlined dense hide-details label="Middle Name: " />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="meeting.lname" outlined dense hide-details label="Last Name: " />
      </VCol>
      <VCol>
        <VTextField v-model="meeting.phone_no" outlined dense hide-details label="Contact Number: " />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="meeting.dob" type="date" outlined dense hide-details label="Birth Date: " />
      </VCol>
      <VCol>
        <VSelect v-model="meeting.sex" :items="['Male', 'Female']" label="Sex:" outlined dense hide-details />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VSelect v-model="meeting.civil_status" :items="['Single', 'Married', 'Divorced', 'Separated']"
          label="Civil Status:" outlined dense hide-details />
      </VCol>
      <VCol>
        <VTextField v-model="meeting.religion" outlined dense hide-details label="Religion:" />
      </VCol>
    </VRow>
    <!-- Show only when Married or Divorced -->
    <VRow v-if="['Married', 'Divorced', 'Separated'].includes(meeting.civil_status)">
      <VCol>
        <VTextField v-model="meeting.relationship" outlined dense hide-details label="Relationship" />
      </VCol>
      <!-- Show only when Married or Divorced -->
      <VCol>
        <VTextField v-model="meeting.name_of_companion" outlined dense hide-details label="Name of Companion" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VSelect v-model="meeting.edu_attain" :items="[
          'NOT APPLICABLE',
          'COLLEGE',
          'ELEMENTARY EDUCATION',
          'HIGH SCHOOL EDUCATION',
          'NO FORMAL EDUCATION',
          'POSTGRADUATE PROGRAM',
          'VOCATIONAL',
        ]" label="Educational Attainment: " outlined dense hide-details />
      </VCol>
      <VCol>
        <VTextField v-model="meeting.occupation" outlined dense hide-details label="Occupation: " />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="meeting.monthly_income" outlined dense hide-details label="Monthly Income: " />
      </VCol>
      <VCol>
        <VSelect v-model="meeting.id_type" :items="[
          'NOT APPLICABLE',
          'UMID',
          'DRIVERS LICENSE',
          'PASSPORT ID',
          'POSTAL ID',
          'TIN ID',
        ]" label="Select ID: " outlined dense hide-details />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="meeting.id_type_no" outlined dense hide-details label="CRN: " />
      </VCol>
      <VCol>
        <VSelect v-model="meeting.nationality_id" :items="['Filipino', 'others']" label="Nationality: " outlined dense
          hide-details />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="meeting.house_no" outlined dense hide-details label="House no./Lot/Bldg: " />
      </VCol>
      <VCol>
        <VTextField v-model="meeting.street" outlined dense hide-details label="Street: " />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="meeting.region" outlined dense hide-details label="Region: " />
      </VCol>
      <VCol>
        <VSelect v-model="meeting.pprov" :items="['SOUTH COTABATO', 'others']" label="Province: " outlined dense
          hide-details />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VSelect v-model="meeting.pmuniname" :items="['KORONADAL', 'others']" label="Municipality: " outlined dense
          hide-details />
      </VCol>
      <VCol>
        <VSelect v-model="meeting.pbrgyname" :items="['PARAISO', 'others']" label="Barangay: " outlined dense
          hide-details />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <label>Complete Address :</label>
        <VTextarea v-model="meeting.patientfulladd" row="2" outlined />
      </VCol>
    </VRow>
  </VForm>
</template>
