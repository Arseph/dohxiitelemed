<script setup lang="ts">
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { globals } from '@/globals'
import axios from "axios"
import { ref } from "vue"
import { useRoute } from 'vue-router'
definePage({
  meta: {
    layout: 'blank',
  },
})
const route = useRoute();
const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
const newPassword = ref('');
const confirmPassword = ref('');
const showAlert = ref<boolean>(false)
const alertMessage = ref<string>('')
const alertColor = ref<string>('')
const API_URL = globals.api
const token = route.params.token as string;
const email = route.params.email as string;
const loadingButton = ref<boolean>(false)
const validatePasswords = () => {
  if (newPassword.value !== confirmPassword.value) {
    alertMessage.value = 'Passwords do not match'
    showAlert.value = true
    alertColor.value = 'error'
    return false;
  }
  return true;
};
const submit = async () => {
  if (!validatePasswords()) {
    return;
  }

  try {
    loadingButton.value = true
    const response = await axios.post(`${API_URL}/api/auth/password/reset`, {
      password: newPassword.value,
      token: token,
      email: email,
    })
    alertMessage.value = 'Password changed!'
    showAlert.value = true
    alertColor.value = 'primary'
    loadingButton.value = false
  } catch (error) {
    alertColor.value = 'error'
    loadingButton.value = false
    alertMessage.value = error.response.data.message
    showAlert.value = true
  }
};
</script>

<template>
  <RouterLink to="/">
    <div class="auth-logo d-flex align-center gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h1 class="auth-title">
        DOH XII Employee Portal
      </h1>
    </div>
  </RouterLink>

  <VRow
    no-gutters
    class="auth-wrapper bg-surface"
  >
    <VCol
      md="8"
      class="d-none d-md-flex"
    >
      <div class="position-relative bg-background w-100 me-0">
        <div
          class="d-flex align-center justify-center w-100 h-100"
          style="padding-inline: 150px;"
        >
        </div>
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
            Reset Password 🔒
          </h4>
          <p class="mb-0">
            Your new password must be different from previously used passwords
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
              <!-- password -->
              <VCol cols="12">
                <AppTextField
                  v-model="newPassword"
                  autofocus
                  label="New Password"
                  placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
              </VCol>

              <!-- Confirm Password -->
              <VCol cols="12">
                <AppTextField
                  v-model="confirmPassword"
                  label="Confirm Password"
                  placeholder="············"
                  :type="isConfirmPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isConfirmPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                />
              </VCol>

              <!-- Set password -->
              <VCol cols="12">
                <VBtn
                  :loading="loadingButton"
                  :disabled="loadingButton"
                  block
                  type="submit"
                >
                  Set New Password
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
