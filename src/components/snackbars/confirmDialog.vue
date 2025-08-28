<script lang="ts" setup>
import { computed, defineEmits, defineProps } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  title: String,
  text: String,
  actions: {
    type: Array,
    default: () => [
      { text: 'Cancel', color: 'secondary', value: false },
      { text: 'Confirm', color: 'primary', value: true },
    ],
  },
});

const emit = defineEmits(['update:modelValue', 'close']);
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const closeDialog = (value: any) => {
  emit('close', value);
  emit('update:modelValue', false);
};
</script>

<template>
    <VDialog
      v-model="dialogVisible"
      persistent
      width="350"
    >
      <VCard :title=title>
        <VCardText>{{ text }}</VCardText>
        <VCardText class="d-flex justify-end gap-3 flex-wrap">
            <VBtn
            v-for="(action, index) in actions"
            :key="index"
            :color="action.color"
            @click="closeDialog(action.value)"
          >
            {{ action.text }}
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>
  </template>
  
  