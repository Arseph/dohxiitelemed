<script lang="ts">
import { defineComponent, ref, watch } from 'vue';

export default defineComponent({
  name: 'AlertSuccess',
  props: {
    message: {
      type: String,
      required: false,
      default: '',
    },
    visible: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['update:visible'],
  setup(props, { emit }) {
    const showAlert = ref(props.visible)
    const successMessage = ref(props.message)

    // Watch for changes to the visible prop
    watch(
      () => props.visible,
      newVal => {
        showAlert.value = newVal
      },
    )
    watch(
      () => props.message,
      newVal => {
        successMessage.value = newVal
      },
    )
    watch(showAlert, newVal => {
      emit('update:visible', newVal)
    })

    return {
      showAlert,
      successMessage,
    }
  },
})
</script>

<template>
  <VAlert
            v-model="showAlert"
            color="success"
            icon="tabler-checkbox"
            prominent
            closable
        >
            {{successMessage}}
    </VAlert>
</template>
