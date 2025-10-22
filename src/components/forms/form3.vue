<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import { useUser } from '@/composables/useUser';
import { axiosIns } from '@/plugins/axios';
import { ref } from "vue";
import { VForm } from 'vuetify/components/VForm';
import { VCheckbox, VCol, VRadioGroup, VRow, VTextField } from "vuetify/lib/components/index.mjs";

const cvdform = ref<VForm>();
const { user } = useUser();
const { isError, errorMessage, isSuccess, successMessage } = cStatus();

// country list
const countrylist = ref([]);

async function fetchCountries() {
    try {
        const response = await axiosIns.get('/api/tele/countries');
        // Sort the data alphabetically, just in case
        countrylist.value = response.data.data.sort((a, b) => a.en_short_name.localeCompare(b.en_short_name));
    } catch (error) {
        console.error('Error fetching countries:', error);
    }
}

// Props — so this form can be reused for different calls
const props = defineProps({
    consultId: {
        type: Number,
        required: false,
    },
});

const covids = ref({
    meetId: '',
    meeting_id: '',
    employers_name: '',
    place_of_work: '',
    house_bldg_name: '',
    street: '',
    municipal: '',
    province: '',
    country_id: '',
    office_phone_no: '',
    cellphone_no: '',
    history_travel_country_symptoms: '',
    port_of_exit: '',
    airline_sea_vessel: '',
    flight_vessel_no: '',
    date_departure: '',
    date_arrival_ph: '',
    known_covid_case: '',
    date_contact_known_covid_case: '',
    accomodation: '',
    acco_specify_type: '',
    acco_address: '',
    acco_date_last_expose: '',
    acco_name: '',
    acco_name_type: '',
    food_establishment: '',
    food_es_specify_type: '',
    food_es_address: '',
    food_es_date_last_expose: '',
    food_es_name: '',
    food_es_name_type: '',
    store: '',
    store_specify_type: '',
    store_address: '',
    store_date_last_expose: '',
    store_name: '',
    store_name_type: '',
    facility: '',
    fac_specify_type: '',
    fac_address: '',
    fac_date_last_expose: '',
    fac_name: '',
    fac_name_type: '',
    fac_significant_other: '',
    event: '',
    event_specify_type: '',
    event_date_last_expose: '',
    event_place: '',
    workplace: '',
    wp_company_name: '',
    wp_date_last_expose: '',
    wp_address: '',
    list_name_occasion: ''
});

const clinas = ref({
    meeting_id: '',
    days_14_prior_expose: '',
    anytime_during_expose: '',
    days_14_date_onset_illness: '',
    name_facility: '',
    referral_date: '',
    place_quarantine: '',
    quarantine_facility: '',
    fever: '',
    cough: '',
    colds: '',
    sore_throat: '',
    diarrhea: '',
    short_breathing: '',
    other_symptoms: '',
    history_illness: '',
    history_specify: '',
    xray: '',
    xray_date: '',
    pregnant: '',
    lmp: '',
    cxr_result: '',
    radiologic_findings: '',
    specimen_collected: '',
    date_collected: '',
    date_sent_ritm: '',
    date_received_ritm: '',
    virus_isolation_result: '',
    rt_pcr_result: '',
    scrum: '',
    oro_naso_swab: '',
    spe_others: '',
    classification: '',
    outcome_date_discharge: '',
    outcome_condition_discharge: ''
});


// Dynamic list — starts empty
const contactList = ref([]);


// Add new contact
function addContact() {
    contactList.value.push({ name: '', number: '' });
}

// Remove a contact row
function removeContact(index) {
    contactList.value.splice(index, 1);
}

// Watch contact list to update model
watch(contactList, (newList) => {
    covids.value.list_name_occasion = newList
        .map(contact => `{${contact.number},${contact.name}}`)
        .join(',');
}, { deep: true });

const scrumList = ref([]);

// Add scrum
function addScrum() {
    scrumList.value.push({ scrum: '' });
}

// Remove scrum
function removeScrum(index) {
    scrumList.value.splice(index, 1);
}

watch(scrumList, (newList) => {
    clinas.value.scrum = newList
        .map(scrums => `{${scrums.scrum}}`)
        .join(',');
}, { deep: true });

// Oro Naso Swab List
const oroNasoSwabList = ref([]);

// Add oro_naso_swab
function addOroNasoSwab() {
    oroNasoSwabList.value.push({ oro_naso_swab: '' });
}

// Remove oro_naso_swab
function removeOroNasoSwab(index) {
    oroNasoSwabList.value.splice(index, 1);
}

// Sync oro_naso_swab list with covids model
watch(oroNasoSwabList, (newList) => {
    clinas.value.oro_naso_swab = newList
        .filter(item => item.oro_naso_swab.trim() !== '')
        .map(item => `{${item.oro_naso_swab}}`)
        .join(',');
}, { deep: true });

// Special Others List
const speOthersList = ref([]);

// Add spe_others
function addSpeOthers() {
    speOthersList.value.push({ spe_others: '' });
}

// Remove spe_others
function removeSpeOthers(index) {
    speOthersList.value.splice(index, 1);
}

// Watch for changes and sync to covids model
watch(speOthersList, (newList) => {
    clinas.value.spe_others = newList
        .filter(item => item.spe_others.trim() !== '')
        .map(item => `{${item.spe_others}}`)
        .join(',');
}, { deep: true });


//save/update
async function fetchMeetingInfo(meetId) {
    try {
        // Fetch meeting info
        const response = await axiosIns.get(`/api/admin-patient-meeting-info`, {
            params: { meet_id: meetId },
        });

        const data = response.data;


        // Populate meeting data (defaults to null if missing)
        covids.value = {
            meeting_id: data.meetID ?? null,
            //     employers_name: data.employers_name ?? null,
            //     place_of_work: data.place_of_work ?? null,
            //     house_bldg_name: data.house_bldg_name ?? null,
            //     street: data.street ?? null,
            //     municipal: data.municipal ?? null,
            //     province: data.province ?? null,
            //     country_id: data.country_id ?? null,
            //     office_phone_no: data.office_phone_no ?? null,
            //     cellphone_no: data.cellphone_no ?? null,
            //     history_travel_country_symptoms: data.history_travel_country_symptoms ?? null,
            //     port_of_exit: data.port_of_exit ?? null,
            //     airline_sea_vessel: data.airline_sea_vessel ?? null,
            //     flight_vessel_no: data.flight_vessel_no ?? null,
            //     date_departure: data.date_departure ?? null,
            //     date_arrival_ph: data.date_arrival_ph ?? null,
            //     known_covid_case: data.known_covid_case ?? null,
            //     date_contact_known_covid_case: data.date_contact_known_covid_case ?? null,
            //     accomodation: data.accomodation ?? null,
            //     acco_specify_type: data.acco_specify_type ?? null,
            //     acco_address: data.acco_address ?? null,
            //     acco_date_last_expose: data.acco_date_last_expose ?? null,
            //     acco_name: data.acco_name ?? null,
            //     acco_name_type: data.acco_name_type ?? null,
            //     food_establishment: data.food_establishment ?? null,
            //     food_es_specify_type: data.food_es_specify_type ?? null,
            //     food_es_address: data.food_es_address ?? null,
            //     food_es_date_last_expose: data.food_es_date_last_expose ?? null,
            //     food_es_name: data.food_es_name ?? null,
            //     food_es_name_type: data.food_es_name_type ?? null,
            //     store: data.store ?? null,
            //     store_specify_type: data.store_specify_type ?? null,
            //     store_address: data.store_address ?? null,
            //     store_date_last_expose: data.store_date_last_expose ?? null,
            //     store_name: data.store_name ?? null,
            //     store_name_type: data.store_name_type ?? null,
            //     facility: data.facility ?? null,
            //     fac_specify_type: data.fac_specify_type ?? null,
            //     fac_address: data.fac_address ?? null,
            //     fac_date_last_expose: data.fac_date_last_expose ?? null,
            //     fac_name: data.fac_name ?? null,
            //     fac_name_type: data.fac_name_type ?? null,
            //     fac_significant_other: data.fac_significant_other ?? null,
            //     event: data.event ?? null,
            //     event_specify_type: data.event_specify_type ?? null,
            //     event_date_last_expose: data.event_date_last_expose ?? null,
            //     event_place: data.event_place ?? null,
            //     workplace: data.workplace ?? null,
            //     wp_company_name: data.wp_company_name ?? null,
            //     wp_date_last_expose: data.wp_date_last_expose ?? null,
            //     wp_address: data.wp_address ?? null,
            //     list_name_occasion: data.list_name_occasion ?? null
        };

        clinas.value = {
            meeting_id: data.meetID ?? null,
        };


        console.log("✅ Meeting info fetched:", covids.value);

        // 🔹 Step 3: Try to fetch existing covid screening
        if (covids.value.meeting_id) {
            const cvResponse = await axiosIns.get(`/api/get-covidscreening/${covids.value.meeting_id}`);
            const cv = cvResponse.data.data;

            if (cv) {
                console.log("✅ Existing covid screening found:",);

                // Merge existing DP data into covids.value
                covids.value.meeting_id = cv.meeting_id ?? null;
                covids.value.employers_name = cv.employers_name ?? null;
                covids.value.place_of_work = cv.place_of_work ?? null;
                covids.value.house_bldg_name = cv.house_bldg_name ?? null;
                covids.value.street = cv.street ?? null;
                covids.value.municipal = cv.municipal ?? null;
                covids.value.province = cv.province ?? null;
                covids.value.country_id = cv.country_id ?? null;
                covids.value.office_phone_no = cv.office_phone_no ?? null;
                covids.value.cellphone_no = cv.cellphone_no ?? null;
                covids.value.history_travel_country_symptoms = cv.history_travel_country_symptoms ?? null;
                covids.value.port_of_exit = cv.port_of_exit ?? null;
                covids.value.airline_sea_vessel = cv.airline_sea_vessel ?? null;
                covids.value.flight_vessel_no = cv.flight_vessel_no ?? null;
                covids.value.date_departure = cv.date_departure ?? null;
                covids.value.date_arrival_ph = cv.date_arrival_ph ?? null;
                covids.value.known_covid_case = cv.known_covid_case ?? null;
                covids.value.date_contact_known_covid_case = cv.date_contact_known_covid_case ?? null;
                covids.value.accomodation = cv.accomodation ?? null;
                covids.value.acco_specify_type = cv.acco_specify_type ?? null;
                covids.value.acco_address = cv.acco_address ?? null;
                covids.value.acco_date_last_expose = cv.acco_date_last_expose ?? null;
                covids.value.acco_name = cv.acco_name ?? null;
                covids.value.acco_name_type = cv.acco_name_type ?? null;
                covids.value.food_establishment = cv.food_establishment ?? null;
                covids.value.food_es_specify_type = cv.food_es_specify_type ?? null;
                covids.value.food_es_address = cv.food_es_address ?? null;
                covids.value.food_es_date_last_expose = cv.food_es_date_last_expose ?? null;
                covids.value.food_es_name = cv.food_es_name ?? null;
                covids.value.food_es_name_type = cv.food_es_name_type ?? null;
                covids.value.store = cv.store ?? null;
                covids.value.store_specify_type = cv.store_specify_type ?? null;
                covids.value.store_address = cv.store_address ?? null;
                covids.value.store_date_last_expose = cv.store_date_last_expose ?? null;
                covids.value.store_name = cv.store_name ?? null;
                covids.value.store_name_type = cv.store_name_type ?? null;
                covids.value.facility = cv.facility ?? null;
                covids.value.fac_specify_type = cv.fac_specify_type ?? null;
                covids.value.fac_address = cv.fac_address ?? null;
                covids.value.fac_date_last_expose = cv.fac_date_last_expose ?? null;
                covids.value.fac_name = cv.fac_name ?? null;
                covids.value.fac_name_type = cv.fac_name_type ?? null;
                covids.value.fac_significant_other = cv.fac_significant_other ?? null;
                covids.value.event = cv.event ?? null;
                covids.value.event_specify_type = cv.event_specify_type ?? null;
                covids.value.event_date_last_expose = cv.event_date_last_expose ?? null;
                covids.value.event_place = cv.event_place ?? null;
                covids.value.workplace = cv.workplace ?? null;
                covids.value.wp_company_name = cv.wp_company_name ?? null;
                covids.value.wp_date_last_expose = cv.wp_date_last_expose ?? null;
                covids.value.wp_address = cv.wp_address ?? null;
                covids.value.list_name_occasion = cv.list_name_occasion ?? null;

            } else {
                console.log("ℹ️ No covid screening found for this meeting ID.");
            }
        }

        // 🔹 Step 4: Try to fetch existing covid assessment
        if (clinas.value.meeting_id) {
            const caResponse = await axiosIns.get(`/api/get-covidassessment/${clinas.value.meeting_id}`);
            const ca = caResponse.data.data;

            if (ca) {
                console.log("✅ Existing covid assessment profile found:",);

                // Merge existing DP data into covids.value
                clinas.value.meeting_id = ca.meeting_id ?? null;
                clinas.value.days_14_prior_expose = ca.days_14_prior_expose ?? null;
                clinas.value.anytime_during_expose = ca.anytime_during_expose ?? null;
                clinas.value.days_14_date_onset_illness = ca.days_14_date_onset_illness ?? null;
                clinas.value.name_facility = ca.name_facility ?? null;
                clinas.value.referral_date = ca.referral_date ?? null;
                clinas.value.place_quarantine = ca.place_quarantine ?? null;
                clinas.value.quarantine_facility = ca.quarantine_facility ?? null;
                clinas.value.fever = ca.fever ?? null;
                clinas.value.cough = ca.cough ?? null;
                clinas.value.colds = ca.colds ?? null;
                clinas.value.sore_throat = ca.sore_throat ?? null;
                clinas.value.diarrhea = ca.diarrhea ?? null;
                clinas.value.short_breathing = ca.short_breathing ?? null;
                clinas.value.other_symptoms = ca.other_symptoms ?? null;
                clinas.value.history_illness = ca.history_illness ?? null;
                clinas.value.history_specify = ca.history_specify ?? null;
                clinas.value.xray = ca.xray ?? null;
                clinas.value.xray_date = ca.xray_date ?? null;
                clinas.value.pregnant = ca.pregnant ?? null;
                clinas.value.lmp = ca.lmp ?? null;
                clinas.value.cxr_result = ca.cxr_result ?? null;
                clinas.value.radiologic_findings = ca.radiologic_findings ?? null;
                clinas.value.specimen_collected = ca.specimen_collected ?? null;
                clinas.value.date_collected = ca.date_collected ?? null;
                clinas.value.date_sent_ritm = ca.date_sent_ritm ?? null;
                clinas.value.date_received_ritm = ca.date_received_ritm ?? null;
                clinas.value.virus_isolation_result = ca.virus_isolation_result ?? null;
                clinas.value.rt_pcr_result = ca.rt_pcr_result ?? null;
                clinas.value.scrum = ca.scrum ?? null;
                clinas.value.oro_naso_swab = ca.oro_naso_swab ?? null;
                clinas.value.spe_others = ca.spe_others ?? null;
                clinas.value.classification = ca.classification ?? null;
                clinas.value.outcome_date_discharge = ca.outcome_date_discharge ?? null;
                clinas.value.outcome_condition_discharge = ca.outcome_condition_discharge ?? null;

            } else {
                console.log("ℹ️ No covid assessment found for this meeting ID.");
            }
        }

    } catch (error) {
        console.error("❌ Error fetching covid screening info:", error);
        errorMessage.value = "Failed to load covid screening info.";
        isError.value = true;
    }
}


onMounted(() => {
    if (props.consultId) fetchMeetingInfo(props.consultId);
    fetchCountries();

    if (covids.value.list_name_occasion) {
        const parts = covids.value.list_name_occasion.split(',');
        const pairs = [];
        for (let i = 0; i < parts.length; i += 2) {
            pairs.push({
                number: parts[i] || '',
                name: parts[i + 1] || ''
            });
        }
        contactList.value = pairs.length ? pairs : [];
    };

    if (covids.value.scrum) {
        const parts = covids.value.scrum.split(',');
        scrumList.value = parts.map(s => ({ scrum: s.replace(/[{}]/g, '').trim() }));
    };

    if (covids.value.oro_naso_swab) {
        const parts = covids.value.oro_naso_swab.split(',');
        oroNasoSwabList.value = parts.map(s => ({
            oro_naso_swab: s.replace(/[{}]/g, '').trim()
        }));
    };

    if (covids.value.spe_others) {
        const parts = covids.value.spe_others.split(',');
        speOthersList.value = parts.map(s => ({
            spe_others: s.replace(/[{}]/g, '').trim()
        }));
    };
});

async function saveUpdateCV() {
    try {
        // Ensure form validation
        const { valid } = await cvdform.value.validate();

        if (!valid) {
            errorMessage.value = "Please fill in all required fields correctly.";
            isError.value = true;
            return;
        }

        // ✅ Prepare payload using all meeting data
        const payload = {
            meeting_id: covids.value.meeting_id,
            employers_name: covids.value.employers_name,
            place_of_work: covids.value.place_of_work,
            house_bldg_name: covids.value.house_bldg_name,
            street: covids.value.street,
            municipal: covids.value.municipal,
            province: covids.value.province,
            country_id: covids.value.country_id,
            office_phone_no: covids.value.office_phone_no,
            cellphone_no: covids.value.cellphone_no,
            history_travel_country_symptoms: covids.value.history_travel_country_symptoms,
            port_of_exit: covids.value.port_of_exit,
            airline_sea_vessel: covids.value.airline_sea_vessel,
            flight_vessel_no: covids.value.flight_vessel_no,
            date_departure: covids.value.date_departure,
            date_arrival_ph: covids.value.date_arrival_ph,
            known_covid_case: covids.value.known_covid_case,
            date_contact_known_covid_case: covids.value.date_contact_known_covid_case,
            accomodation: covids.value.accomodation,
            acco_specify_type: covids.value.acco_specify_type,
            acco_address: covids.value.acco_address,
            acco_date_last_expose: covids.value.acco_date_last_expose,
            acco_name: covids.value.acco_name,
            acco_name_type: covids.value.acco_name_type,
            food_establishment: covids.value.food_establishment,
            food_es_specify_type: covids.value.food_es_specify_type,
            food_es_address: covids.value.food_es_address,
            food_es_date_last_expose: covids.value.food_es_date_last_expose,
            food_es_name: covids.value.food_es_name,
            food_es_name_type: covids.value.food_es_name_type,
            store: covids.value.store,
            store_specify_type: covids.value.store_specify_type,
            store_address: covids.value.store_address,
            store_date_last_expose: covids.value.store_date_last_expose,
            store_name: covids.value.store_name,
            store_name_type: covids.value.store_name_type,
            facility: covids.value.facility,
            fac_specify_type: covids.value.fac_specify_type,
            fac_address: covids.value.fac_address,
            fac_date_last_expose: covids.value.fac_date_last_expose,
            fac_name: covids.value.fac_name,
            fac_name_type: covids.value.fac_name_type,
            fac_significant_other: covids.value.fac_significant_other,
            event: covids.value.event,
            event_specify_type: covids.value.event_specify_type,
            event_date_last_expose: covids.value.event_date_last_expose,
            event_place: covids.value.event_place,
            workplace: covids.value.workplace,
            wp_company_name: covids.value.wp_company_name,
            wp_date_last_expose: covids.value.wp_date_last_expose,
            wp_address: covids.value.wp_address,
            list_name_occasion: covids.value.list_name_occasion
        };


        console.log("Payload being sent:", payload);
        // Send request
        const response = await axiosIns.post('/api/save-covidscreening', payload); //no route controller yet

        // Success response handling
        successMessage.value = "Saved covid-19 screening.";
        isSuccess.value = true;

    } catch (error) {
        console.error("Error Saving covid-19 screening:", error);
        errorMessage.value = "Failed to save covid-19 screening.";
        isError.value = true;

    }
}

async function saveUpdateCA() {
    try {
        // Ensure form validation
        const { valid } = await cvdform.value.validate();

        if (!valid) {
            errorMessage.value = "Please fill in all required fields correctly.";
            isError.value = true;
            return;
        }

        // ✅ Prepare payload using all meeting data
        const payload = {
            meeting_id: clinas.value.meeting_id,
            days_14_prior_expose: clinas.value.days_14_prior_expose,
            anytime_during_expose: clinas.value.anytime_during_expose,
            days_14_date_onset_illness: clinas.value.days_14_date_onset_illness,
            name_facility: clinas.value.name_facility,
            referral_date: clinas.value.referral_date,
            place_quarantine: clinas.value.place_quarantine,
            quarantine_facility: clinas.value.quarantine_facility,
            fever: clinas.value.fever,
            cough: clinas.value.cough,
            colds: clinas.value.colds,
            sore_throat: clinas.value.sore_throat,
            diarrhea: clinas.value.diarrhea,
            short_breathing: clinas.value.short_breathing,
            other_symptoms: clinas.value.other_symptoms,
            history_illness: clinas.value.history_illness,
            history_specify: clinas.value.history_specify,
            xray: clinas.value.xray,
            xray_date: clinas.value.xray_date,
            pregnant: clinas.value.pregnant,
            lmp: clinas.value.lmp,
            cxr_result: clinas.value.cxr_result,
            radiologic_findings: clinas.value.radiologic_findings,
            specimen_collected: clinas.value.specimen_collected,
            date_collected: clinas.value.date_collected,
            date_sent_ritm: clinas.value.date_sent_ritm,
            date_received_ritm: clinas.value.date_received_ritm,
            virus_isolation_result: clinas.value.virus_isolation_result,
            rt_pcr_result: clinas.value.rt_pcr_result,
            scrum: clinas.value.scrum,
            oro_naso_swab: clinas.value.oro_naso_swab,
            spe_others: clinas.value.spe_others,
            classification: clinas.value.classification,
            outcome_date_discharge: clinas.value.outcome_date_discharge,
            outcome_condition_discharge: clinas.value.outcome_condition_discharge
        };


        console.log("Payload being sent:", payload);
        // Send request
        const response = await axiosIns.post('/api/save-covidassessment', payload); //no route controller yet

        // Success response handling
        successMessage.value = "Saved covid-19 assessment.";
        isSuccess.value = true;

    } catch (error) {
        console.error("Error Saving covid-19 assessment:", error);
        errorMessage.value = "Failed to save covid-19 assessment.";
        isError.value = true;

    }
}

</script>

<template>
    <VForm ref="cvdform">
        <VBtn variant="tonal" color="success" icon="tabler-device-floppy" size="48"
            @click="() => { saveUpdateCV(); saveUpdateCA() }" class="fab-fixed-top">
        </VBtn>
        <pre>{{ covids }}{{ clinas }}</pre>
        <div class="d-flex flex-column justify-center">
        </div>
        <br></br>
        <VRow
            style="background-color:rgba(244, 67, 54, 0.15); padding-top: 4%; padding-left: 4%; padding-bottom: 2%; border-radius: 5px;">
            <Vcol>
                <h5 class=" text-h5 font-weight-medium mb-2" style="margin-left: -10px; color:#ff7b71">
                    Overseas Employment Address(for Overseas Filipino Workers)
                </h5>
            </Vcol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="covids.employers_name" outlined dense hide-details label="Employer's Name:" />
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="covids.place_of_work" outlined dense hide-details label="Place Of Work:" />
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="covids.house_bldg_name" outlined dense hide-details label="House #/Bldg Name:" />
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="covids.street" outlined dense hide-details label="Street:" />
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="covids.municipal" outlined dense hide-details label="City/Municipality:" />
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="covids.province" outlined dense hide-details label="Province/State:" />
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VAutocomplete v-model="covids.country_id" :items="countrylist" item-title="en_short_name"
                    item-value="num_code" label="Country:" outlined dense hide-details clearable persistent-hint />
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="covids.office_phone_no" outlined dense hide-details label="Office Phone No:" />
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="covids.cellphone_no" outlined dense hide-details label="Office Cellphone No:" />
            </VCol>
        </VRow>
        <br></br>
        <VRow
            style="background-color:rgba(244, 67, 54, 0.15); padding-top: 4%; padding-left: 4%; padding-bottom: 2%; border-radius: 5px;">
            <Vcol>
                <h5 class=" text-h5 font-weight-medium mb-2" style="margin-left: -10px; color:#ff7b71">
                    Travel History
                </h5>
            </Vcol>
        </VRow>
        <VRow class="align-center">
            <VCol>
                <label>
                    History of Travel/Visit/Work in other countries with known COVID-19 transmission
                    14 days prior to onset of signs and symptoms:
                </label>
                <VRadioGroup v-model="covids.history_travel_country_symptoms" inline hide-details density="compact">
                    <VRadio label="Yes" :value="1" />
                    <VRadio label="No" :value="0" />
                </VRadioGroup>
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="covids.port_of_exit" outlined dense hide-details label="Port of Exit:" />
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="covids.airline_sea_vessel" outlined dense hide-details
                    label="Airline/Sea Vessel:" />
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="covids.flight_vessel_no" outlined dense hide-details label="Flight/Vessel #:" />
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField type="date" v-model="covids.date_departure" outlined dense hide-details
                    label="Date of Departure:" />
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="covids.date_arrival_ph" outlined dense hide-details
                    label="Date of Arrival in Philippines:" />
            </VCol>
        </VRow>
        <br></br>
        <VRow
            style="background-color:rgba(244, 67, 54, 0.15); padding-top: 4%; padding-left: 4%; padding-bottom: 2%; border-radius: 5px;">
            <Vcol>
                <h5 class=" text-h5 font-weight-medium mb-2" style="margin-left: -10px; color:#ff7b71">
                    Exposure History
                </h5>
            </Vcol>
        </VRow>
        <VRow class="align-center" flex>
            <VCol>
                <div class="d-flex align-center">
                    <label>
                        Known Covid-19 Case:
                    </label>

                    <VRadioGroup v-model="covids.known_covid_case" inline hide-details density="compact">
                        <VRadio label="Yes" :value="1" />
                        <VRadio label="No" :value="0" />
                        <VRadio label="Unknown" :value="3" />
                    </VRadioGroup>
                </div>
                <br />
                <VTextField type="date" v-if="covids.known_covid_case == 1"
                    v-model="covids.date_contact_known_covid_case" outlined dense hide-details
                    label="(If yes) Date of Contact with Known Covid-19 Case:" />
            </VCol>
        </VRow>
        <br></br>
        <!-- Accommodation -->
        <VDivider />
        <br />
        <VRow class="mb-4">
            <VCol>
                <div class="d-flex align-center gap-3">
                    <label class="text-body-1 font-weight-medium">Accommodation</label>

                    <VRadioGroup v-model="covids.accomodation" inline hide-details density="compact">
                        <VRadio label="Yes" :value="1" />
                        <VRadio label="No" :value="0" />
                        <VRadio label="Unknown" :value="3" />
                    </VRadioGroup>
                </div>

                <VTextField v-model="covids.acco_specify_type" outlined dense hide-details label="Specific Type:"
                    class="mt-2" />
                <VTextField v-model="covids.acco_address" outlined dense hide-details label="Address:" class="mt-2" />
                <VTextField v-model="covids.acco_date_last_expose" outlined dense hide-details
                    label="Date of Last Exposure:" class="mt-2" />
                <VTextField v-model="covids.acco_name" outlined dense hide-details label="Name:" class="mt-2" />

                <VRadioGroup v-model="covids.acco_name_type" inline hide-details density="compact" class="pt-2">
                    <VRadio label="Owner" value="0" />
                    <VRadio label="Staff" value="1" />
                    <VRadio label="Guest" value="2" />
                </VRadioGroup>
            </VCol>
        </VRow>


        <!-- Food Establishment -->

        <VDivider />
        <br />
        <VRow class="mb-4">
            <VCol>
                <div class="d-flex align-center gap-3">
                    <label class="text-body-1 font-weight-medium">Food Establishment</label>

                    <VRadioGroup v-model="covids.food_establishment" inline hide-details density="compact">
                        <VRadio label="Yes" :value="1" />
                        <VRadio label="No" :value="0" />
                        <VRadio label="Unknown" :value="3" />
                    </VRadioGroup>
                </div>

                <VTextField v-model="covids.food_es_specify_type" outlined dense hide-details label="Specific Type:"
                    class="mt-2" />
                <VTextField v-model="covids.food_es_address" outlined dense hide-details label="Address:"
                    class="mt-2" />
                <VTextField v-model="covids.food_es_date_last_expose" outlined dense hide-details
                    label="Date of Last Exposure:" class="mt-2" />
                <VTextField v-model="covids.food_es_name" outlined dense hide-details label="Name:" class="mt-2" />

                <VRadioGroup v-model="covids.food_es_name_type" inline hide-details density="compact" class="pt-2">
                    <VRadio label="Owner" value="0" />
                    <VRadio label="Staff" value="1" />
                    <VRadio label="Customer" value="2" />
                </VRadioGroup>
            </VCol>
        </VRow>


        <!-- Store -->
        <VDivider />
        <br />
        <VRow class="mb-4">
            <VCol>
                <div class="d-flex align-center gap-3">
                    <label class="text-body-1 font-weight-medium">Store</label>

                    <VRadioGroup v-model="covids.store" inline hide-details density="compact">
                        <VRadio label="Yes" :value="1" />
                        <VRadio label="No" :value="0" />
                        <VRadio label="Unknown" :value="3" />
                    </VRadioGroup>
                </div>

                <VTextField v-model="covids.store_specify_type" outlined dense hide-details label="Specific Type:"
                    class="mt-2" />
                <VTextField v-model="covids.store_address" outlined dense hide-details label="Address:" class="mt-2" />
                <VTextField v-model="covids.store_date_last_expose" outlined dense hide-details
                    label="Date of Last Exposure:" class="mt-2" />
                <VTextField v-model="covids.store_name" outlined dense hide-details label="Name:" class="mt-2" />

                <VRadioGroup v-model="covids.store_name_type" inline hide-details density="compact" class="pt-2">
                    <VRadio label="Owner" value="0" />
                    <VRadio label="Staff" value="1" />
                    <VRadio label="Customer" value="2" />
                </VRadioGroup>
            </VCol>
        </VRow>


        <!-- Health Facility -->
        <VDivider />
        <br />
        <VRow class="mb-4">
            <VCol>
                <div class="d-flex align-center gap-3">
                    <label class="text-body-1 font-weight-medium">Health Facility</label>

                    <VRadioGroup v-model="covids.facility" inline hide-details density="compact">
                        <VRadio label="Yes" :value="1" />
                        <VRadio label="No" :value="0" />
                        <VRadio label="Unknown" :value="3" />
                    </VRadioGroup>
                </div>

                <VTextField v-model="covids.fac_specify_type" outlined dense hide-details label="Specific Type:"
                    class="mt-2" />
                <VTextField v-model="covids.fac_address" outlined dense hide-details label="Address:" class="mt-2" />
                <VTextField v-model="covids.fac_significant_other" outlined dense hide-details
                    label="Significant Other:" class="mt-2" />
                <VTextField v-model="covids.fac_date_last_expose" outlined dense hide-details
                    label="Date of Last Exposure:" class="mt-2" />
                <VTextField v-model="covids.fac_name" outlined dense hide-details label="Name:" class="mt-2" />

                <VRadioGroup v-model="covids.fac_name_type" inline hide-details density="compact" class="pt-2">
                    <VRadio label="Patient" value="0" />
                    <VRadio label="Visitor" value="1" />
                    <VRadio label="Staff" value="2" />
                </VRadioGroup>
            </VCol>
        </VRow>

        <!-- Event -->
        <VDivider />
        <br />
        <VRow class="mb-4">
            <VCol>
                <div class="d-flex align-center gap-3">
                    <label class="text-body-1 font-weight-medium">Event</label>

                    <VRadioGroup v-model="covids.event" inline hide-details density="compact">
                        <VRadio label="Yes" :value="1" />
                        <VRadio label="No" :value="0" />
                        <VRadio label="Unknown" :value="3" />
                    </VRadioGroup>
                </div>

                <VTextField v-model="covids.event_specify_type" outlined dense hide-details label="Specific Type:"
                    class="mt-2" />
                <VTextField type="date" v-model="covids.event_date_last_expose" outlined dense hide-details
                    label="Date of last Exposure:" class="mt-2" />
                <VTextField v-model="covids.event_place" outlined dense hide-details label="Event Place:"
                    class="mt-2" />
            </VCol>
        </VRow>

        <!-- Workplace -->
        <VDivider />
        <br />
        <VRow class="mb-4">
            <VCol>
                <div class="d-flex align-center gap-3">
                    <label class="text-body-1 font-weight-medium">Workplace</label>

                    <VRadioGroup v-model="covids.workplace" inline hide-details density="compact">
                        <VRadio label="Yes" :value="1" />
                        <VRadio label="No" :value="0" />
                        <VRadio label="Unknown" :value="3" />
                    </VRadioGroup>
                </div>

                <VTextField v-model="covids.wp_company_name" outlined dense hide-details label="Company Name:"
                    class="mt-2" />
                <VTextField type="date" v-model="covids.wp_date_last_expose" outlined dense hide-details
                    label="Date of last Exposure:" class="mt-2" />
                <VTextField v-model="covids.wp_address" outlined dense hide-details label="Address:" class="mt-2" />
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <label class="text-body-1 font-weight-medium">
                    List of names of persons in contact with during any of these occasions and their contact numbers:
                </label>

                <!-- Contact Inputs (only shown if there's at least 1) -->
                <VRow v-for="(contact, index) in contactList" :key="index" align="center" class="mt-2">
                    <!-- Auto-increment number -->
                    <VCol cols="1">
                        <span class="font-weight-bold">{{ index + 1 }}.</span>
                    </VCol>

                    <!-- Name Field -->
                    <VCol cols="5">
                        <VTextField v-model="contact.name" label="Name" outlined dense />
                    </VCol>

                    <!-- Contact Number Field -->
                    <VCol cols="5">
                        <VTextField v-model="contact.number" label="Contact Number" outlined dense />
                    </VCol>

                    <!-- Remove Button -->
                    <VCol cols="1">
                        <VBtn variant="text" color="error" icon="tabler-backspace" size="48"
                            @click="() => removeContact(index)">
                        </VBtn>
                    </VCol>
                </VRow>
                <!-- Add Button -->
                <VRow class="mt-2">
                    <VCol cols="12">
                        <VBtn color="primary" @click="addContact">
                            Add Contact
                        </VBtn>
                    </VCol>
                </VRow>
            </VCol>
            <VDivider />
        </VRow>
        <br />
        <br />
        <VRow
            style="background-color:rgba(244, 67, 54, 0.15); padding-top: 4%; padding-left: 4%; padding-bottom: 2%; border-radius: 5px;">
            <Vcol>
                <h5 class=" text-h5 font-weight-medium mb-2" style="margin-left: -10px; color:#ff7b71">
                    Clinical Assessment
                </h5>
            </Vcol>
        </VRow>
        <VRow>
            <VCol>
                <VRow>
                    <div class="d-flex align-center" style="padding-left: 10px;">
                        <label>
                            14 days PRIOR to first date of Exposure:
                        </label>
                        <VRadioGroup v-model="clinas.days_14_prior_expose" inline hide-details density="compact">
                            <VRadio label="Yes" :value="1" />
                            <VRadio label="No" :value="0" />
                        </VRadioGroup>
                    </div>
                </VRow>
                <VRow v-if="clinas.days_14_prior_expose == 1">
                    <VCol>
                        <VTextField type="date" v-model="clinas.days_14_date_onset_illness"
                            label="(if yes)Date of onset of illness:" outlined dense />
                    </VCol>
                </VRow>
                <VRow v-if="clinas.days_14_prior_expose == 0" class="align-center">
                    <VCol>
                        <div v-if="clinas.days_14_prior_expose == 0" class="d-flex align-center">
                            <label class="text-body-1 font-weight-medium me-2">(If no) Place of Quarantine:</label>
                            <VCheckbox v-model="clinas.place_quarantine" label="Home" :value="1" hide-details
                                density="compact" />
                        </div>
                    </VCol>
                </VRow>
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="clinas.quarantine_facility" outlined dense hide-details
                    label="Quarantine Facility:" />
            </VCol>
        </VRow>
        <VRow class="align-center" flex>
            <VCol>
                <VRow>
                    <div class="d-flex align-center" style="padding-left: 10px;">
                        <label>
                            Anytime during date of Exposure:
                        </label>

                        <VRadioGroup v-model="clinas.anytime_during_expose" inline hide-details density="compact">
                            <VRadio label="Yes" :value="1" />
                            <VRadio label="No" :value="0" />
                        </VRadioGroup>
                    </div>
                </VRow>
                <VRow>
                    <VCol>
                        <VTextField v-model="clinas.name_facility" outlined dense hide-details
                            label="Name of Referral Health Facility:" />
                    </VCol>
                    <VCol>
                        <VTextField type="date" v-model="clinas.referral_date" outlined dense hide-details
                            label="Date of Referral:" />
                    </VCol>
                </VRow>
            </VCol>
            <VDivider />
        </VRow>
        <VRow>
            <VCol>
                <VTextField type="number" v-model="clinas.fever" outlined dense hide-details label="Fever(°C):"
                    suffix="°C" />
            </VCol>
            <VCol class="align-center" flex>
                <VCheckbox v-model="clinas.cough" label="Cough" :value="1" hide-details density="compact" />
            </VCol>
            <VCol class="align-center" flex>
                <VCheckbox v-model="clinas.colds" label="Colds" :value="1" hide-details density="compact" />
            </VCol>
            <VCol class="align-center" flex>
                <VCheckbox v-model="clinas.sore_throat" label="Sore Throat" :value="1" hide-details density="compact" />
            </VCol>
            <VDivider />
        </VRow>
        <VRow>
            <VCol cols="12" md="2">
                <VCheckbox v-model="clinas.diarrhea" label="Diarrhea" :value="1" hide-details density="compact" />
            </VCol>
            <VCol cols="12" md="6">
                <VCheckbox v-model="clinas.short_breathing" label="Shortness/Difficulty of breathing" :value="1"
                    hide-details density="compact" />
            </VCol>
            <VCol>
                <VTextField v-model="clinas.other_symptoms" outlined dense hide-details
                    label="Other Symptoms Specify:" />
            </VCol>
            <VDivider />
        </VRow>
        <VRow>
            <VCol cols="12" md="5">
                <VRadioGroup v-model="clinas.history_illness" inline hide-details density="compact"
                    label="Anytime during date of Exposure:">
                    <VRadio label="Yes" :value="1" />
                    <VRadio label="No" :value="0" />
                </VRadioGroup>
            </VCol>
            <VCol>
                <VRadioGroup v-model="clinas.xray" inline hide-details density="compact" label="Chest Xray Done?:">
                    <VRadio label="Yes" :value="1" />
                    <VRadio label="No" :value="0" />
                </VRadioGroup>
            </VCol>
            <VCol>
                <VRadioGroup v-model="clinas.pregnant" inline hide-details density="compact" label="Are you pregnant?:">
                    <VRadio label=" Yes" :value="1" />
                    <VRadio label="No" :value="0" />
                </VRadioGroup>
            </VCol>
            <VDivider />
        </VRow>
        <VRow>
            <VCol cols="12" md="7">
                <div class="d-flex align-center" style="padding-left: 10px;">
                    <label>
                        CXR Results:
                    </label>
                    <VRadioGroup v-model="clinas.cxr_result" inline hide-details density="compact">
                        <VRadio label="Yes" :value="1" />
                        <VRadio label="No" :value="0" />
                        <VRadio label="Pending" :value="2" />
                    </VRadioGroup>
                </div>
            </VCol>
            <VCol cols="12" md="5">
                <VTextField v-model="clinas.radiologic_findings" outlined dense hide-details
                    label="Other Radiologic Findings:" />
            </VCol>
        </VRow>
        <br />
        <br />
        <VRow
            style="background-color:rgba(244, 67, 54, 0.15); padding-top: 4%; padding-left: 4%; padding-bottom: 2%; border-radius: 5px;">
            <Vcol>
                <h5 class=" text-h5 font-weight-medium mb-2" style="margin-left: -10px; color:#ff7b71">
                    Specimen Information
                </h5>
            </Vcol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="clinas.specimen_collected" outlined dense hide-details
                    label="Specimen Collected:" />
            </VCol>
            <VCol>
                <VTextField v-model="clinas.date_collected" outlined dense hide-details label="Date Collected:" />
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="clinas.date_sent_ritm" outlined dense hide-details
                    label="Date Sent to RITM or any accredited laboratory:" />
            </VCol>
            <VCol>
                <VTextField v-model="clinas.date_received_ritm" outlined dense hide-details
                    label="Date Received in RITM:" />
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="clinas.virus_isolation_result" outlined dense hide-details
                    label="Virus Isolation Result:" />
            </VCol>
            <VCol>
                <VTextField v-model="clinas.rt_pcr_result" outlined dense hide-details label="RT-PCR Result:" />
            </VCol>
            <VDivider />
        </VRow>
        <VRow>
            <VCol>
                <label class="text-body-1 font-weight-medium">
                    Scrum:
                </label>

                <VRow v-for="(scrum, index) in scrumList" :key="index" align="center" class="mt-2">
                    <!-- Auto-increment number -->
                    <VCol cols="1">
                        <span class="font-weight-bold">{{ index + 1 }}.</span>
                    </VCol>

                    <VCol cols="5">
                        <!-- ✅ fixed: scrums ➜ scrum -->
                        <VTextField v-model="scrum.scrum" :placeholder="'__/__'" persistent-hint outlined dense />
                    </VCol>

                    <!-- Remove Button -->
                    <VCol cols="1">
                        <VBtn variant="text" color="error" icon="tabler-backspace" size="48"
                            @click="() => removeScrum(index)" />
                    </VCol>
                </VRow>

                <!-- Add Button -->
                <VRow class="mt-2">
                    <VCol cols="12">
                        <VBtn color="primary" @click="addScrum">
                            Add Row
                        </VBtn>
                    </VCol>
                </VRow>
            </VCol>
            <VDivider />
        </VRow>
        <VRow>
            <VCol>
                <label class="text-body-1 font-weight-medium">
                    Oropharyngeal/Nasopharyngeal Swab
                </label>

                <VRow v-for="(item, index) in oroNasoSwabList" :key="index" align="center" class="mt-2">
                    <!-- Auto-increment number -->
                    <VCol cols="1">
                        <span class="font-weight-bold">{{ index + 1 }}.</span>
                    </VCol>

                    <!-- Input field -->
                    <VCol cols="5">
                        <VTextField v-model="item.oro_naso_swab" :placeholder="'__/__'" outlined dense />
                    </VCol>

                    <!-- Remove button -->
                    <VCol cols="1">
                        <VBtn variant="text" color="error" icon="tabler-backspace" size="48"
                            @click="() => removeOroNasoSwab(index)" />
                    </VCol>
                </VRow>

                <!-- Add button -->
                <VRow class="mt-2">
                    <VCol cols="12">
                        <VBtn color="primary" @click="addOroNasoSwab">
                            Add Row
                        </VBtn>
                    </VCol>
                </VRow>
            </VCol>
            <VDivider />
        </VRow>
        <VRow>
            <VCol>
                <label class="text-body-1 font-weight-medium">
                    Others:
                </label>

                <VRow v-for="(item, index) in speOthersList" :key="index" align="center" class="mt-2">
                    <!-- Auto-increment number -->
                    <VCol cols="1">
                        <span class="font-weight-bold">{{ index + 1 }}.</span>
                    </VCol>

                    <!-- Input field -->
                    <VCol cols="5">
                        <VTextField v-model="item.spe_others" :placeholder="'__/__'" outlined dense />
                    </VCol>

                    <!-- Remove Button -->
                    <VCol cols="1">
                        <VBtn variant="text" color="error" icon="tabler-backspace" size="48"
                            @click="() => removeSpeOthers(index)" />
                    </VCol>
                </VRow>

                <!-- Add Button -->
                <VRow class="mt-2">
                    <VCol cols="12">
                        <VBtn color="primary" @click="addSpeOthers">
                            Add Rows
                        </VBtn>
                    </VCol>
                </VRow>
            </VCol>
            <VDivider />
        </VRow>
        <br />
        <br />
        <VRow
            style="background-color:rgba(244, 67, 54, 0.15); padding-top: 4%; padding-left: 4%; padding-bottom: 2%; border-radius: 5px;">
            <Vcol>
                <h5 class=" text-h5 font-weight-medium mb-2" style="margin-left: -10px; color:#ff7b71">
                    Classification
                </h5>
            </Vcol>
        </VRow>
        <br />
        <br />
        <VRow>
            <Vcol>
                <VRadioGroup v-model="clinas.classification" inline hide-details density="compact"
                    style="padding-left: 10px;">
                    <VRadio label="Suspect Case " :value="0" />
                    <VRadio label="Probable Case " :value="1" />
                    <VRadio label="Confirmed Case" :value="2" />
                </VRadioGroup>
            </Vcol>
        </VRow>
        <br />
        <br />
        <VRow
            style="background-color:rgba(244, 67, 54, 0.15); padding-top: 4%; padding-left: 4%; padding-bottom: 2%; border-radius: 5px;">
            <Vcol>
                <h5 class=" text-h5 font-weight-medium mb-2" style="margin-left: -10px; color:#ff7b71">
                    Outcome
                </h5>
            </Vcol>
        </VRow>
        <br />
        <br />
        <VRow>
            <VCol cols="6">
                <VTextField type="date" v-model="clinas.outcome_date_discharge" outlined dense hide-details
                    label="Date of Discharge:" />
            </VCol>
            <Vcol cols="6">
                <VRadioGroup v-model="clinas.outcome_condition_discharge" label="Condition on Discharge " column
                    hide-details style="padding-left: 10px;">
                    <VRadio label="Died " :value="0" />
                    <VRadio label="Improved" :value="1" />
                    <VRadio label="Recovered" :value="2" />
                    <VRadio label="Transferred" :value="3" />
                    <VRadio label="Absconded" :value="4" />
                </VRadioGroup>
            </Vcol>
        </VRow>
    </VForm>

</template>
