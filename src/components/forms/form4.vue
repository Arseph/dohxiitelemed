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
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Summary of Assessment Findings:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea outlined dense hide-details auto-grow rows="2" label="Diagnosis:" />
    </VCol>
  </VRow>
  <VRow class="align-center" flex>
    <VCol class="d-flex align-center">
      <label>
        Clinical Classification:
      </label>
      <div class="d-flex align-center">
        <VRadioGroup v-model="telemed.prgnnt" inline hide-details density="compact">
          <VRadio label="Covid-19 Case" :value="cvd19case" />
          <VRadio label="Non-Covid-19 Case" :value="nncvd19case" />
        </VRadioGroup>
      </div>
    </VCol>
  </VRow>
</template>
