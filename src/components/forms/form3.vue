<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import { useDirtyTracker, useFormSync } from '@/composables/useFormSync';
import { useUser } from '@/composables/useUser';
import { axiosIns } from '@/plugins/axios';
import { computed, onMounted, ref, watch } from "vue";
import { VForm } from 'vuetify/components/VForm';
import { VCheckbox, VCol, VRadioGroup, VRow, VTextField } from "vuetify/lib/components/index.mjs";

const cvdform = ref<VForm>();
const { user } = useUser();
const { isError, errorMessage, isSuccess, successMessage } = cStatus();
const emit = defineEmits(['loaded']);

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

// ── Province / City ──────────────────────────────────────────────────────────
//
// The two are bound through PSGC: municipal_cities.prov_psgc points at
// provinces.prov_psgc. The columns are different types — varchar there (keeping a
// leading zero, "012800000") and unsigned int here — so every comparison goes
// through Number(), never string equality, which would silently match nothing for
// any province whose code begins with a zero.
//
// tele_covid19_screening.province / .municipal are varchar and have always held
// free text, so the NAME is still what gets stored. The PSGC is kept in component
// state purely to drive the filtering.
interface ProvinceOption { prov_psgc: string; prov_name: string; prov_code?: string }
interface CityOption { muni_psgc: number; muni_name: string; prov_psgc: number; zipcode?: number }

// ISO 3166-1 numeric for the Philippines, matching countries.num_code. Screening
// happens domestically unless stated otherwise, so the field starts here.
const DEFAULT_COUNTRY_ID = 608;

const provinceList = ref<ProvinceOption[]>([]);
const cityList = ref<CityOption[]>([]);
const selectedProvPsgc = ref<string | number | null>(null);

async function fetchProvinces() {
    try {
        const response = await axiosIns.get('/api/tele/provinces');
        provinceList.value = response.data.data;
    } catch (error) {
        console.error('Error fetching provinces:', error);
    }
}

async function fetchCities() {
    try {
        const response = await axiosIns.get('/api/tele/cities');
        cityList.value = response.data.data;
    } catch (error) {
        console.error('Error fetching cities:', error);
    }
}

// Only the cities in the chosen province. With no province chosen the list is
// empty rather than "all", so the field cannot be filled with a city that
// contradicts the province above it.
const citiesInProvince = computed(() => {
    if (selectedProvPsgc.value === null || selectedProvPsgc.value === '')
        return [];

    const target = Number(selectedProvPsgc.value);

    return cityList.value.filter(c => Number(c.prov_psgc) === target);
});

// Only a handful of provinces have their cities loaded (municipal_cities covers
// Region XII). Rather than present an empty dropdown for the rest, the field
// falls back to free text so the address can still be recorded.
const cityIsFreeText = computed(() =>
    selectedProvPsgc.value !== null && selectedProvPsgc.value !== '' && citiesInProvince.value.length === 0);

function onProvinceChange(psgc: string | number | null) {
    selectedProvPsgc.value = psgc ?? null;

    const match = provinceList.value.find(p => Number(p.prov_psgc) === Number(psgc));

    covids.value.province = match?.prov_name ?? '';

    // The old city almost certainly is not in the new province.
    covids.value.municipal = '';
}

function onCityChange(psgc: string | number | null) {
    const match = cityList.value.find(c => Number(c.muni_psgc) === Number(psgc));

    covids.value.municipal = match?.muni_name ?? '';
}

// The stored values are names, so restore the dropdown selections by matching on
// name after a fetch. Anything that does not match — the free text these columns
// used to collect — is left in place and simply shows as unselected.
const selectedCityPsgc = computed(() =>
    cityList.value.find(c => c.muni_name === covids.value.municipal)?.muni_psgc ?? null);

function syncAddressSelections() {
    const prov = provinceList.value.find(p => p.prov_name === covids.value.province);

    selectedProvPsgc.value = prov?.prov_psgc ?? null;
}


// Props — so this form can be reused for different calls
const props = defineProps({
    consultId: {
        type: Number,
        required: false,
    },
});

const covids = ref({
    meeting_id: props.consultId ?? '',
    employers_name: '',
    place_of_work: '',
    house_bldg_name: '',
    street: '',
    municipal: '',
    province: '',
    country_id: DEFAULT_COUNTRY_ID,
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
    list_name_occasion: 'N/A'
});

const clinas = ref({
    meeting_id: props.consultId ?? '',
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
        .map(contact => `{${contact.name},${contact.number}}`)
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

// v-ifs changed — fixed: use covids.value / clinas.value (they are refs)
watch(() => covids.value.known_covid_case, (newVal) => {
    if (newVal !== 1) {
        covids.value.date_contact_known_covid_case = '';
    }
});

watch(() => clinas.value.days_14_prior_expose, (newVal) => {
    if (newVal !== 1) {
        clinas.value.days_14_date_onset_illness = '';
    }
    if (newVal !== 0) {
        clinas.value.place_quarantine = '';
    }
});

// Clear accommodation sub-fields when accomodation !== 1
watch(() => covids.value.accomodation, (newVal) => {
    if (newVal !== 1) {
        covids.value.acco_specify_type = '';
        covids.value.acco_address = '';
        covids.value.acco_date_last_expose = '';
        covids.value.acco_name = '';
        covids.value.acco_name_type = '';
    }
});

// Clear food establishment sub-fields when food_establishment !== 1
watch(() => covids.value.food_establishment, (newVal) => {
    if (newVal !== 1) {
        covids.value.food_es_specify_type = '';
        covids.value.food_es_address = '';
        covids.value.food_es_date_last_expose = '';
        covids.value.food_es_name = '';
        covids.value.food_es_name_type = '';
    }
});

// Clear store sub-fields when store !== 1
watch(() => covids.value.store, (newVal) => {
    if (newVal !== 1) {
        covids.value.store_specify_type = '';
        covids.value.store_address = '';
        covids.value.store_date_last_expose = '';
        covids.value.store_name = '';
        covids.value.store_name_type = '';
    }
});

// Clear facility sub-fields when facility !== 1
watch(() => covids.value.facility, (newVal) => {
    if (newVal !== 1) {
        covids.value.fac_specify_type = '';
        covids.value.fac_address = '';
        covids.value.fac_significant_other = '';
        covids.value.fac_date_last_expose = '';
        covids.value.fac_name = '';
        covids.value.fac_name_type = '';
    }
});

// Clear event sub-fields when event !== 1
watch(() => covids.value.event, (newVal) => {
    if (newVal !== 1) {
        covids.value.event_specify_type = '';
        covids.value.event_date_last_expose = '';
        covids.value.event_place = '';
    }
});

// Clear workplace sub-fields when workplace !== 1
watch(() => covids.value.workplace, (newVal) => {
    if (newVal !== 1) {
        covids.value.wp_company_name = '';
        covids.value.wp_date_last_expose = '';
        covids.value.wp_address = '';
    }
});

// Clear xray_date when xray !== 1
watch(() => clinas.value.xray, (newVal) => {
    if (newVal !== 1) {
        clinas.value.xray_date = '';
    }
});

// Clear lmp when pregnant !== 1
watch(() => clinas.value.pregnant, (newVal) => {
    if (newVal !== 1) {
        clinas.value.lmp = '';
    }
});

// Clear history_specify when history_illness !== 1
watch(() => clinas.value.history_illness, (newVal) => {
    if (newVal !== 1) {
        clinas.value.history_specify = '';
    }
});

//save/update
async function fetchMeetingInfo() {
    try {
        // Whether each record already exists decides if the next save can send only
        // changed fields, or must send everything to satisfy NOT NULL columns.
        let cvExists = false;
        let caExists = false;

        // 🔹 Step 3: Try to fetch existing covid screening
        if (covids.value.meeting_id) {
            const cvResponse = await axiosIns.get(`/api/get-covidscreening/${covids.value.meeting_id}`);
            const cv = cvResponse.data.data;

            cvExists = !!cv;

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
                covids.value.country_id = cv.country_id ?? DEFAULT_COUNTRY_ID;
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
                covids.value.store = Number(cv.store) ?? null; //number because varchar in db
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

                //contacts explode
                if (cv.list_name_occasion) {
                    const matches = cv.list_name_occasion.match(/\{([^}]+)\}/g) || [];
                    contactList.value = matches.map(item => {
                        const [number, name] = item.replace(/[{}]/g, '').split(',');
                        return {
                            name: number?.trim() || '',
                            number: name?.trim() || '',
                        };
                    });
                } else {
                    contactList.value = [];
                }

            } else {
                console.log("ℹ️ No covid screening found for this meeting ID.");
            }
        }

        // 🔹 Step 4: Try to fetch existing covid assessment
        if (clinas.value.meeting_id) {
            const caResponse = await axiosIns.get(`/api/get-covidassessment/${clinas.value.meeting_id}`);
            const ca = caResponse.data.data;

            caExists = !!ca;

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

                // ✅ Scrum list
                if (clinas.value.scrum) {
                    const matches = clinas.value.scrum.match(/\{([^}]+)\}/g) || [];
                    scrumList.value = matches.map(item => ({
                        scrum: item.replace(/[{}]/g, '').trim() || '',
                    }));
                } else {
                    scrumList.value = [];
                }

                // ✅ Oro Naso Swab list
                if (clinas.value.oro_naso_swab) {
                    const matches = clinas.value.oro_naso_swab.match(/\{([^}]+)\}/g) || [];
                    oroNasoSwabList.value = matches.map(item => ({
                        oro_naso_swab: item.replace(/[{}]/g, '').trim() || '',
                    }));
                } else {
                    oroNasoSwabList.value = [];
                }

                // ✅ Special Others list
                if (clinas.value.spe_others) {
                    const matches = clinas.value.spe_others.match(/\{([^}]+)\}/g) || [];
                    speOthersList.value = matches.map(item => ({
                        spe_others: item.replace(/[{}]/g, '').trim() || '',
                    }));
                } else {
                    speOthersList.value = [];
                }

            } else {
                console.log("ℹ️ No covid assessment found for this meeting ID.");
            }
        }

        // Baseline for working out what is dirty on the next save.
        // setRecordExists decides whether the next save can narrow to changed fields,
        // or must send everything to satisfy the tables' NOT NULL columns on INSERT.
        // Stored province/municipal are names; map them back onto the dropdowns.
        syncAddressSelections();

        cvTracker.setRecordExists(cvExists);
        caTracker.setRecordExists(caExists);
        cvTracker.markClean();
        caTracker.markClean();

    } catch (error) {
        console.error("❌ Error fetching covid screening info:", error);
        errorMessage.value = "Failed to load covid screening info.";
        isError.value = true;
    } finally {
        emit('loaded');
    }
}


onMounted(() => {
    if (props.consultId) fetchMeetingInfo();
    fetchCountries();
    fetchProvinces();
    fetchCities();

    if (covids.value.list_name_occasion) {
        const parts = covids.value.list_name_occasion.split(',');
        const pairs = [];
        for (let i = 0; i < parts.length; i += 2) {
            pairs.push({
                name: parts[i] || '',
                number: parts[i + 1] || ''
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

// Payload shapes kept exactly as they were, now reusable so dirtiness can be
// measured against what the API actually receives rather than the raw models.

// Collaborative editing — see useFormSync. This card holds two records (COVID-19
// screening and clinical assessment) but is one form to the user and to the other
// participant, so there is a single presence/refetch channel and one dirty tracker
// per record.
//
// Trackers sit on the payload shapes, not the raw models: several fields are
// renamed or normalised on the way out, and the assessment payload carries arrays
// (contacts, specimens) that are mutated in place — the tracker compares by value
// for exactly that reason.
const { connected, remoteEditor, notifySaved, setEditing } = useFormSync({
  form: 'covid_screening',
  editorName: computed(() => user.value?.name ?? 'Other user'),
  onRemoteSave: () => fetchMeetingInfo(),
})

const cvTracker = useDirtyTracker(computed(() => cvPayload()), ['meeting_id'])
const caTracker = useDirtyTracker(computed(() => caPayload()), ['meeting_id'])

const isEditing = ref(false);

// Announce edit mode both ways, so the other side's banner appears and clears.
watch(isEditing, editing => setEditing(editing))
function cvPayload() {
    return {
            meeting_id: covids.value.meeting_id,
            employers_name: covids.value.employers_name ?? null,
            place_of_work: covids.value.place_of_work ?? null,
            house_bldg_name: covids.value.house_bldg_name ?? null,
            street: covids.value.street ?? null,
            municipal: covids.value.municipal ?? null,
            province: covids.value.province ?? null,
            country_id: covids.value.country_id ?? null,
            office_phone_no: covids.value.office_phone_no ?? null,
            cellphone_no: covids.value.cellphone_no ?? null,
            history_travel_country_symptoms: covids.value.history_travel_country_symptoms ?? null,
            port_of_exit: covids.value.port_of_exit ?? null,
            airline_sea_vessel: covids.value.airline_sea_vessel ?? null,
            flight_vessel_no: covids.value.flight_vessel_no ?? null,
            date_departure: covids.value.date_departure ?? null,
            date_arrival_ph: covids.value.date_arrival_ph ?? null,
            known_covid_case: covids.value.known_covid_case ?? null,
            date_contact_known_covid_case: covids.value.date_contact_known_covid_case ?? null,
            accomodation: covids.value.accomodation ?? null,
            acco_specify_type: covids.value.acco_specify_type ?? null,
            acco_address: covids.value.acco_address ?? null,
            acco_date_last_expose: covids.value.acco_date_last_expose ?? null,
            acco_name: covids.value.acco_name ?? null,
            acco_name_type: covids.value.acco_name_type ?? null,
            food_establishment: covids.value.food_establishment ?? null,
            food_es_specify_type: covids.value.food_es_specify_type ?? null,
            food_es_address: covids.value.food_es_address ?? null,
            food_es_date_last_expose: covids.value.food_es_date_last_expose ?? null,
            food_es_name: covids.value.food_es_name ?? null,
            food_es_name_type: covids.value.food_es_name_type ?? null,
            store: covids.value.store ?? null,
            store_specify_type: covids.value.store_specify_type ?? null,
            store_address: covids.value.store_address ?? null,
            store_date_last_expose: covids.value.store_date_last_expose ?? null,
            store_name: covids.value.store_name ?? null,
            store_name_type: covids.value.store_name_type ?? null,
            facility: covids.value.facility ?? null,
            fac_specify_type: covids.value.fac_specify_type ?? null,
            fac_address: covids.value.fac_address ?? null,
            fac_date_last_expose: covids.value.fac_date_last_expose ?? null,
            fac_name: covids.value.fac_name ?? null,
            fac_name_type: covids.value.fac_name_type ?? null,
            fac_significant_other: covids.value.fac_significant_other ?? null,
            event: covids.value.event ?? null,
            event_specify_type: covids.value.event_specify_type ?? null,
            event_date_last_expose: covids.value.event_date_last_expose ?? null,
            event_place: covids.value.event_place ?? null,
            workplace: covids.value.workplace ?? null,
            wp_company_name: covids.value.wp_company_name ?? null,
            wp_date_last_expose: covids.value.wp_date_last_expose ?? null,
            wp_address: covids.value.wp_address ?? null,
            list_name_occasion: covids.value.list_name_occasion ?? null
    };
}

function caPayload() {
    return {
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
}

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
        // Only the changed fields — a full payload would carry our stale copy of
        // whatever the other participant just edited and overwrite it.
        const changed = cvTracker.dirty();

        if (Object.keys(changed).length) {
            await axiosIns.post('/api/save-covidscreening', {
                meeting_id: covids.value.meeting_id,
                ...changed,
            });
            // The row is there now, so later saves can narrow to what changed.
            cvTracker.setRecordExists(true);
            cvTracker.markClean();
        }

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
        // Only the changed fields — a full payload would carry our stale copy of
        // whatever the other participant just edited and overwrite it.
        const changed = caTracker.dirty();

        if (Object.keys(changed).length) {
            await axiosIns.post('/api/save-covidassessment', {
                meeting_id: clinas.value.meeting_id,
                ...changed,
            });
            // The row is there now, so later saves can narrow to what changed.
            caTracker.setRecordExists(true);
            caTracker.markClean();
        }

        // Both records save from this one card, so announce once, here.
        notifySaved();

        // Success response handling
        setTimeout(function () {
            successMessage.value = "Saved covid-19 assessment.";
        }, 1050);
        isSuccess.value = true;
        cancelEdit();


    } catch (error) {
        console.error("Error Saving covid-19 assessment:", error);
        setTimeout(function () {
            errorMessage.value = "Failed to save covid-19 assessment.";
        }, 1050);
        isError.value = true;

    }
}

const requiredValidator = (v: any) => (v !== '' && v !== null && v !== undefined) || 'This field is required';
const requiredRadio = (v: any) => (v === 0 || v === 1 || v === 2) ? true : 'This field is required';
const phoneValidator = (v: string) => !v || /^[0-9+\-\s()]{7,15}$/.test(v) || 'Enter a valid phone number';
const dateValidator = (v: string) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v) || 'Enter a valid date';

// Computed visibility flags — sub-fields shown only when parent = Yes (1)
const travelYes = computed(() => covids.value.history_travel_country_symptoms === 1);
const knownCovidYes = computed(() => covids.value.known_covid_case === 1);
const accoYes = computed(() => covids.value.accomodation === 1);
const foodYes = computed(() => covids.value.food_establishment === 1);
const storeYes = computed(() => covids.value.store === 1);
const facilityYes = computed(() => covids.value.facility === 1);
const eventYes = computed(() => covids.value.event === 1);
const workplaceYes = computed(() => covids.value.workplace === 1);
const prior14Yes = computed(() => clinas.value.days_14_prior_expose === 1);
const prior14No = computed(() => clinas.value.days_14_prior_expose === 0);
const xrayYes = computed(() => clinas.value.xray === 1);
const pregnantYes = computed(() => clinas.value.pregnant === 1);
const historyIllnessYes = computed(() => clinas.value.history_illness === 1);


function cancelEdit() {
    isEditing.value = false;
}

</script>

<template>
    <VForm ref="cvdform" style="align-self: stretch; width: 100%;">
    <VAlert v-if="remoteEditor" type="warning" variant="tonal" density="compact" class="mb-3 form-remote-editing">
      {{ remoteEditor }} is editing this form. It will refresh when they save.
    </VAlert>
        <VTooltip v-if="isEditing == true" text="Save" location="top">
            <template #activator="{ props }">
                <VBtn v-bind="props" variant="tonal" color="success" icon="tabler-device-floppy" size="48"
                    class="fab-fixed-botr" @click="() => { saveUpdateCV(); saveUpdateCA() }" />
            </template>
        </VTooltip>
        <VTooltip v-if="isEditing == true" text="Cancel" location="top">
            <template #activator="{ props }">
                <VBtn v-bind="props" variant="tonal" color="error" icon="tabler-x" size="48"
                    class="fab-fixed-botr mr-15" @click="cancelEdit" />
            </template>
        </VTooltip>
        <VTooltip v-if="isEditing == false" text="Edit" location="top">
            <template #activator="{ props }">
                <VBtn v-bind="props" variant="tonal" color="success" icon="tabler-edit" size="48" class="fab-fixed-botr"
                    rounded @click="isEditing = true" />
            </template>
        </VTooltip>
        <!-- <pre>{{ covids }}{{ clinas }}</pre> -->
        <div class="d-flex flex-column justify-center">
        </div>
        <br></br>
        <VRow style="background-color:rgba(244, 67, 54, 0.15); padding: 10px;" class="rounded">
            <Vcol>
                <span class=" text-h5 font-weight-medium mb-2" style="color:#ff7b71;">
                    Overseas Employment Address(for Overseas Filipino Workers)
                </span>
            </Vcol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="covids.employers_name" outlined dense label="Employer's Name"
                    :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }">

                </VTextField>
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="covids.place_of_work" outlined dense label="Place of Work" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                </VTextField>
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="covids.house_bldg_name" outlined dense label="House #/Bldg Name:"
                    :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="covids.street" outlined dense label="Street:" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }" />
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <!-- Province drives the city list below via PSGC. -->
                <VAutocomplete :model-value="selectedProvPsgc" :items="provinceList" item-title="prov_name"
                    item-value="prov_psgc" label="Province/State:" outlined dense clearable
                    :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }"
                    @update:model-value="onProvinceChange" />
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <!-- Most provinces have no cities loaded, so the field switches to free text
                     rather than showing a dropdown that can never be satisfied. -->
                <VTextField v-if="cityIsFreeText" v-model="covids.municipal" outlined dense
                    label="City/Municipality:" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }"
                    hint="No city list available for this province — type the name." persistent-hint />
                <VAutocomplete v-else :model-value="selectedCityPsgc" :items="citiesInProvince"
                    item-title="muni_name" item-value="muni_psgc" label="City/Municipality:"
                    outlined dense clearable :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }"
                    no-data-text="Select a province first"
                    @update:model-value="onCityChange" />
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VAutocomplete v-model="covids.country_id" :items="countrylist" item-title="en_short_name"
                    item-value="num_code" label="Country:" outlined dense clearable persistent-hint
                    :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="covids.office_phone_no" outlined dense :rules="[phoneValidator]"
                    :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" label="Office Phone No.">
                </VTextField>
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="covids.cellphone_no" outlined dense :rules="[phoneValidator]"
                    :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" label="Cellphon No.">
                </VTextField>
            </VCol>
        </VRow>
        <br />
        <br />
        <VRow style="background-color:rgba(244, 67, 54, 0.15);padding: 10px;" class="rounded">
            <Vcol>
                <span class=" text-h5 font-weight-medium mb-2" style="color:#ff7b71">
                    Travel History
                </span>
            </Vcol>
        </VRow>
        <VRow class="align-center">
            <VCol>
                <label class="req-label">
                    History of Travel/Visit/Work in other countries with known COVID-19 transmission
                    14 days prior to onset of signs and symptoms
                </label>
                <VRadioGroup v-model="covids.history_travel_country_symptoms" inline density="compact"
                    :rules="[v => v === 0 || v === 1 ? true : 'This field is required']" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <VRadio label="Yes" :value="1" />
                    <VRadio label="No" :value="0" />
                </VRadioGroup>
            </VCol>
        </VRow>
        <!-- Travel sub-fields: only shown when history_travel = Yes -->
        <template v-if="travelYes">
            <VRow>
                <VCol>
                    <VTextField v-model="covids.port_of_exit" outlined dense
                        :rules="travelYes ? [requiredValidator] : []" :readonly="!isEditing"
                        :class="{ 'custom-disabled': !isEditing }">
                        <template #label><span class="req-label">Port of Exit</span></template>
                    </VTextField>
                </VCol>
            </VRow>
            <VRow>
                <VCol>
                    <VTextField v-model="covids.airline_sea_vessel" outlined dense
                        :rules="travelYes ? [requiredValidator] : []" :readonly="!isEditing"
                        :class="{ 'custom-disabled': !isEditing }">
                        <template #label><span class="req-label">Airline/Sea Vessel</span></template>
                    </VTextField>
                </VCol>
            </VRow>
            <VRow>
                <VCol>
                    <VTextField v-model="covids.flight_vessel_no" outlined dense :readonly="!isEditing"
                        :class="{ 'custom-disabled': !isEditing }">
                        <template #label><span>Flight/Vessel #</span></template>
                    </VTextField>
                </VCol>
            </VRow>
            <VRow>
                <VCol>
                    <VTextField type="date" v-model="covids.date_departure" outlined dense
                        :rules="travelYes ? [requiredValidator, dateValidator] : []" :readonly="!isEditing"
                        :class="{ 'custom-disabled': !isEditing }">
                        <template #label><span class="req-label">Date of Departure</span></template>
                    </VTextField>
                </VCol>
            </VRow>
            <VRow>
                <VCol>
                    <VTextField type="date" v-model="covids.date_arrival_ph" outlined dense
                        :rules="travelYes ? [requiredValidator, dateValidator] : []" :readonly="!isEditing"
                        :class="{ 'custom-disabled': !isEditing }">
                        <template #label><span class="req-label">Date of Arrival in Philippines</span></template>
                    </VTextField>
                </VCol>
            </VRow>
        </template>
        <template v-else-if="covids.history_travel_country_symptoms === 0">
            <!-- Hidden placeholders when No: still need spacer so layout is consistent -->
        </template>
        <br />
        <br />
        <VRow style="background-color:rgba(244, 67, 54, 0.15); padding: 10px;" class="rounded">
            <Vcol>
                <span class=" text-h5 font-weight-medium mb-2" style="color:#ff7b71">
                    Exposure History
                </span>
            </Vcol>
        </VRow>
        <VRow class="align-center" flex>
            <VCol>
                <div class="d-flex align-center">
                    <label>
                        Known Covid-19 Case:
                    </label>

                    <VRadioGroup v-model="covids.known_covid_case" inline density="compact" :readonly="!isEditing"
                        :class="{ 'custom-disabled': !isEditing }" :rules="[
                            v => v === 0 || v === 1 || v === 2 ? true : 'This field is required']">
                        <VRadio label="Yes" :value="1" />
                        <VRadio label="No" :value="0" />
                        <VRadio label="Unknown" :value="2" />
                    </VRadioGroup>
                </div>
                <br />
                <VTextField type="date" v-if="knownCovidYes" v-model="covids.date_contact_known_covid_case" outlined
                    dense :rules="knownCovidYes ? [requiredValidator, dateValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">(If yes) Date of Contact with Known Covid-19
                            Case</span></template>
                </VTextField>
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

                    <VRadioGroup v-model="covids.accomodation" inline density="compact" :rules="[
                        v => v === 0 || v === 1 || v === 2 ? true : 'This field is required']" :readonly="!isEditing"
                        :class="{ 'custom-disabled': !isEditing }">
                        <VRadio label="Yes" :value="1" />
                        <VRadio label="No" :value="0" />
                        <VRadio label="Unknown" :value="2" />
                    </VRadioGroup>
                </div>

                <VTextField v-if="accoYes" v-model="covids.acco_specify_type" outlined dense class="mt-2"
                    :rules="accoYes ? [requiredValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Specific Type</span></template>
                </VTextField>
                <VTextField v-if="accoYes" v-model="covids.acco_address" outlined dense class="mt-2"
                    :rules="accoYes ? [requiredValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Address</span></template>
                </VTextField>
                <VTextField v-if="accoYes" type="date" v-model="covids.acco_date_last_expose" outlined dense
                    class="mt-2" :rules="accoYes ? [requiredValidator, dateValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Date of Last Exposure</span></template>
                </VTextField>
                <VTextField v-if="accoYes" v-model="covids.acco_name" outlined dense class="mt-2"
                    :rules="accoYes ? [requiredValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Name</span></template>
                </VTextField>
                <VRadioGroup v-if="accoYes" v-model="covids.acco_name_type" inline density="compact" class="pt-2"
                    :rules="accoYes ? [requiredRadio] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <VRadio label="Owner" :value="0" />
                    <VRadio label="Staff" :value="1" />
                    <VRadio label="Guest" :value="2" />
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

                    <VRadioGroup v-model="covids.food_establishment" inline density="compact" :rules="[
                        v => v === 0 || v === 1 || v === 2 ? true : 'This field is required']" :readonly="!isEditing"
                        :class="{ 'custom-disabled': !isEditing }">
                        <VRadio label=" Yes" :value="1" />
                        <VRadio label="No" :value="0" />
                        <VRadio label="Unknown" :value="2" />
                    </VRadioGroup>
                </div>

                <VTextField v-if="foodYes" v-model="covids.food_es_specify_type" outlined dense class="mt-2"
                    :rules="foodYes ? [requiredValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Specific Type</span></template>
                </VTextField>
                <VTextField v-if="foodYes" v-model="covids.food_es_address" outlined dense class="mt-2"
                    :rules="foodYes ? [requiredValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Address</span></template>
                </VTextField>
                <VTextField v-if="foodYes" type="date" v-model="covids.food_es_date_last_expose" outlined dense
                    class="mt-2" :rules="foodYes ? [requiredValidator, dateValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Date of Last Exposure</span></template>
                </VTextField>
                <VTextField v-if="foodYes" v-model="covids.food_es_name" outlined dense class="mt-2"
                    :rules="foodYes ? [requiredValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Name</span></template>
                </VTextField>
                <VRadioGroup v-if="foodYes" v-model="covids.food_es_name_type" inline density="compact" class="pt-2"
                    :rules="foodYes ? [requiredRadio] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <VRadio label="Owner" :value="0" />
                    <VRadio label="Staff" :value="1" />
                    <VRadio label="Customer" :value="2" />
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

                    <VRadioGroup v-model="covids.store" inline density="compact" :rules="[
                        v => v === 0 || v === 1 || v === 2 ? true : 'This field is required']" :readonly="!isEditing"
                        :class="{ 'custom-disabled': !isEditing }">
                        <VRadio label=" Yes" :value="1" />
                        <VRadio label="No" :value="0" />
                        <VRadio label="Unknown" :value="2" />
                    </VRadioGroup>
                </div>

                <VTextField v-if="storeYes" v-model="covids.store_specify_type" outlined dense class="mt-2"
                    :rules="storeYes ? [requiredValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Specific Type</span></template>
                </VTextField>
                <VTextField v-if="storeYes" v-model="covids.store_address" outlined dense class="mt-2"
                    :rules="storeYes ? [requiredValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Address</span></template>
                </VTextField>
                <VTextField v-if="storeYes" type="date" v-model="covids.store_date_last_expose" outlined dense
                    class="mt-2" :rules="storeYes ? [requiredValidator, dateValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Date of Last Exposure</span></template>
                </VTextField>
                <VTextField v-if="storeYes" v-model="covids.store_name" outlined dense class="mt-2"
                    :rules="storeYes ? [requiredValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Name</span></template>
                </VTextField>
                <VRadioGroup v-if="storeYes" v-model="covids.store_name_type" inline density="compact" class="pt-2"
                    :rules="storeYes ? [requiredRadio] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <VRadio label="Owner" :value="0" />
                    <VRadio label="Staff" :value="1" />
                    <VRadio label="Customer" :value="2" />
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

                    <VRadioGroup v-model="covids.facility" inline density="compact" :rules="[
                        v => v === 0 || v === 1 || v === 2 ? true : 'This field is required']" :readonly="!isEditing"
                        :class="{ 'custom-disabled': !isEditing }">
                        <VRadio label=" Yes" :value="1" />
                        <VRadio label="No" :value="0" />
                        <VRadio label="Unknown" :value="2" />
                    </VRadioGroup>
                </div>

                <VTextField v-if="facilityYes" v-model="covids.fac_specify_type" outlined dense class="mt-2"
                    :rules="facilityYes ? [requiredValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Specific Type</span></template>
                </VTextField>
                <VTextField v-if="facilityYes" v-model="covids.fac_address" outlined dense class="mt-2"
                    :rules="facilityYes ? [requiredValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Address</span></template>
                </VTextField>
                <VTextField v-if="facilityYes" v-model="covids.fac_significant_other" outlined dense class="mt-2"
                    :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span>Significant Other</span></template>
                </VTextField>
                <VTextField v-if="facilityYes" type="date" v-model="covids.fac_date_last_expose" outlined dense
                    class="mt-2" :rules="facilityYes ? [requiredValidator, dateValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Date of Last Exposure</span></template>
                </VTextField>
                <VTextField v-if="facilityYes" v-model="covids.fac_name" outlined dense class="mt-2"
                    :rules="facilityYes ? [requiredValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Name</span></template>
                </VTextField>
                <VRadioGroup v-if="facilityYes" v-model="covids.fac_name_type" inline density="compact" class="pt-2"
                    :rules="facilityYes ? [requiredRadio] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <VRadio label="Patient" :value="0" />
                    <VRadio label="Visitor" :value="1" />
                    <VRadio label="Staff" :value="2" />
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

                    <VRadioGroup v-model="covids.event" inline density="compact" :rules="[
                        v => v === 0 || v === 1 || v === 2 ? true : 'This field is required']" :readonly="!isEditing"
                        :class="{ 'custom-disabled': !isEditing }">
                        <VRadio label=" Yes" :value="1" />
                        <VRadio label="No" :value="0" />
                        <VRadio label="Unknown" :value="2" />
                    </VRadioGroup>
                </div>

                <VTextField v-if="eventYes" v-model="covids.event_specify_type" outlined dense class="mt-2"
                    :rules="eventYes ? [requiredValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Specific Type</span></template>
                </VTextField>
                <VTextField v-if="eventYes" type="date" v-model="covids.event_date_last_expose" outlined dense
                    class="mt-2" :rules="eventYes ? [requiredValidator, dateValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Date of last Exposure</span></template>
                </VTextField>
                <VTextField v-if="eventYes" v-model="covids.event_place" outlined dense class="mt-2"
                    :rules="eventYes ? [requiredValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Event Place</span></template>
                </VTextField>
            </VCol>
        </VRow>

        <!-- Workplace -->
        <VDivider />
        <br />
        <VRow class="mb-4">
            <VCol>
                <div class="d-flex align-center gap-3">
                    <label class="text-body-1 font-weight-medium">Workplace</label>

                    <VRadioGroup v-model="covids.workplace" inline density="compact" :rules="[
                        v => v === 0 || v === 1 || v === 2 ? true : 'This field is required']" :readonly="!isEditing"
                        :class="{ 'custom-disabled': !isEditing }">
                        <VRadio label=" Yes" :value="1" />
                        <VRadio label="No" :value="0" />
                        <VRadio label="Unknown" :value="2" />
                    </VRadioGroup>
                </div>

                <VTextField v-if="workplaceYes" v-model="covids.wp_company_name" outlined dense class="mt-2"
                    :rules="workplaceYes ? [requiredValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Company Name</span></template>
                </VTextField>
                <VTextField v-if="workplaceYes" type="date" v-model="covids.wp_date_last_expose" outlined dense
                    class="mt-2" :rules="workplaceYes ? [requiredValidator, dateValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Date of last Exposure</span></template>
                </VTextField>
                <VTextField v-if="workplaceYes" v-model="covids.wp_address" outlined dense class="mt-2"
                    :rules="workplaceYes ? [requiredValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Address</span></template>
                </VTextField>
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
                        <VTextField v-model="contact.name" label="Name" outlined dense :readonly="!isEditing"
                            :class="{ 'custom-disabled': !isEditing }" />
                    </VCol>

                    <!-- Contact Number Field -->
                    <VCol cols="5">
                        <VTextField v-model="contact.number" label="Contact Number" outlined dense
                            :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
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
                        <VBtn color="primary" @click="addContact" :disabled="!isEditing">
                            Add Contact
                        </VBtn>
                    </VCol>
                </VRow>
            </VCol>
            <VDivider />
        </VRow>
        <br />
        <br />
        <VRow style="background-color:rgba(244, 67, 54, 0.15); padding: 10px;" class="rounded">
            <Vcol>
                <span class=" text-h5 font-weight-medium mb-2" style="color:#ff7b71">
                    Clinical Assessment
                </span>
            </Vcol>
        </VRow>
        <VRow>
            <VCol>
                <VRow>
                    <div class="d-flex align-center" style="padding-left: 10px;">
                        <label>
                            14 days PRIOR to first date of Exposure:
                        </label>
                        <VRadioGroup v-model="clinas.days_14_prior_expose" inline density="compact" :rules="[
                            v => v === 0 || v === 1 ? true : 'This field is required']" :readonly="!isEditing"
                            :class="{ 'custom-disabled': !isEditing }">
                            <VRadio label=" Yes" :value="1" />
                            <VRadio label="No" :value="0" />
                        </VRadioGroup>
                    </div>
                </VRow>
                <VRow v-if="prior14Yes">
                    <VCol>
                        <VTextField type="date" v-model="clinas.days_14_date_onset_illness" outlined dense
                            :rules="prior14Yes ? [requiredValidator, dateValidator] : []" :readonly="!isEditing"
                            :class="{ 'custom-disabled': !isEditing }">
                            <template #label><span class="req-label">(If yes) Date of onset of illness</span></template>
                        </VTextField>
                    </VCol>
                </VRow>
                <VRow v-if="prior14No" class="align-center">
                    <VCol>
                        <div class="d-flex align-center">
                            <label class="text-body-1 font-weight-medium me-2">(If no) Place of Quarantine:</label>
                            <VCheckbox v-model="clinas.place_quarantine" label="Home" :value="1" :false-value="0"
                                density="compact" :readonly="!isEditing"
                                :class="{ 'custom-disabled': !isEditing }" />
                        </div>
                    </VCol>
                </VRow>
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="clinas.quarantine_facility" outlined dense label="Quarantine Facility:"
                    :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
            </VCol>
        </VRow>
        <VRow class="align-center" flex>
            <VCol>
                <VRow>
                    <div class="d-flex align-center" style="padding-left: 10px;">
                        <label>
                            Anytime during date of Exposure:
                        </label>

                        <VRadioGroup v-model="clinas.anytime_during_expose" inline density="compact" :rules="[
                            v => v === 0 || v === 1 ? true : 'This field is required']" :readonly="!isEditing"
                            :class="{ 'custom-disabled': !isEditing }">
                            <VRadio label=" Yes" :value="1" />
                            <VRadio label="No" :value="0" />
                        </VRadioGroup>
                    </div>
                </VRow>
                <VRow>
                    <VCol>
                        <VTextField v-model="clinas.name_facility" outlined dense
                            label="Name of Referral Health Facility:" :readonly="!isEditing"
                            :class="{ 'custom-disabled': !isEditing }" />
                    </VCol>
                    <VCol>
                        <VTextField type="date" v-model="clinas.referral_date" outlined dense label="Date of Referral:"
                            :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
                    </VCol>
                </VRow>
            </VCol>
            <VDivider />
        </VRow>
        <VRow>
            <VCol>
                <VTextField type="number" v-model="clinas.fever" outlined dense label="Fever(°C):" suffix="°C"
                    :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
            </VCol>
            <VCol class="align-center" flex>
                <!-- false-value is 0, not Vuetify's default boolean false: these columns
                     are int and MySQL rejects 'false' once a box is unticked. -->
                <VCheckbox v-model="clinas.cough" label="Cough" :value="1" :false-value="0" density="compact"
                    :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
            </VCol>
            <VCol class="align-center" flex>
                <VCheckbox v-model="clinas.colds" label="Colds" :value="1" :false-value="0" density="compact"
                    :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
            </VCol>
            <VCol class="align-center" flex>
                <VCheckbox v-model="clinas.sore_throat" label="Sore Throat" :value="1" :false-value="0"
                    density="compact" :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
            </VCol>
            <VDivider />
        </VRow>
        <VRow>
            <VCol cols="12" md="2">
                <VCheckbox v-model="clinas.diarrhea" label="Diarrhea" :value="1" :false-value="0" density="compact"
                    :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
            </VCol>
            <VCol cols="12" md="6">
                <VCheckbox v-model="clinas.short_breathing" label="Shortness/Difficulty of breathing" :value="1"
                    :false-value="0" density="compact" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }" />
            </VCol>
            <VCol>
                <VTextField v-model="clinas.other_symptoms" outlined dense label="Other Symptoms Specify:"
                    :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
            </VCol>
            <VDivider />
        </VRow>
        <VRow>
            <VCol cols="12" md="5">
                <VRadioGroup v-model="clinas.history_illness" inline density="compact"
                    label="History of underlying illness/condition:" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <VRadio label="Yes" :value="1" />
                    <VRadio label="No" :value="0" />
                </VRadioGroup>
                <VTextField v-if="historyIllnessYes" v-model="clinas.history_specify" outlined dense class="mt-1"
                    :rules="historyIllnessYes ? [requiredValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Specify Illness</span></template>
                </VTextField>
            </VCol>
            <VCol>
                <VRadioGroup v-model="clinas.xray" inline density="compact" label="Chest Xray Done?:"
                    :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }">
                    <VRadio label="Yes" :value="1" />
                    <VRadio label="No" :value="0" />
                </VRadioGroup>
                <VTextField v-if="xrayYes" type="date" v-model="clinas.xray_date" outlined dense class="mt-1"
                    :rules="xrayYes ? [requiredValidator, dateValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Date of Chest X-ray</span></template>
                </VTextField>
            </VCol>
            <VCol>
                <VRadioGroup v-model="clinas.pregnant" inline density="compact" label="Are you pregnant?:"
                    :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }">
                    <VRadio label=" Yes" :value="1" />
                    <VRadio label="No" :value="0" />
                </VRadioGroup>
                <VTextField v-if="pregnantYes" type="date" v-model="clinas.lmp" outlined dense class="mt-1"
                    :rules="pregnantYes ? [requiredValidator, dateValidator] : []" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }">
                    <template #label><span class="req-label">Last Menstrual Period (LMP)</span></template>
                </VTextField>
            </VCol>
            <VDivider />
        </VRow>
        <VRow>
            <VCol cols="12" md="7">
                <div class="d-flex align-center" style="padding-left: 10px;">
                    <label>
                        CXR Results:
                    </label>
                    <VRadioGroup v-model="clinas.cxr_result" inline density="compact" :readonly="!isEditing"
                        :class="{ 'custom-disabled': !isEditing }">
                        <VRadio label="Yes" :value="1" />
                        <VRadio label="No" :value="0" />
                        <VRadio label="Pending" :value="2" />
                    </VRadioGroup>
                </div>
            </VCol>
            <VCol cols="12" md="5">
                <VTextField v-model="clinas.radiologic_findings" outlined dense label="Other Radiologic Findings:"
                    :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
            </VCol>
        </VRow>
        <br />
        <br />
        <VRow style="background-color:rgba(244, 67, 54, 0.15); padding: 10px;" class="rounded">
            <Vcol>
                <span class=" text-h5 font-weight-medium mb-2" style="color:#ff7b71">
                    Specimen Information
                </span>
            </Vcol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="clinas.specimen_collected" outlined dense label="Specimen Collected:"
                    :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
            </VCol>
            <VCol>
                <VTextField type="date" v-model="clinas.date_collected" outlined dense label="Date Collected:"
                    :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField type="date" v-model="clinas.date_sent_ritm" outlined dense
                    label="Date Sent to RITM or any accredited laboratory:" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }" />
            </VCol>
            <VCol>
                <VTextField type="date" v-model="clinas.date_received_ritm" outlined dense
                    label="Date Received in RITM:" :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
            </VCol>
        </VRow>
        <VRow>
            <VCol>
                <VTextField v-model="clinas.virus_isolation_result" outlined dense label="Virus Isolation Result:"
                    :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
            </VCol>
            <VCol>
                <VTextField v-model="clinas.rt_pcr_result" outlined dense label="RT-PCR Result:" :readonly="!isEditing"
                    :class="{ 'custom-disabled': !isEditing }" />
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
                        <VTextField v-model="scrum.scrum" :placeholder="'__/__'" persistent-hint outlined dense
                            :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
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
                        <VBtn color="primary" @click="addScrum" :disabled="!isEditing">
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
                        <VTextField v-model="item.oro_naso_swab" :placeholder="'__/__'" outlined dense
                            :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
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
                        <VBtn color="primary" @click="addOroNasoSwab" :disabled="!isEditing">
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
                        <VTextField v-model="item.spe_others" :placeholder="'__/__'" outlined dense
                            :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
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
                        <VBtn color="primary" @click="addSpeOthers" :disabled="!isEditing">
                            Add Rows
                        </VBtn>
                    </VCol>
                </VRow>
            </VCol>
            <VDivider />
        </VRow>
        <br />
        <br />
        <VRow style="background-color:rgba(244, 67, 54, 0.15); padding: 10px;" class="rounded">
            <Vcol>
                <span class=" text-h5 font-weight-medium mb-2" style="color:#ff7b71">
                    Classification
                </span>
            </Vcol>
        </VRow>
        <br />
        <br />
        <VRow>
            <Vcol>
                <VRadioGroup v-model="clinas.classification" inline density="compact" style="padding-left: 10px;"
                    :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }">
                    <VRadio label="Suspect Case " :value="0" />
                    <VRadio label="Probable Case " :value="1" />
                    <VRadio label="Confirmed Case" :value="2" />
                </VRadioGroup>
            </Vcol>
        </VRow>
        <br />
        <br />
        <VRow style="background-color:rgba(244, 67, 54, 0.15); padding: 10px;" class="rounded">
            <Vcol>
                <span class=" text-h5 font-weight-medium mb-2" style="color:#ff7b71">
                    Outcome
                </span>
            </Vcol>
        </VRow>
        <br />
        <br />
        <VRow>
            <VCol cols="6">
                <VTextField type="date" v-model="clinas.outcome_date_discharge" outlined dense
                    label="Date of Discharge:" :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }" />
            </VCol>
            <Vcol cols="6">
                <VRadioGroup v-model="clinas.outcome_condition_discharge" label="Condition on Discharge " column
                    style="padding-left: 10px;" :readonly="!isEditing" :class="{ 'custom-disabled': !isEditing }">
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

<style>

/*
  Shown while the other participant is in edit mode. Deliberately loud: it is the
  only warning that this form is about to be refreshed out from under you, taking
  any unsaved typing with it.
*/
.form-remote-editing {
  border: 2px solid #ff6d00;
  color: #ff6d00 !important;
  font-weight: 800;
  letter-spacing: 0.02em;

  /* Black outline keeps the orange readable — the drawer sits over the video feed,
     so the backdrop behind it is unpredictable. */
  text-shadow:
    -1px -1px 0 #000,
    1px -1px 0 #000,
    -1px 1px 0 #000,
    1px 1px 0 #000;
}
.req-label::after {
    content: " *";
    color: #f44336;
    font-weight: bold;
}

.custom-disabled {
    opacity: 0.6;
    pointer-events: none;
}
</style>
