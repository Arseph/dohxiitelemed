<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import ErrorSnackbar from "@/components/snackbars/errors.vue";
import SuccessSnackbar from "@/components/snackbars/success.vue";
import { reactive, ref, watch } from "vue";
import { VAvatar, VCol, VDivider, VForm, VIcon, VRow, VTab, VTabs, VWindow, VWindowItem } from "vuetify/components";
import EditPatientProfile from "./EditPatientProfile.vue";
import Teleconsultations from "./Teleconsultations.vue";

const { isError, errorMessage, isSuccess, successMessage } = cStatus();

const props = defineProps({
    patient: { type: Object, required: true },
});
const emit = defineEmits(["close", "updated"]);

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

// Handle updates emitted from child component
function handlePatientUpdated(updatedPatient: any) {
    Object.assign(localPatient, updatedPatient);
    emit("updated", updatedPatient); // optional: bubble up
}

</script>

<template>
    <VForm>
        <VRow>
            <!-- Left Column: Sidebar Info -->
            <VCol cols="12" md="4">
                <VRow>
                    <VCol class="text-center">
                        <VAvatar color="blue-grey-lighten-4" size="100" class="mx-auto elevation-1">
                            <VIcon icon="tabler-user-circle" size="126" color="blue-grey-darken-2" />
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
                    <VCol>Civil Status: <b>{{ localPatient.civil_stat_code }}</b></VCol>
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

            <!-- Snackbars -->
            <ErrorSnackbar :message="errorMessage" :visible="isError" @update:visible="isError = $event" />
            <SuccessSnackbar :message="successMessage" :visible="isSuccess" @update:visible="isSuccess = $event" />

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
