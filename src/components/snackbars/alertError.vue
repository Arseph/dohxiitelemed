<script lang="ts">
import { defineComponent, ref, watch } from 'vue';

export default defineComponent({
  name: 'AlertError',
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
    const errorMessage = ref(props.message)

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
        errorMessage.value = newVal
      },
    )
    watch(showAlert, newVal => {
      emit('update:visible', newVal)
    })

    return {
      showAlert,
      errorMessage,
    }
  },
})
</script>

<template>
  <VAlert
            v-model="showAlert"
            color="error"
            icon="tabler-exclamation-circle"
            prominent
            closable
        >
            {{errorMessage}}
    </VAlert>
</template>
