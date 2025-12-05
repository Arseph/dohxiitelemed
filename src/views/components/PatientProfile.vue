<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { VAvatar, VCol, VForm, VIcon, VRow, VTab, VTabs, VWindow, VWindowItem } from "vuetify/components";
import EditPatientProfile from "./EditPatientProfile.vue";
import Teleconsultations from "./Teleconsultations.vue";
import MedicalHistory from "./MedicalHistory.vue";


const props = defineProps({
    patient: { type: Object, required: true },
});

const emit = defineEmits(["close", "updated", "saved"]);

// Reactive copy of patient for dynamic updates
const localPatient = reactive({ ...props.patient });

// Watch for prop changes from parent
watch(
    () => props.patient,
    (newVal) => {
        Object.assign(localPatient, newVal);
    },
    { immediate: true }
);

const activeTab = ref("profile"); // default active tab

// Civil status options for mapping
const civilStatusOptions = [
    { title: "Single", value: "0" },
    { title: "Married", value: "1" },
    { title: "Widowed", value: "2" },
    { title: "Separated", value: "3" },
    { title: "Divorced", value: "4" },
];

// Computed title display for civil status, normalize both
const civilStatusTitle = computed(() => {
    if (!localPatient.civil_stat_code) return "";

    const code = String(localPatient.civil_stat_code).toLowerCase(); // normalize
    const match = civilStatusOptions.find(
        (item) => String(item.value).toLowerCase() === code
    );

    return match ? match.title : "";
});


function handlePatientUpdated(updatedPatient: any) {
    Object.assign(localPatient, updatedPatient);
    emit("close");
    emit("saved");
}

const getImageUrl = (path: string) => {
    if (!path) return "";
    return `${import.meta.env.VITE_APP_BACKEND_URL}/${path}`;
};

const isHidden = ref(false);

const profileKey = ref(0);

watch(activeTab, (val) => {
    if (val === 'profile') {
        profileKey.value++ }
    });

</script>

<template>
    <VForm>
        <VRow>
            <!-- Left Column: Sidebar Info -->
            <Transition name="slide-left">
                <VCol cols="12" md="3" v-if="!isHidden" style="position: sticky; top: 0; height: 100%; overflow: hidden;">
                    <VRow>
                        <!-- <pre>{{ localPatient }}</pre> -->
                        <VCol class="text-center">
                            <VAvatar size="175" class="mx-auto elevation-1 avatar-border-blue" rounded="lg"
                                variant="tonal">
                                <template v-if="previewImage || localPatient.pat_image">
                                    <img :src="previewImage || getImageUrl(localPatient.pat_image)"
                                        alt="Profile Picture"
                                        style="width: 100%; height: 100%; object-fit: contain; object-position: center;" />
                                </template>
                                <template v-else>
                                    <VIcon icon="tabler-user-circle" size="126" color="blue-grey-darken-2" />
                                </template>
                            </VAvatar>
                        </VCol>
                    </VRow>
                    <VRow dense>
                        <VCol dense class="text-h6">
                            {{ localPatient.name }}
                        </VCol>
                    </VRow>
                    <VRow dense>
                        <VCol>{{ localPatient.age }} old</VCol>
                    </VRow>
                    <VRow dense>
                        <VCol>Date of Birth: <b>{{ localPatient.dob_formatted }}</b></VCol>
                    </VRow>
                    <VRow dense>
                        <VCol>Sex: <b>{{ localPatient.sex_code }}</b></VCol>
                    </VRow>
                    <VRow dense>
                        <VCol>Civil Status: <b>{{ civilStatusTitle }}</b></VCol>
                    </VRow>
                    <!-- Tabs -->
                    <VRow class="mt-4">
                        <VCol cols="12">
                            <VTabs v-model="activeTab" class="royalblue-tabs" direction="vertical"
                                background-color="transparent">
                                <VTab class="royalblue-tab" value="profile">
                                    <VIcon class="tab-icon" start icon="tabler-user" />
                                    Profile
                                </VTab>
                                <VTab class="royalblue-tab" value="teleconsultations">
                                    <VIcon class="tab-icon" start icon="tabler-video" />
                                    Teleconsultations
                                </VTab>
                                <VTab class="royalblue-tab" value="medicalhistory">
                                    <VIcon class="tab-icon" start icon="tabler-video" />
                                    Medical History
                                </VTab>
                            </VTabs>
                        </VCol>
                    </VRow>
                </VCol>
            </Transition>
            <VDivider vertical length="100%" v-if="!isHidden" />
            <!-- Right Column: Tab Content -->
            <Transition name="fade-slide">
                <VCol>
                    <div class="right-scroll-container">
                        <VWindow v-model="activeTab" class="mt-2" direction="vertical">

                            <!-- Profile Tab -->
                            <VWindowItem value="profile" v-show="activeTab === 'profile'">
                                <EditPatientProfile :key="profileKey" :patient="localPatient"
                                    @updated="handlePatientUpdated" />
                            </VWindowItem>

                            <!-- Teleconsultations Tab -->
                            <VWindowItem value="teleconsultations" v-show="activeTab === 'teleconsultations'">
                                <Teleconsultations :patient="localPatient" @updated="handlePatientUpdated"
                                    @hideColumn="isHidden = $event" />
                            </VWindowItem>
                            
                            <VWindowItem value="medicalhistory" v-show="activeTab === 'medicalhistory'">
                                <MedicalHistory :patient="localPatient" @updated="handlePatientUpdated"
                                    @hideColumn="isHidden = $event" />
                            </VWindowItem>
                        </VWindow>
                    </div>
                </VCol>
            </Transition>
        </VRow>
    </VForm>
</template>
