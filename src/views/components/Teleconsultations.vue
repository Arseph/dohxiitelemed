<script lang="ts" setup>
import { computed, reactive, ref } from "vue";
import { VCard, VCol, VRow } from "vuetify/lib/components/index.mjs";
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
    { title: "Type of Consultation", key: "category_name", style: "width:200px" },
    { title: "Chief Complaint", key: "title", style: "width:250px" },
    { title: "Attending Provider", key: "doctor_name", style: "width:200px" },
    { title: "Actions", key: "actions", sortable: false, style: "width:120px" },
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
const tab = ref(0);

function openDetails(item) {
    // store the actual object, not a nested ref
    selectedMeeting.value = { ...item };
    showTabs.value = true;
    tab.value = 1; // optional: first tab, but your tabs start at id=1
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
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}


</script>

<template>
    <Transition name="slide-y-transition" mode="out-in">

        <!-- TABLE VIEW -->
        <VCard v-if="!showTabs" key="table-view">
            <VRow>
                <VCol>
                    <span class="text-h4">Teleconsultations</span>
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

                <!-- Actions Column -->
                <template #item.actions="{ item }">
                    <VBtn size="small" class="btn-blue" variant="tonal" @click="openDetails(item)">
                        Details
                    </VBtn>
                </template>

            </VDataTable>
        </VCard>


        <!-- DETAILS VIEW -->
        <VCard v-else key="details-view">
            <VRow>
                <VCol>
                    <VBtn color="grey" variant="tonal" class="mb-4" @click="showTabs = false">
                        ← Back
                    </VBtn>
                </VCol>
            </VRow>
            <VRow>
                <VCol>
                    <VRow>
                        <VCol class="text-h3">
                            Teleconsultation Details
                        </VCol>
                    </VRow>

                    <VRow dense>
                        <VCol class="text-subtitle-1 text-warning">
                            Chief Complaint: <span class="font-weight-bold">{{ selectedMeeting?.title ?? '-' }}</span>
                        </VCol>
                    </VRow>

                    <VRow dense>
                        <VCol class="text-subtitle-2">
                            Date: <span class="font-weight-bold">{{ formatMeetingDate2(selectedMeeting?.date_meeting)
                                }}</span>
                        </VCol>
                    </VRow>

                    <VRow dense>
                        <VCol class="text-subtitle-2">
                            Time: <span class="font-weight-bold">{{ formatMeetingTime(selectedMeeting?.from_time)
                                }}</span>
                        </VCol>
                    </VRow>

                    <VRow dense>
                        <VCol class="text-subtitle-2">
                            Type of Consultation: <span class="font-weight-bold">{{ selectedMeeting?.category_name ??
                                '-'
                                }}</span>
                        </VCol>
                    </VRow>

                    <VRow dense>
                        <VCol class="text-subtitle-2">
                            Attending Provider: <span class="font-weight-bold">{{ selectedMeeting?.doctor_name ?? '-'
                                }}</span>
                        </VCol>
                    </VRow>
                </VCol>

                <VCol>
                    <VRow>
                        <VCol class="text-h3">
                            Teleconsultation Forms
                        </VCol>
                    </VRow>
                    <VRow>
                        <VCol>
                            <VTabs v-model="tab" background-color="grey lighten-3" height="48" grow="false"
                                variant="text" direction="vertical">
                                <VTab v-for="card in cards" :key="card.id" :value="card.id" :class="`btn-${card.color}`"
                                    style="min-width: 100px;">
                                    <VIcon v-if="card.icon" :icon="card.icon" start size="20" class="mr-1" />
                                    {{ card.title }}
                                </VTab>
                            </VTabs>
                        </VCol>
                    </VRow>
                </VCol>
            </VRow>

            <br />
            <VCard> <!-- Window Content -->
                <VWindow v-model="tab">
                    <VWindowItem v-for="card in cards" :key="card.id" :value="card.id">
                        <component :is="card.component" :meeting="selectedMeeting" />
                    </VWindowItem>
                </VWindow>
            </VCard>

        </VCard>

    </Transition>
</template>
