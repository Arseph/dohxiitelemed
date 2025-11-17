<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { VAvatar, VCol, VDivider, VForm, VIcon, VRow, VTab, VTabs, VWindow, VWindowItem, } from "vuetify/components";
import EditPatientProfile from "./EditPatientProfile.vue";
import Teleconsultations from "./Teleconsultations.vue";

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
    { title: "Single", value: "s" },
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
</script>

<template>
    <VForm>
        <VRow>
            <!-- Left Column: Sidebar Info -->
            <VCol cols="12" md="4">
                <VRow>
                    <!-- <pre>{{ localPatient }}</pre> -->
                    <VCol class="text-center">
                        <VAvatar size="200" class="mx-auto elevation-1"
                            style="border: 3px solid #1976d2; border-radius: 50%; overflow: hidden;">
                            <template v-if="previewImage || localPatient.pat_image">
                                <img :src="previewImage || getImageUrl(localPatient.pat_image)" alt="Profile Picture"
                                    style="width: 100%; height: 100%; object-fit: contain; object-position: center;" />
                            </template>
                            <template v-else>
                                <VIcon icon="tabler-user-circle" size="126" color="blue-grey-darken-2" />
                            </template>
                        </VAvatar>
                    </VCol>
                </VRow>

                <VRow>
                    <VCol class="text-center">
                        <VDivider />
                        Patient Information
                        <VDivider />
                    </VCol>
                </VRow>

                <VRow>
                    <VCol>
                        <h3>{{ localPatient.name }}</h3>
                    </VCol>
                </VRow>
                <VRow>
                    <VCol>{{ localPatient.age }} old</VCol>
                </VRow>
                <VRow>
                    <VCol>Date of Birth: <b>{{ localPatient.dob_formatted }}</b></VCol>
                </VRow>
                <VRow>
                    <VCol>Sex: <b>{{ localPatient.sex_code }}</b></VCol>
                </VRow>
                <VRow>
                    <VCol>Civil Status: <b>{{ civilStatusTitle }}</b></VCol>
                </VRow>
                <!-- Sidebar Tabs -->
                <VRow class="mt-4">
                    <VCol cols="12">
                        <VTabs v-model="activeTab" class="royalblue-tabs" direction="vertical"
                            background-color="transparent">
                            <VTab class="royalblue-tab" value="profile">
                                <VIcon class="tab-icon" start icon="tabler-user" />
                                Profile
                            </VTab>
                            <VTab class="royalblue-tab" value="Teleconsultations">
                                <VIcon class="tab-icon" start icon="tabler-video" />
                                Teleconsultations
                            </VTab>
                        </VTabs>
                    </VCol>
                </VRow>
            </VCol>

            <!-- Right Column: Tab Content -->
            <VCol>
                <VWindow v-model="activeTab" class="mt-2" direction="vertical" transition="custom-fade"
                    reverse-transition="custom-fade">

                    <!-- Profile Tab -->
                    <VWindowItem value="profile" v-show="activeTab === 'profile'">
                        <EditPatientProfile :patient="localPatient" @updated="handlePatientUpdated" />
                    </VWindowItem>

                    <!-- Teleconsultations Tab -->
                    <VWindowItem value="Teleconsultations" v-show="activeTab === 'Teleconsultations'">
                        <Teleconsultations :patient="localPatient" @updated="handlePatientUpdated" />
                    </VWindowItem>
                </VWindow>
            </VCol>
        </VRow>
    </VForm>
</template>
