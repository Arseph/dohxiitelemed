<script setup lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import { useUser } from '@/composables/useUser';
import { ref } from "vue";
import { VForm } from 'vuetify/components/VForm';
import { VCol, VRow } from "vuetify/lib/components/index.mjs";

const cvdform = ref<VForm>();
const { user } = useUser();
const { isError, errorMessage, isSuccess, successMessage } = cStatus();

// Props — so this form can be reused for different calls
const props = defineProps({
  consultId: {
    type: Number,
    required: false,
  },
});

const diagass = ref({
  // savedID: props.consultId,
  meeting_id: '',
  summary: '',
  diagnosis: '',
  clinclass: '',
});



</script>

<template>
  <VRow>
    <VCol>
      <VTextarea v-model="diagass.summary" outlined dense hide-details auto-grow rows="2"
        label="Summary of Assessment Findings:" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VTextarea v-model="diagass.diagnosis" outlined dense hide-details auto-grow rows="2" label="Diagnosis:" />
    </VCol>
  </VRow>
  <VRow class="align-center" flex>
    <VCol class="d-flex align-center">
      <label>
        Clinical Classification:
      </label>
      <div class="d-flex align-center">
        <VRadioGroup v-model="diagass.clinclass" inline hide-details density="compact">
          <VRadio label="Covid-19 Case" :value="1" />
          <VRadio label="Non-Covid-19 Case" :value="0" />
        </VRadioGroup>
      </div>
    </VCol>
  </VRow>
</template>
