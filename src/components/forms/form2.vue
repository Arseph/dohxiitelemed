<script setup lang="ts">
import { ref } from "vue";
import { VCol, VRow, VTextarea } from "vuetify/lib/components/index.mjs";

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
  <div class="d-flex flex-column justify-center">
  </div>
  <br></br>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Reason for Teleconsultation:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextField outlined dense hide-details label="Date of Onset of Illness:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VSelect v-model="telemed.refhlthfac" :items="['Member', 'Dependent', 'None']"
        label="Name of Referral Health Facility (if Applicable): " outlined dense hide-details />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Known Medical Condition/s & Medical History:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextField outlined dense hide-details label="Current Medications:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextField outlined dense hide-details label="Blood Type:" />
    </VCol>
  </VRow>
  <VRow class="align-center">
    <VCol>
      <h5 class="text-h5 font-weight-medium mb-2">Physical Examination(Inspection)</h5>
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Clinical Status at the Time of Consult:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Specific Findings:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Head:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextField outlined dense hide-details label="Conjunctiva (eye anatomy): " />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Conjunctiva Remarks:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextField outlined dense hide-details label="Neck:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Chest: " />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextField outlined dense hide-details label="Abdomen:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Abdomen Remarks: " />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextField outlined dense hide-details label="Genitals:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Genitals Remarks: " />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextField outlined dense hide-details label="Extremities:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Extremities Remarks: " />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Others: " />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Waist Circumference: " />
    </VCol>
  </VRow>
</template>
