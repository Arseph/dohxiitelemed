<template>
  <v-dialog v-model="isOpen" :max-width="dialogSize" persistent @update:modelValue="handleDialogClose">
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>
        <!-- Slot for dynamic content -->
        <slot></slot>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, defineEmits, defineProps, ref, watch } from 'vue';

// Define the types for props
const props = defineProps<{
  show: boolean;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Specify the possible values for size
}>();

const emit = defineEmits(['close', 'resetForm']);
const isOpen = ref(props.show);

// Watch the 'show' prop to update the local isOpen value
watch(() => props.show, (newVal) => {
  isOpen.value = newVal;
});

// Dynamic dialog size based on prop
const dialogSize = computed(() => {
  switch (props.size) {
    case 'sm':
      return '300px'; // or any size you prefer
    case 'md':
      return '600px';
    case 'lg':
      return '800px';
    case 'xl':
      return '1200px';
    default:
      return '600px'; // default case
  }
});

// Close the modal and emit the reset event
const close = () => {
  isOpen.value = false;
  emit('close');
  emit('resetForm'); // Trigger reset when modal closes
};

// Handle dialog close
const handleDialogClose = (value: boolean) => {
  if (!value) {
    close();
  }
};
</script>
