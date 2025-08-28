<script setup lang="ts">
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { globals } from '@/globals'
import axios from 'axios'
import { ref } from "vue"
definePage({
  meta: {
    layout: 'blank',
  },
})

const email = ref('')
const API_URL = globals.api
const showAlert = ref<boolean>(false)
const alertMessage = ref<string>('')
const alertColor = ref<string>('')
const loadingButton = ref<boolean>(false)
const submit = async () => {
  loadingButton.value = true
  try {
    if (!email.value) {
      alertMessage.value = 'Please Provide Email'
      alertColor.value = 'error'
      showAlert.value = true
      loadingButton.value = false
      return;
    }
    const response = await axios.post(`${API_URL}/api/auth/password/email`, {
      email: email.value,
    })
    alertMessage.value = 'Reset link sent successfully'
    showAlert.value = true
    alertColor.value = 'primary'
    loadingButton.value = false
  }
  catch (error) {
    alertColor.value = 'error'
    alertMessage.value = error.response.data.message
    showAlert.value = true
    loadingButton.value = false
  }
}
</script>

<template>
  <RouterLink to="/login">
    <div class="auth-logo d-flex align-center gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h1 class="auth-title">
        DOH XII Employee Portal
      </h1>
    </div>
  </RouterLink>

  <VRow
    class="auth-wrapper bg-surface"
    no-gutters
  >
    <VCol
      md="8"
      class="d-none d-md-flex"
    >
      <div class="position-relative bg-background w-100 me-0">
        <div
          class="d-flex align-center justify-center w-100 h-100"
        ></div>
      </div>
    </VCol>

    <VCol
      cols="12"
      md="4"
      class="auth-card-v2 d-flex align-center justify-center"
    >
      <VCard
        flat
        :max-width="500"
        class="mt-12 mt-sm-0 pa-6"
      >
        <VCardText>
          <h4 class="text-h4 mb-1">
            Forgot Password? 🔒
          </h4>
          <p class="mb-0">
            Enter your email and we'll send you instructions to reset your password
          </p>
        </VCardText>
        <VAlert
          v-if="showAlert"
          :color="alertColor"
          variant="tonal"
          dismissible
          @input="showAlert = false"
        >
          {{ alertMessage }}
        </VAlert>
        <VCardText>
          <VForm @submit.prevent="submit">
            <VRow>
              <!-- email -->
              <VCol cols="12">
                <AppTextField
                  v-model="email"
                  autofocus
                  label="Email"
                  placeholder="............"
                  type="email"
                />
              </VCol>

              <!-- Reset link -->
              <VCol cols="12">
                <VBtn
                  :loading="loadingButton"
                  :disabled="loadingButton"
                  block
                  type="submit"
                >
                  Send Reset Link
                </VBtn>
              </VCol>

              <!-- back to login -->
              <VCol cols="12">
                <RouterLink
                  class="d-flex align-center justify-center"
                  to="/login"
                >
                  <VIcon
                    icon="tabler-chevron-left"
                    size="20"
                    class="me-1 flip-in-rtl"
                  />
                  <span>Back to login</span>
                </RouterLink>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth.scss";
</style>
