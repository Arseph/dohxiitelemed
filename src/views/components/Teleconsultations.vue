<script lang="ts" setup>
import { computed, reactive, ref } from "vue";
import { VCard, VCol, VContainer, VDivider, VRow } from "vuetify/lib/components/index.mjs";
import Form1 from "../../components/forms/form1.vue";
import Form2 from "../../components/forms/form2.vue";
import Form3 from "../../components/forms/form3.vue";
import Form4 from "../../components/forms/form4.vue";
import Form5 from "../../components/forms/form5.vue";

const props = defineProps({
    patient: { type: Object, required: true },
});

const isLoading = ref(false);

const localPatient = reactive({ ...props.patient });

const items = computed(() =>
    (localPatient.allmeetings ?? []).map((m) => ({
        ...m,
        category_name: m.doctor?.doccat?.category_name ?? "-",
        doctor_name: m.doctor
            ? `${m.doctor.lname}, ${m.doctor.fname}${m.doctor.mname ? ", " + m.doctor.mname : ""}`
            : "-",
    }))
);

const headers = [
    { title: "Date", key: "date_meeting", style: "width:120px" },
    { title: "Time", key: "from_time", style: "width:150px" },
    { title: "Type of Consultation", key: "category_name", style: "width:200px", align: 'center' },
    { title: "Chief Complaint", key: "title", style: "width:250px", align: 'center' },
    { title: "Attending Provider", key: "doctor_name", style: "width:200px", align: 'center' },
    { title: "Actions", key: "actions", sortable: false, style: "width:120px", align: 'center' },
];

// Card interface
interface CardItem {
    id: number;
    title: string;
    icon: string;
    color: string;
    component: any;
}

// Cards array
const cards = ref<CardItem[]>([
    { id: 1, title: 'Demographic Profile', icon: 'tabler-user', color: 'royalblue', component: Form1 },
    { id: 2, title: 'Clinical History & Physical Examination', icon: 'tabler-stethoscope', color: 'magenta', component: Form2 },
    { id: 3, title: 'COVID-19 Screening', icon: 'tabler-virus-search', color: 'red', component: Form3 },
    { id: 4, title: 'Diagnosis / Assessment', icon: 'tabler-notes', color: 'blue', component: Form4 },
    { id: 5, title: 'Plan of Management', icon: 'tabler-clipboard-check', color: 'green', component: Form5 },
]);


const showTabs = ref(false);
const selectedMeeting = ref(null);
const tab = ref(cards.value[0].id);
const formLoadingStates = reactive({
    1: false, // For Form1
    2: false, // For Form2
    3: false, // For Form3
    4: false, // For Form4
    5: false  // For Form5
});

function onChildLoaded(formId) {
    formLoadingStates[formId] = false; // Set the loading flag of the current form to false
}

function openDetails(item) {
    selectedMeeting.value = { ...item };
    showTabs.value = true;
    tab.value = 1; // Initial tab selected, adjust as needed.

    // Set all formLoading states to true when a new form is opened
    Object.keys(formLoadingStates).forEach(key => {
        formLoadingStates[key] = true;
    });

    emit('hideColumn', true);
}


function formatMeetingDate(date) {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}


function formatMeetingTime(time) {
    if (!time) return '-'
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })
}

function formatMeetingDate2(date) {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}




const emit = defineEmits(['hideColumn']);

const selectedTele = computed(() => {
    const meeting = selectedMeeting.value;
    return [
        {
            label: "Chief Complaint",
            value: meeting?.title ?? "-",
            class: "text-warning text-subtitle-1"
        },
        {
            label: "Date",
            value: formatMeetingDate2(meeting?.date_meeting),
            class: "text-subtitle-2"
        },
        {
            label: "Time",
            value: formatMeetingTime(meeting?.from_time),
            class: "text-subtitle-2"
        },
        {
            label: "Consultation Type",
            value: meeting?.category_name ?? "-",
            class: "text-subtitle-2"
        },
        {
            label: "Attending Provider",
            value: meeting?.doctor_name ?? "-",
            class: "text-subtitle-2"
        }
    ];
});


</script>

<template>
    <Transition name="slide-x-transition" mode="out-in">

        <!-- TABLE VIEW -->
        <VCard v-if="!showTabs" key="table-view">
            <VRow>
                <VCol>
                    <span class="text-h4">Teleconsultations</span>
                    <!-- <pre>{{ localPatient.allmeetings }}</pre> -->
                </VCol>
            </VRow>

            <VDataTable :headers="headers" :items="items" :loading="isLoading"
                class="elevation-1 rounded orange-table small-table" item-key="id" hover density="compact">

                <template #item.date_meeting="{ item }">
                    {{ formatMeetingDate(item.date_meeting) }}
                </template>

                <template #item.from_time="{ item }">
                    {{ formatMeetingTime(item.from_time) }}
                    -
                    {{ formatMeetingTime(item.to_time) }}
                </template>
                <template #item.category_name="{ item }">
                    <span class="d-flex text-left ml-5"> {{ item.category_name }}</span>
                </template>
                <template #item.title="{ item }">
                    <span class="d-flex text-left ml-5 "> {{ item.title }}</span>
                </template>
                <template #item.doctor_name="{ item }">
                    <span class="d-flex text-left ml-5"> {{ item.doctor_name }}</span>
                </template>
                <template #item.actions="{ item }">
                    <VBtn size="small" color="info" variant="text" @click="openDetails(item)">
                        Details
                    </VBtn>
                </template>

            </VDataTable>
        </VCard>

        <!-- DETAILS VIEW -->
        <VCard v-else key="details-view">
            <!-- <pre>{{ selectedMeeting.doctor.id }}</pre> -->
            <VRow>
                <VCol cols="12" md="3" style="position: sticky;top: 0;">
                    <VRow>
                        <VCol>
                            <VBtn color="warning" variant="tonal"
                                @click="() => { showTabs = false; emit('hideColumn', false); }" width="100%">
                                ← Back To Teleconsultations
                            </VBtn>
                        </VCol>
                    </VRow>
                    <VRow class="d-flex align-center justify-center">
                        <VCol class="text-h5">
                            Teleconsultation Details:
                            <br>

                            <v-list density="comfortable">
                                <v-list-item v-for="(item, i) in selectedTele" :key="i">
                                    <v-list-item-title :class="item.class">
                                        <v-icon size="small" icon="tabler-caret-right-filled" class="mr-1" />
                                        {{ item.label }}:
                                        <span class="font-weight-bold "> {{ item.value }}</span>
                                    </v-list-item-title>
                                </v-list-item>
                            </v-list></br>
                        </VCol>
                    </VRow>
                    <VRow dense>
                        <VCol>
                            <VRow dense>
                                <VCol class="d-flex justify-center text-h5 font-weight-bold">
                                    Forms
                                </VCol>
                                <VDivider horizontal />
                            </VRow>
                            <VRow>
                                <VCol>
                                    <VTabs v-model="tab" background-color="grey lighten-3" variant="text"
                                        direction="vertical">
                                        <VTab v-for="card in cards" :key="card.id" :value="card.id"
                                            :class="[`btn-${card.color}`, 'rounded-sm']" style="min-width: 100px;">
                                            <VIcon v-if="card.icon" :icon="card.icon" start size="20" />
                                            {{ card.title }}
                                        </VTab>
                                    </VTabs>
                                </VCol>
                            </VRow>

                        </VCol>
                    </VRow>
                </VCol>
                <VDivider vertical />
                <VCol class="right2-scroll">
                    <div class="right-scroll-container">
                        <VWindow v-model="tab" direction="vertical">
                            <VWindowItem v-for="card in cards" :key="card.id" :value="card.id">
                                <div :class="[`toolbar-${card.color}`, 'd-flex', 'align-center', 'px-4', 'py-2', 'justify-center', 'rounded-sm', 'text-h5']"
                                    style="position: sticky; top: 0; z-index: 10;">
                                    <VIcon v-if="card.icon" :icon="card.icon" class="mr-2" />
                                    {{ card.title }}
                                </div>

                                <!-- Loading State -->
                                <div v-if="formLoadingStates[card.id]" class="d-flex justify-center align-center"
                                    style="height: 200px;">
                                    <VProgressCircular indeterminate size="48" color="primary" />
                                </div>

                                <!-- Dynamic Form Component -->
                                <div class="pa-4" v-show="!formLoadingStates[card.id]">
                                    <component :is="card.component" :meeting="selectedMeeting"
                                        :consultId="selectedMeeting?.id" @loaded="onChildLoaded(card.id)" />
                                </div>
                            </VWindowItem>
                        </VWindow>
                    </div>
                </VCol>
            </VRow>
        </VCard>
    </Transition>
</template>
