<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import { useDirtyTracker } from '@/composables/useFormSync';
import { axiosIns } from '@/plugins/axios';
import { computed, onMounted, ref } from "vue";
import { VForm } from 'vuetify/components/VForm';
import { VCol, VRow, VTextarea, VTextField } from "vuetify/lib/components/index.mjs";

const { isError, errorMessage, isSuccess, successMessage } = cStatus();

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

// Dirtiness is tracked on the payload shape rather than on `meeting`, because this
// form renames fields on the way out (meetID -> meeting_id, name_physician2 ->
// name_physician, and so on) and only those columns actually exist in the table.
const dpPayload = computed(() => ({
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
}))

const dpTracker = useDirtyTracker(dpPayload, ['meeting_id'])

const isEditing = ref(false);

// Doctors (the accepting side) can read the requester's copy of this form, read only.
const myRole = ref<string | null>(null);
const canEdit = ref(true); // false: a doctor reading a consultation they are not part of

// Doctors can switch between the doctor's form and the RHU's. The RHU's is always read only.
const viewing = ref<'mine' | 'rhu'>('mine');
const baseMeeting = ref<Record<string, any>>({}); // patient data only, before any saved form values
const otherDp = ref<Record<string, any> | null>(null);

async function fetchCountries() {
  try {
    const response = await axiosIns.get('/api/tele/countries');
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
  demoprofile_id: null,
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
  type_of_membership: null,
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

const patientfulladd = computed({
  get() {
    const regionName = regionList.value.find(r => r.reg_code === meeting.value.region)?.reg_desc ?? '';
    const provinceName = provinceList.value.find(p => p.prov_code === meeting.value.pprov)?.prov_name ?? '';
    const cityName = cityList.value.find(c => c.zipcode === meeting.value.pmuniname)?.muni_name ?? '';
    let barangayName = barangayList.value.find(b => b.brg_psgc === meeting.value.pbrgyname)?.brg_name ?? '';

    if (barangayName && !/^barangay\s+/i.test(barangayName)) {
      barangayName = 'BARANGAY ' + barangayName;
    }

    return [
      meeting.value.house_no,
      meeting.value.street,
      barangayName,
      cityName,
      provinceName,
      regionName,
    ]
      .filter(Boolean)
      .join(', ');
  },
  set(value: string) {
    meeting.value.patientfulladd = value;
  },
});

const emit = defineEmits(['loaded'])

// barangay list
const barangayList = ref([]);

async function fetchBarangay() {
  try {
    const response = await axiosIns.get('/api/tele/barangays');
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

async function fetchRegions() {
  try {
    const response = await axiosIns.get('/api/tele/regions');
    regionList.value = response.data.data.sort((a, b) => a.reg_desc.localeCompare(b.reg_desc));
  } catch (error) {
    console.error('Error fetching regions:', error);
  }
}

// city list
const cityList = ref([]);

async function fetchCities() {
  try {
    const response = await axiosIns.get('/api/tele/cities');
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

async function fetchProvince() {
  try {
    const response = await axiosIns.get('/api/tele/provinces');
    provinceList.value = response.data.data.sort((a, b) => a.prov_name.localeCompare(b.prov_name));
  } catch (error) {
    console.error('Error fetching provinces:', error);
  }
}

const demProf = ref(null)

/**
 * Maps a patient record (from tbl_master_patient via /api/patients/{id}) into meeting.
 * Used as the baseline — DP values will overwrite these only when non-null.
 */
function applyPatientProfile(pat: Record<string, any>) {
  Object.assign(meeting.value, {
    fname: pat.pat_fname ?? null,
    mname: pat.pat_mname ?? null,
    lname: pat.pat_lname ?? null,
    phone_no: pat.pat_mobile ?? null,
    dob: pat.pat_birthDate ?? null,
    sex: pat.sex_code ?? null,
    civil_status: pat.civil_stat_code ?? null,
    religion: pat.religion_code ?? null,
    edu_attain: pat.educattainment ?? null,
    occupation: pat.occupation_sp ?? null,
    monthly_income: pat.monthly_income ?? null,
    phic_id: pat.pat_philhealth ?? null,
    type_of_membership: pat.type_of_membership ?? null,
    nationality_id: pat.nationality ? pat.nationality.toString() : null,
    house_no: pat.fhNumber ?? null,
    street: pat.pat_str ?? null,
    region: pat.regcode ? pat.regcode.toString() : null,
    pprov: pat.provcode ? pat.provcode.toString() : null,
    pmuniname: pat.citycode ? pat.citycode.toString() : null,
    pbrgyname: pat.bgycode ? pat.bgycode.toString() : null,
    id_type: pat.id_type ?? null,
    id_type_no: pat.id_type_no ?? null,
  });
}

// Copies the saved values of a demographic profile row onto the form. Only non-empty
// values overwrite, so the patient data underneath stays wherever nothing was saved.
function applyDp(dp: Record<string, any>) {
  const dpFieldMap: Record<string, string> = {
    name_physician: 'name_physician',
    address_health: 'facility_full_address',
    tele_partner_platform: 'tele_partner_platform',
    prior_tele_proper: 'prior_tele_proper',
    is_patient_accompanied: 'is_patient_accompanied',
    case_no: 'case_no',
    name_of_companion: 'name_of_companion',
    relationship: 'relationship',
    phone_no: 'phone_no',
  };

  for (const [dpKey, meetKey] of Object.entries(dpFieldMap)) {
    const val = dp[dpKey];
    if (val !== null && val !== undefined && val !== '') {
      meeting.value[meetKey] = val;
    }
  }
}

async function fetchMeetingInfo(meetId: number) {
  try {
    viewing.value = 'mine';

    /* ── 1. Meeting meta (doctor, meeting dates, case_no, DP, patient_id) ── */
    const meetResp = await axiosIns.get('/api/meeting-infoV2', {
      params: { meet_id: meetId },
    });

    // ✅ Fix 2: guard both flat and nested response shapes
    const data = meetResp.data?.data ?? meetResp.data ?? {};

    console.log('🔍 RAW meeting data:', JSON.stringify(data)); // remove after confirming

    /* ── 2. Doctor ── */
    const doc = data.doctor ?? {};
    const docmname = doc.mname ? `${doc.mname.charAt(0)}.` : null;

    meeting.value.name_physician = [doc.fname, docmname, doc.lname].filter(Boolean).join(' ');
    meeting.value.name_physician2 = [doc.lname ? `${doc.lname},` : null, doc.fname, docmname].filter(Boolean).join(' ');
    meeting.value.facility_full_address = doc.address ?? null;

    /* ── 3. Meeting identifiers ── */
    meeting.value.meetID = data.meetID ?? null;
    meeting.value.facID = data.facID ?? null;
    meeting.value.case_no = data.case_no ?? null;
    meeting.value.datetimemeet = data.datetimemeet ?? null;

    /* ── 4. Patient profile ── */
    const patientId = data.patient?.id ?? null;

    if (patientId) {
      try {
        const patResp = await axiosIns.get(`/api/patients/${patientId}`);
        const pat = patResp.data?.data ?? patResp.data ?? {};
        applyPatientProfile(pat);
        console.log('✅ Patient loaded from /api/patients/:id', pat);
      } catch (patErr) {
        console.warn('⚠️ /api/patients/:id failed, falling back to meeting patient data', patErr);
        applyPatientProfile(data.patient ?? {});
      }
    } else {
      console.warn('⚠️ No patient_id in meeting response, using embedded patient data');
      applyPatientProfile(data.patient ?? {});
    }

    // Patient data before any saved form values, used as the base of the RHU's view.
    baseMeeting.value = { ...meeting.value };

    /* ── 5. Demographic Profile — overlay only non-null DP values on top ── */
    const dp = data.demographic_profile ?? null;
    myRole.value = data.my_role ?? null;
    canEdit.value = data.can_edit ?? true;
    otherDp.value = data.other?.demographic_profile ?? null;

    if (dp) {
      meeting.value.demoprofile_id = dp.id ?? null;

      applyDp(dp);
    } else {
      meeting.value.demoprofile_id = null;
      console.log('ℹ️ No DP record found — patient profile data used as baseline');
    }

    /* ── 6. Snapshot for cancel/restore ── */
    originalMeeting.value = { ...meeting.value };
    // Baseline for working out what is dirty on the next save.
    // setRecordExists decides whether the next save can narrow to changed fields,
    // or must send everything to satisfy the table's NOT NULL columns on INSERT.
    dpTracker.setRecordExists(!!dp);
    dpTracker.markClean();

  } catch (error) {
    console.error('❌ Error fetching meeting info:', error);
    errorMessage.value = 'Failed to load meeting info.';
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
    if (viewing.value !== 'mine' || !canEdit.value)
      return;

    const { valid } = await demProf.value.validate();

    if (!valid) {
      errorMessage.value = "Please fill in all required fields correctly.";
      isError.value = true;
      return;
    }

    // Only the changed columns, so this save cannot overwrite fields the other
    // participant edited from our own stale copy.
    const changed = dpTracker.dirty();

    if (Object.keys(changed).length) {
      await axiosIns.post('/api/save-demoprofile', {
        meeting_id: meeting.value.meetID,
        ...changed,
      });
      // The row is there now, so later saves can narrow to what changed.
      dpTracker.setRecordExists(true);
      dpTracker.markClean();
    }

    // Reload this user's own form so the screen shows what the server stored. That
    // also resets the restore point, so cancelEdit() below can't bring back the
    // pre-edit values. Only this user's form reloads; the other side is untouched.
    if (props.consultId)
      await fetchMeetingInfo(props.consultId)
    else
      originalMeeting.value = { ...meeting.value }

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

const originalMeeting = ref({});

function cancelEdit() {
  Object.assign(meeting.value, originalMeeting.value);
  isEditing.value = false;
}

// Switching only happens while not editing (the toggle is disabled otherwise), so no
// unsaved typing is lost. The RHU's view can never be edited or saved.
function showMyForm() {
  Object.assign(meeting.value, originalMeeting.value);
}

function showRhuForm() {
  isEditing.value = false;
  Object.assign(meeting.value, baseMeeting.value);
  if (otherDp.value)
    applyDp(otherDp.value);
}

function onViewChange(view: 'mine' | 'rhu') {
  if (view === 'rhu')
    showRhuForm();
  else
    showMyForm();
}

// Reloads everything from the server and stays on the requester's form, so a doctor can
// pick up what the requester saved since the page loaded. Nothing is pushed to the page
// any more, so this is how the requester's form is brought up to date.
const refreshing = ref(false);

async function refreshRhuForm() {
  if (!props.consultId)
    return;

  refreshing.value = true;
  try {
    await fetchMeetingInfo(props.consultId); // also puts the view back on the doctor's form
    viewing.value = 'rhu';
    showRhuForm();
  }
  finally {
    refreshing.value = false;
  }
}

const confirmReplace = ref(false);

function isEmpty(value: unknown) {
  return value === null || value === undefined || value === '';
}

// What the doctor can take from the requester. Not copied: the physician name and the
// facility address (they identify whoever fills the form in) and the case number.
const COPY_FIELDS = [
  'tele_partner_platform',
  'prior_tele_proper',
  'is_patient_accompanied',
  'name_of_companion',
  'relationship',
  'phone_no',
];

// Copies the requester's answers into the doctor's own form and leaves it open for
// editing. Nothing is saved until the doctor presses Save, and Cancel restores the
// saved values. overwrite=false only fills fields that are still empty.
function copyToMine(overwrite: boolean) {
  confirmReplace.value = false;
  if (!canEdit.value || !otherDp.value)
    return;

  viewing.value = 'mine';
  showMyForm();

  let copied = 0;
  for (const key of COPY_FIELDS) {
    const from = otherDp.value[key] ?? null;
    const take = overwrite ? meeting.value[key] !== from : !isEmpty(from) && isEmpty(meeting.value[key]);

    if (take) {
      meeting.value[key] = from;
      copied++;
    }
  }

  if (copied)
    isEditing.value = true;

  successMessage.value = copied
    ? `Copied ${copied} field(s). Review them, then press Save.`
    : 'Nothing to copy: your form already has those answers.';
  isSuccess.value = true;
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
    <VTooltip v-if="canEdit && viewing === 'mine' && isEditing == false" text="Edit" location="top">
      <template #activator="{ props }">
        <VBtn v-bind="props" variant="tonal" color="success" icon="tabler-edit" size="48" class="fab-fixed-botr" rounded
          @click="isEditing = true" />
      </template>
    </VTooltip>
    <div class="d-flex flex-column justify-center">
    </div>
    <br></br>

    <!-- Doctors can switch to the requester's form. It is read only. -->
    <VRow v-if="myRole === 'accepter'">
      <VCol cols="12">
        <VBtnToggle v-model="viewing" mandatory divided color="primary" class="w-100 mb-4"
          :disabled="isEditing" @update:model-value="onViewChange">
          <VBtn value="mine" class="flex-grow-1">Accepter form</VBtn>
          <VBtn value="rhu" class="flex-grow-1">Requester form</VBtn>
        </VBtnToggle>
      </VCol>
    </VRow>
      <VAlert
      v-if="viewing === 'rhu'"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      <div class="d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-2">
        <!-- Message -->
        <div class="text-body-2">
          You are viewing the requester's form. It is read only.
          <span v-if="!otherDp">The requester has not filled it in yet.</span>
        </div>

        <!-- Actions -->
        <div class="d-flex align-center flex-wrap ga-2 flex-shrink-0">
          <VMenu v-if="canEdit && otherDp">
            <template #activator="{ props }">
              <VBtn
                v-bind="props"
                size="small"
                variant="tonal"
                color="success"
                prepend-icon="tabler-copy"
                append-icon="tabler-chevron-down"
              >
                Copy to my form
              </VBtn>
            </template>

            <VList density="compact">
              <VListItem
                prepend-icon="tabler-forms"
                @click="copyToMine(false)"
              >
                <VListItemTitle>Fill empty fields only</VListItemTitle>
              </VListItem>
              <VListItem
                prepend-icon="tabler-replace"
                @click="confirmReplace = true"
              >
                <VListItemTitle>Replace my form with this</VListItemTitle>
              </VListItem>
            </VList>
          </VMenu>

          <VBtn
            size="small"
            variant="tonal"
            prepend-icon="tabler-refresh"
            :loading="refreshing"
            @click="refreshRhuForm"
          >
            Refresh
          </VBtn>
        </div>
      </div>
    </VAlert>

    <VDialog v-model="confirmReplace" max-width="420">
      <VCard title="Replace your form?">
        <VCardText>
          Everything in your form will be replaced by the requester's answers. Nothing is saved until you press Save, and Cancel brings your form back.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="confirmReplace = false">Keep mine</VBtn>
          <VBtn color="warning" variant="tonal" @click="copyToMine(true)">Replace</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- ══ EDITABLE DP FIELDS — saved to tele_demographic_profile ══ -->

    <VRow>
      <VCol cols="12" md="6">
        <VTextField v-model="meeting.name_physician" outlined dense hide-details label="Name of physician: *"
          :rules="[requiredValidator]" :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
      <VCol cols="12" md="6" class="centered-col">
        <VTextField type="datetime-local" v-model="meeting.datetimemeet" outlined dense hide-details
          label="Date and Time of Teleconsultation" disabled class="custom-disabled" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextarea auto-grow rows="2" v-model="meeting.facility_full_address" outlined dense hide-details
          label="Name and Address of Health Facility (if applicable):" :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol cols="12" md="6" class="centered-col">
        <VTextField v-model="meeting.tele_partner_platform" label="Name of Telemedicine Partner (if applicable):"
          outlined dense hint="If none, Indicate telemedicine platform being used:" :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow class="align-center">
      <VCol>
        <VRadioGroup v-model="meeting.prior_tele_proper"
          label="* Prior to teleconsultation proper, obtain patient consent:" inline
          :rules="[v => v === 0 || v === 1 ? true : 'This field is required']"
          :class="{ 'custom-disabled': !isEditing }">
          <VRadio label="Yes" :value="1" />
          <VRadio label="No" :value="0" />
        </VRadioGroup>
      </VCol>
    </VRow>
    <VRow class="align-center">
      <VCol>
        <VRadioGroup v-model="meeting.is_patient_accompanied"
          label="* Is patient accompanied/assisted by another person during the consultation:" inline
          :rules="[v => v === 0 || v === 1 ? true : 'This field is required']"
          :class="{ 'custom-disabled': !isEditing }">
          <VRadio label="Yes" :value="1" />
          <VRadio label="No" :value="0" />
        </VRadioGroup>
      </VCol>
    </VRow>

    <!-- ══ PATIENT PROFILE SECTION — display only, pre-filled from tbl_master_patient ══ -->
    <VRow class="align-center">
      <VCol>
        <h5 class="text-h5 font-weight-medium mb-2">Patient Profile</h5>
      </VCol>
      <VCol inline>
        <div class="d-flex align-center">
          <label class="mr-2">Case #:</label>
          <VTextField v-model="meeting.case_no" outlined dense hide-details label="" disabled class="custom-disabled" />
        </div>
      </VCol>
    </VRow>
    <VRow class="align-center">
      <VCol>
        <VSelect v-model="meeting.type_of_membership" label="PhilHealth Type:" :items="[
          { title: 'Direct Contributor', value: 'Direct Contributor' },
          { title: 'Indirect Contributors', value: 'Indirect Contributors' }
        ]" item-title="title" item-value="value" variant="outlined" disabled class="custom-disabled" />
      </VCol>
      <VCol>
        <VTextField v-model="meeting.phic_id" outlined dense hide-details label="PhilHealth ID:" disabled
          class="custom-disabled" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="meeting.fname" outlined dense hide-details label="First Name:" disabled
          class="custom-disabled" />
      </VCol>
      <VCol>
        <VTextField v-model="meeting.mname" outlined dense hide-details label="Middle Name:" disabled
          class="custom-disabled" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="meeting.lname" outlined dense hide-details label="Last Name:" disabled
          class="custom-disabled" />
      </VCol>
      <VCol>
        <VTextField v-model="meeting.phone_no" outlined dense hide-details label="Contact Number:"
          :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="meeting.dob" type="date" outlined dense hide-details label="Birth Date:" disabled
          class="custom-disabled" />
      </VCol>
      <VCol>
        <VTextField v-model="meeting.sex" outlined dense hide-details label="Sex:" disabled class="custom-disabled" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VSelect v-model="meeting.civil_status" :items="civilStatusOptions" label="Civil Status:" item-title="title"
          item-value="value" variant="outlined" disabled class="custom-disabled" />
      </VCol>
      <VCol>
        <VAutocomplete v-model="meeting.religion" :items="religions" label="Religion:" item-title="text"
          item-value="code" disabled class="custom-disabled" />
      </VCol>
    </VRow>
    <!-- Companion fields — show when married/separated/divorced -->
    <VRow v-if="['1', '3', '4'].includes(String(meeting.civil_status))">
      <VCol>
        <VTextField v-model="meeting.relationship" outlined dense hide-details label="Relationship:"
          :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
      <VCol>
        <VTextField v-model="meeting.name_of_companion" outlined dense hide-details label="Name of Companion:"
          :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VSelect v-model="meeting.edu_attain" :items="educationalAttainments" label="Educational Attainment:"
          item-title="text" item-value="code" disabled class="custom-disabled" />
      </VCol>
      <VCol>
        <VTextField v-model="meeting.occupation" outlined dense hide-details label="Occupation:" disabled
          class="custom-disabled" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="meeting.monthly_income" outlined dense hide-details label="Monthly Income:" disabled
          class="custom-disabled" />
      </VCol>
      <VCol>
        <VSelect v-model="meeting.id_type" :items="[
          'NOT APPLICABLE',
          'UMID',
          'DRIVERS LICENSE',
          'PASSPORT ID',
          'POSTAL ID',
          'TIN ID',
        ]" label="Select ID:" outlined dense hide-details disabled class="custom-disabled" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField v-model="meeting.id_type_no" outlined dense hide-details label="CRN:" disabled
          class="custom-disabled" />
      </VCol>
      <VCol>
        <VAutocomplete v-model="meeting.nationality_id" :items="nationalityList" item-title="nationality"
          item-value="num_code" label="Nationality:" outlined hide-details disabled class="custom-disabled" />
      </VCol>
    </VRow>

    <!-- ══ ADDRESS — display only, pre-filled from tbl_master_patient ══ -->
    <VRow>
      <VCol>
        <VTextField v-model="meeting.house_no" outlined dense hide-details label="House no./Lot/Bldg:" disabled
          class="custom-disabled" />
      </VCol>
      <VCol>
        <VTextField v-model="meeting.street" outlined dense hide-details label="Street:" disabled
          class="custom-disabled" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VAutocomplete v-model="meeting.region" :items="regionList" item-title="reg_desc" item-value="reg_code"
          label="Region:" outlined hide-details disabled class="custom-disabled" />
      </VCol>
      <VCol>
        <VAutocomplete v-model="meeting.pprov" :items="provinceList" item-title="prov_name" item-value="prov_code"
          label="Province:" outlined hide-details disabled class="custom-disabled" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VAutocomplete v-model="meeting.pmuniname" :items="cityList" item-title="muni_name" item-value="zipcode"
          label="Municipality/City:" disabled class="custom-disabled" />
      </VCol>
      <VCol>
        <VAutocomplete v-model="meeting.pbrgyname" :items="barangayList" item-title="brg_name" item-value="brg_psgc"
          label="Barangay:" disabled class="custom-disabled" />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <label>Complete Address:</label>
        <VTextarea v-model="patientfulladd" row="2" outlined disabled class="custom-disabled" />
      </VCol>
    </VRow>
  </VForm>
</template>
