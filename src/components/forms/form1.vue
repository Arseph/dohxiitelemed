<script setup lang="ts">
import { ref } from "vue";
import { VCol, VRow } from "vuetify/lib/components/index.mjs";

interface ConsentOption {
  label: string;
  value: string;
}

const telemed = ref({
  pconsent: null as boolean | null, // default null, can be true/false
  acmpny: null as boolean | null, // default null, can be true/false
});
</script>

<template>
  <VCard class="overflow-x-auto overflow-y-auto" style="max-height: 500px; width: max-content; min-width: 100%;">
    <div class="d-flex flex-column justify-center">
      <!-- <h5><pre>{{ user }}</pre></h5> -->
    </div>
    <br></br>
    <VRow>
      <VCol cols="12" md="6">
        <VTextField outlined dense hide-details label="Name of physician:" />
      </VCol>
      <VCol cols="12" md="6" class="centered-col">
        <VTextField
          type="date"
          outlined
          dense
          hide-details
          label="Date and Time of Teleconsultation"
        />
      </VCol>
    </VRow>
    <VRow>
      <VCol cols="12" md="6">
        <VTextField
          outlined
          dense
          hide-details
          label="Name and Address of Health Facility (if applicable):"
        />
      </VCol>
      <VCol cols="12" md="6" class="centered-col">
        <VTextField
          label="Name of Telemedicine Partner (if applicable):"
          outlined
          dense
          hint="If none, Indicate telemedicine platform being used:"
        />
      </VCol>
    </VRow>
    <VRow class="align-center">
      <VCol>
        <VRadioGroup
          v-model="telemed.pconsent"
          label="Prior to teleconsultation proper, obtain patient consent:"
          inline
        >
          <VRadio label="Yes" :value="true" />
          <VRadio label="No" :value="false" />
        </VRadioGroup>
      </VCol>
    </VRow>
    <VRow class="align-center">
      <VCol>
        <VRadioGroup
          v-model="telemed.acmpny"
          label="Is patient accompanied/assisted by another person during the consultation: "
          inline
        >
          <VRadio label="Yes" :value="true" />
          <VRadio label="No" :value="false" />
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
          <VTextField
            v-model="telemed.caseNo"
            outlined
            dense
            hide-details
            style="max-width: 200px"
          />
        </div>
      </VCol>
    </VRow>
    <VRow class="align-center">
      <VCol>
        <VSelect
          v-model="telemed.philhealthStatus"
          :items="['Member', 'Dependent', 'None']"
          label="PhilHealth Status:"
          outlined
          dense
          hide-details
        />
      </VCol>
      <VCol>
        <VTextField
          outlined
          dense
          hide-details
          label="PhilHealth ID:"
          disabled
        />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField outlined dense hide-details label="First Name: " />
      </VCol>
      <VCol>
        <VTextField outlined dense hide-details label="Middle Name: " />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField outlined dense hide-details label="Last Name: " />
      </VCol>
      <VCol>
        <VTextField outlined dense hide-details label="Contact Number: " />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField
          type="date"
          outlined
          dense
          hide-details
          label="Birth Date: "
        />
      </VCol>
      <VCol>
        <VSelect
          v-model="telemed.sex"
          :items="['Male', 'Female']"
          label="Sex:"
          outlined
          dense
          hide-details
        />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VSelect
          v-model="telemed.cvlstat"
          :items="['Single', 'Married', 'Divorced', 'Separated']"
          label="Civil Status:"
          outlined
          dense
          hide-details
        />
      </VCol>
      <VCol>
        <VTextField outlined dense hide-details label="Religion: " />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VSelect
          v-model="telemed.edu"
          :items="[
            'NOT APPLICABLE',
            'COLLEGE',
            'ELEMENTARY EDUCATION',
            'HIGH SCHOOL EDUCATION',
            'NO FORMAL EDUCATION',
            'POSTGRADUATE PROGRAM',
            'VOCATIONAL',
          ]"
          label="Educational Attainment: "
          outlined
          dense
          hide-details
        />
      </VCol>
      <VCol>
        <VTextField outlined dense hide-details label="Occupation: " />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField outlined dense hide-details label="Monthly Income: " />
      </VCol>
      <VCol>
        <VSelect
          v-model="telemed.slcid"
          :items="[
            'NOT APPLICABLE',
            'UMID',
            'DRIVERS LICENSE',
            'PASSPORT ID',
            'POSTAL ID',
            'TIN ID',
          ]"
          label="Select ID: "
          outlined
          dense
          hide-details
        />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField outlined dense hide-details label="CRN: " />
      </VCol>
      <VCol>
        <VSelect
          v-model="telemed.ntnlty"
          :items="['Filipino', 'others']"
          label="Nationality: "
          outlined
          dense
          hide-details
        />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField outlined dense hide-details label="House no./Lot/Bldg: " />
      </VCol>
      <VCol>
        <VTextField outlined dense hide-details label="Street: " />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VTextField outlined dense hide-details label="Region: " />
      </VCol>
      <VCol>
        <VSelect
          v-model="telemed.prvnc"
          :items="['SOUTH COTABATO', 'others']"
          label="Province: "
          outlined
          dense
          hide-details
        />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <VSelect
          v-model="telemed.mncpl"
          :items="['KORONADAL', 'others']"
          label="Municipality: "
          outlined
          dense
          hide-details
        />
      </VCol>
      <VCol>
        <VSelect
          v-model="telemed.brgy"
          :items="['PARAISO', 'others']"
          label="Barangay: "
          outlined
          dense
          hide-details
        />
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <label>Complete Address :</label>
        <VTextField v-model="telemed.cmpltad" outlined />
      </VCol>
    </VRow>
  </VCard>
</template>
