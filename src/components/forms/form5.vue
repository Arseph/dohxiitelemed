<script setup lang="ts">
import { ref } from "vue";
import { VCol, VRow, VTextField } from "vuetify/lib/components/index.mjs";

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
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Plan of Management:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Prescription:" disabled />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Referral:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Disposition:" />
    </VCol>
  </VRow>
  <VCard class="pa-4" elevation="2">
    <VSheet class="d-flex align-center justify-center border rounded" color="grey-lighten-3" height="150">
      <span class="text-grey">Signature pad will appear here</span>
    </VSheet>
  </VCard>
  <VTextField />
  <div class="d-flex align-center justify-center"><label>Name & Signature of Physician</label></div>
  <br></br>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="License #:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Professional Tax Receipt:" />
    </VCol>
  </VRow>
</template>
