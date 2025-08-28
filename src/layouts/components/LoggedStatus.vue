<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
export default defineComponent({
  name: 'LoggedStatus',
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
    const isValid = ref(props.visible)
    const router = useRouter()
    const logout = async () => {
        localStorage.removeItem('auth_token')
        router.push('/login')
    }

    // Watch for changes to the visible prop
    watch(
      () => props.visible,
      newVal => {
        isValid.value = newVal
      },
    )
    watch(isValid, newVal => {
      emit('update:visible', newVal)
    })

    return {
      isValid,
      logout,
    }
  },
})
</script>

<template>
  <VDialog
    v-model="isValid"
    width="300"
    persistent
  >
    <VCard
      class="text-center"
    >
        <VCardText class="d-flex flex-column justify-center align-center">
            <VAvatar
            color="primary"
            variant="tonal"
            size="50"
            class="mb-4"
            >
            <VIcon
                size="2rem"
                icon="tabler-user"
            />
            </VAvatar>

            <h6 class="text-h6">
            Session ended. Please Login again
            </h6>
        </VCardText>
        <VCardText class="justify-center">
            <VBtn variant="elevated" @click="logout">
            LOGIN
            </VBtn>
        </VCardText>
    </VCard>
  </VDialog>
</template>
