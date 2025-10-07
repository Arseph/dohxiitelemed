<script setup lang="ts">
import {
    VCheckbox,
    VCol,
    VDivider,
    VRow,
    VSelect
} from "vuetify/lib/components/index.mjs";

import { reactive, ref } from 'vue';

const scrumRows = ref([{ field1: '', field2: '', field3: '' }])
const oroRows = ref([{ field1: '', field2: '', field3: '' }])
const otherRows = ref([{ field1: '', field2: '', field3: '' }])

function addRow(section) {
    section.push({ field1: '', field2: '', field3: '' })
}

function removeRow(section, index) {
    section.splice(index, 1)
}

const sections = [
    {
        label: 'Accommodation:',
        model: 'accommodation',
        roles: [
            { label: 'Guest', value: 'guest' },
            { label: 'Hotel Worker', value: 'hotel_worker' },
        ],
    },
    {
        label: 'Food Establishment:',
        model: 'food_establishment',
        roles: [
            { label: 'Diner', value: 'diner' },
            { label: 'Crew', value: 'crew' },
        ],
    },
    {
        label: 'Store:',
        model: 'store',
        roles: [
            { label: 'Customer', value: 'customer' },
            { label: 'Worker', value: 'worker' },
        ],
    },
    {
        label: 'Health Facility:',
        model: 'health_facility',
        roles: [
            { label: 'Patient', value: 'patient' },
            { label: 'Health Worker', value: 'health_worker' },
        ],
    },
]

const telemed = reactive({
    accommodation: { main: null, role: null },
    food_establishment: { main: null, role: null },
    store: { main: null, role: null },
    health_facility: { main: null, role: null },
    pconsent: null as boolean | null, // default null, can be true/false
    acmpny: null as boolean | null, // default null, can be true/false
})

interface ConsentOption {
    label: string;
    value: string;
}

</script>

<template>
    <div class="d-flex flex-column justify-center">
        <!-- <h5><pre>{{ user }}</pre></h5> -->
    </div>
    <br></br>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Employer's Name:" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Place Of Work:" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="House #/Bldg Name:" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Street:" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="City/Municipality:" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Province/State:" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VSelect v-model="telemed.cntry" :items="['Member', 'Dependent', 'None']" label="Country: " outlined dense
                hide-details />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Office Phone No:" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Office Cellphone No:" />
        </VCol>
    </VRow>
    <br></br>
    <VRow class="align-center">
        <VCol>
            <br>
            <h5 class="text-h5 font-weight-medium mb-2">Travel History</h5>
        </VCol>
    </VRow>
    <VRow class="align-center">
        <VCol>
            <label>
                History of Travel/Visit/Work in other countries with known COVID-19 transmission
                14 days prior to onset of signs and symptoms:
            </label>

            <VRadioGroup v-model="telemed.pconsent" inline hide-details density="compact">
                <VRadio label="Yes" :value="true" />
                <VRadio label="No" :value="false" />
            </VRadioGroup>
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Port of Exit:" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Airline/Sea Vessel:o:" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Flight/Vessel #:" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Date of Departure:" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Date of Arrival in Philippines:" />
        </VCol>
    </VRow>
    <br></br>
    <VRow class="align-center">
        <VCol>
            <br>
            <h5 class="text-h5 font-weight-medium mb-2">Exposure History</h5>
        </VCol>
    </VRow>
    <VRow class="align-center" flex>
        <VCol>
            <div class="d-flex align-center">
                <label>
                    Known Covid-19 Case:
                </label>

                <VRadioGroup v-model="telemed.cvd" inline hide-details density="compact">
                    <VRadio label="Yes" :value="true" />
                    <VRadio label="No" :value="false" />
                    <VRadio label="Unknown" :value="unknown" />
                </VRadioGroup>
            </div>
            <VTextField outlined dense hide-details label="(If yes) Date of Contact with Known Covid-19 Case:"
                disabled />
        </VCol>
    </VRow>
    <div>
        <VRow v-for="(section, index) in sections" :key="index" class="mb-4">
            <VDivider />
            <VCol>
                <!-- Top label + first radios -->
                <div class="d-flex align-center gap-3">
                    <label class="text-body-2 font-weight-medium">
                        {{ section.label }}
                    </label>

                    <VRadioGroup v-model="telemed[section.model].main" inline hide-details density="compact">
                        <VRadio label="Yes" :value="true" />
                        <VRadio label="No" :value="false" />
                        <VRadio label="Unknown" value="unknown" />
                    </VRadioGroup>
                </div>

                <!-- Text fields -->
                <VTextField outlined dense hide-details label="Specific Type:" class="mt-2" />
                <VTextField outlined dense hide-details label="Address:" class="mt-2" />
                <!-- Conditionally render the extra field -->
                <VTextField v-if="index === 2" outlined dense hide-details label="Significant Other:" class="mt-2" />
                <VTextField outlined dense hide-details label="Date of Last Exposure:" class="mt-2" />
                <VTextField outlined dense hide-details label="Name:" class="mt-2" />

                <!-- Bottom radios -->
                <VRadioGroup v-model="telemed[section.model].role" inline hide-details density="compact" class="pt-2">
                    <VRadio v-for="(option, i) in section.roles" :key="i" :label="option.label" :value="option.value" />
                </VRadioGroup>
            </VCol>
        </VRow>
    </div>
    <VDivider />
    <br></br>
    <VRow class="align-center" flex>
        <VCol>
            <div class="d-flex align-center">
                <label>
                    Event:
                </label>

                <VRadioGroup v-model="telemed.evnt" inline hide-details density="compact">
                    <VRadio label="Yes" :value="true" />
                    <VRadio label="No" :value="false" />
                    <VRadio label="Unknown" :value="unknown" />
                </VRadioGroup>
            </div>
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Specific Type:" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Address:" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Event Place:" />
        </VCol>
    </VRow>
    <br></br>
    <VDivider />
    <br></br>
    <VRow class="align-center" flex>
        <VCol>
            <div class="d-flex align-center">
                <label>
                    Workplace:
                </label>

                <VRadioGroup v-model="telemed.wrkplc" inline hide-details density="compact">
                    <VRadio label="Yes" :value="true" />
                    <VRadio label="No" :value="false" />
                    <VRadio label="Unknown" :value="unknown" />
                </VRadioGroup>
            </div>
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Company Name:" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Date of Last Exposure:" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Address:" />
        </VCol>
    </VRow>
    <br></br>
    <VRow class="align-center">
        <VCol>
            <br>
            <h5 class="text-h5 font-weight-medium mb-2">Clinical Assessment</h5>
        </VCol>
    </VRow>
    <VRow class="align-center" flex>
        <VCol>
            <div class="d-flex align-center">
                <label>
                    14 days PRIOR to first date of Exposure:
                </label>

                <VRadioGroup v-model="telemed.expsr" inline hide-details density="compact">
                    <VRadio label="Yes" :value="true" />
                    <VRadio label="No" :value="false" />
                </VRadioGroup>
            </div>
        </VCol>
    </VRow>
    <VRow class="align-center" flex>
        <VCol>
            <div class="d-flex align-center">
                <label>
                    Anytime during date of Exposure:
                </label>

                <VRadioGroup v-model="telemed.expsrtm" inline hide-details density="compact">
                    <VRadio label="Yes" :value="true" />
                    <VRadio label="No" :value="false" />
                </VRadioGroup>
            </div>
            <VTextField outlined dense hide-details label="(If yes) Date of Contact with Known Covid-19 Case:"
                disabled />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Name of Referral Health Facility:" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Date of Referral:" />
        </VCol>
    </VRow>
    <VRow>
        <div class="d-column" style="padding: 10px;">
            <label>
                (If no) Place of Quarantine:
            </label>
            <VCheckbox v-model="telemed.qrntnplc" label="Home" :value="true" hide-details density="compact" />
        </div>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Quarantince Facility:" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Fever(°C):" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VCheckbox v-model="telemed.cough" label="Cough" :value="true" hide-details density="compact" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VCheckbox v-model="telemed.cold" label="Colds" :value="true" hide-details density="compact" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VCheckbox v-model="telemed.sorethroat" label="Sore Throat" :value="true" hide-details density="compact" />
        </VCol>
    </VRow>
    <VDivider />
    <br></br>
    <VRow>
        <VCol>
            <VCheckbox v-model="telemed.sorethroat" label="Diarrhea" :value="true" hide-details density="compact" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VCheckbox v-model="telemed.sorethroat" label="Shortness/Difficulty of breathing" :value="true" hide-details
                density="compact" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Other Symptoms Specify:" />
        </VCol>
    </VRow>
    <br></br>
    <VDivider />
    <br></br>
    <VRow class="align-center" flex>
        <VCol>
            <div class="d-flex align-center">
                <label>
                    Is there any history of other illness?:
                </label>

                <VRadioGroup v-model="telemed.otherill" inline hide-details density="compact">
                    <VRadio label="Yes" :value="true" />
                    <VRadio label="No" :value="false" />
                </VRadioGroup>
            </div>
        </VCol>
    </VRow>
    <VRow class="align-center" flex>
        <VCol>
            <div class="d-flex align-center">
                <label>
                    Chest Xray Done?:
                </label>

                <VRadioGroup v-model="telemed.chstxry" inline hide-details density="compact">
                    <VRadio label="Yes" :value="true" />
                    <VRadio label="No" :value="false" />
                </VRadioGroup>
            </div>
        </VCol>
    </VRow>
    <VRow class="align-center" flex>
        <VCol>
            <div class="d-flex align-center">
                <label>
                    Are you pregnant?:
                </label>

                <VRadioGroup v-model="telemed.prgnnt" inline hide-details density="compact">
                    <VRadio label="Yes" :value="true" />
                    <VRadio label="No" :value="false" />
                </VRadioGroup>
            </div>
        </VCol>
    </VRow>
    <br>
    <VDivider />
    <br>
    <VRow class="align-center" flex>
        <VCol>
            <div class="d-flex align-center">
                <label>
                    CXR Results:
                </label>

                <VRadioGroup v-model="telemed.prgnnt" inline hide-details density="compact">
                    <VRadio label="Yes" :value="true" />
                    <VRadio label="No" :value="false" />
                    <VRadio label="Pending" :value="pending" />
                </VRadioGroup>
            </div>
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Other Radiologic Findings:" />
        </VCol>
    </VRow>
    <VRow class="align-center">
        <VCol>
            <br>
            <h5 class="text-h5 font-weight-medium mb-2">Specimen Information</h5>
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Specimen Collected:" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Date Collected:" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Date Sent to RITM or any accredited laboratory:" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Date Received in RITM:" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Virus Isolation Result:" />
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="RT-PCR Result:" />
        </VCol>
    </VRow>
    <VContainer>

        <!-- SECTION 1: Scrum -->
        <VRow class="align-center mb-2">
            <VCol cols="auto">
                <strong>Scrum</strong>
            </VCol>
            <VCol cols="auto">
                <VBtn class="bg-success text-white" @click="addRow(scrumRows)">Add row</VBtn>
            </VCol>
        </VRow>

        <VRow v-for="(row, index) in scrumRows" :key="'scrum-' + index" class="align-center mb-2 border rounded p-2">
            <VCol>
                <VTextField v-model="row.field1" placeholder="Input 1" density="compact" hide-details />
            </VCol>
            <VCol>
                <VTextField v-model="row.field2" placeholder="Input 2" density="compact" hide-details />
            </VCol>
            <VCol>
                <VTextField v-model="row.field3" placeholder="Input 3" density="compact" hide-details />
            </VCol>
            <VCol cols="auto">
                <VBtn class="bg-error text-white" @click="removeRow(scrumRows, index)">Remove</VBtn>
            </VCol>
        </VRow>
        <!-- SECTION 2: Tasks -->
        <VRow class="align-center mb-2">
            <VCol cols="auto">
                <strong>Tasks</strong>
            </VCol>
            <VCol cols="auto">
                <VBtn class="bg-success text-white" @click="addRow(oroRows)">Add row</VBtn>
            </VCol>
        </VRow>

        <VRow v-for="(row, index) in oroRows" :key="'task-' + index" class="align-center mb-2 border rounded p-2">
            <VCol>
                <VTextField v-model="row.field1" placeholder="Input 1" density="compact" hide-details />
            </VCol>
            <VCol>
                <VTextField v-model="row.field2" placeholder="Input 2" density="compact" hide-details />
            </VCol>
            <VCol>
                <VTextField v-model="row.field3" placeholder="Input 3" density="compact" hide-details />
            </VCol>
            <VCol cols="auto">
                <VBtn class="bg-error text-white" @click="removeRow(oroRows, index)">Remove</VBtn>
            </VCol>
        </VRow>
        <!-- SECTION 3: Meetings -->
        <VRow class="align-center mb-2">
            <VCol cols="auto">
                <strong>Meetings</strong>
            </VCol>
            <VCol cols="auto">
                <VBtn class="bg-success text-white" @click="addRow(otherRows)">Add row</VBtn>
            </VCol>
        </VRow>

        <VRow v-for="(row, index) in otherRows" :key="'meeting-' + index" class="align-center mb-2 border rounded p-2">
            <VCol>
                <VTextField v-model="row.field1" placeholder="Input 1" density="compact" hide-details />
            </VCol>
            <VCol>
                <VTextField v-model="row.field2" placeholder="Input 2" density="compact" hide-details />
            </VCol>
            <VCol>
                <VTextField v-model="row.field3" placeholder="Input 3" density="compact" hide-details />
            </VCol>
            <VCol cols="auto">
                <VBtn class="bg-error text-white" @click="removeRow(otherRows, index)">Remove</VBtn>
            </VCol>
        </VRow>
    </VContainer>
    <VRow class="align-center">
        <VCol>
            <br>
            <h5 class="text-h5 font-weight-medium mb-2">Classification</h5>
        </VCol>
    </VRow>
    <VRow class="align-center" flex>
        <VCol>
            <div class="d-flex align-center">
                <VRadioGroup v-model="telemed.prgnnt" inline hide-details density="compact">
                    <VRadio label="Suspect Case" :value="suscase" />
                    <VRadio label="Probable Case" :value="procase" />
                    <VRadio label="Confirmed Case" :value="concase" />
                </VRadioGroup>
            </div>
        </VCol>
    </VRow>
    <VRow class="align-center">
        <VCol>
            <br>
            <h5 class="text-h5 font-weight-medium mb-2">Outcome</h5>
        </VCol>
    </VRow>
    <VRow>
        <VCol>
            <VTextField outlined dense hide-details label="Date of Discharge:" />
        </VCol>
    </VRow>
    <VRow class="align-center" flex>
        <VCol>
            <label>
                Condition on Discharge
            </label>
            <div class="d-flex align-center">
                <VRadioGroup v-model="telemed.prgnnt" inline hide-details density="compact">
                    <VRadio label="Died" :value="died" />
                    <VRadio label="Improved" :value="improve" />
                    <VRadio label="Recovered" :value="recoverd" />
                    <VRadio label="Transferred" :value="transfered" />
                    <VRadio label="Abscondeds" :value="abscondeds" />
                </VRadioGroup>
            </div>
        </VCol>
    </VRow>
</template>
