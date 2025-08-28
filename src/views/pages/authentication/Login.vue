<script setup lang="ts">
import { VNodeRenderer } from "@layouts/components/VNodeRenderer";
import { themeConfig } from '@themeConfig';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

definePage({
  meta: {
    layout: 'blank',
  },
})

const form = ref({
  username: '',
  password: '',
  remember: false,
})
const store = useStore();
const isPasswordVisible = ref(false)
const showAlert = ref<boolean>(false)
const alertMessage = ref<string>('')
const loadingButton = ref<boolean>(false)
const router = useRouter();
onMounted(() => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    router.push('/homes')
  }
})
const submit = async () => {
  loadingButton.value = true
  try {
    if (!form.value.username || !form.value.password) {
      alertMessage.value = 'Please Provide Username and Password'
      showAlert.value = true
      loadingButton.value = false
      return;
    }
    const response = await store.dispatch('auth/login', form.value);

      router.push('/homes');
  } catch (error) {
    alertMessage.value = error.response.data.has_token ? 'Account logged in to another device. Please contact administrator' : 'Invalid username or password. Please try again.'
    showAlert.value = true
    loadingButton.value = false
  }
}; 
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
    no-gutters
    class="auth-wrapper bg-surface"
  >
    <VCol
      md="8"
      class="d-none d-md-flex"
    >
      <div class="position-relative bg-background w-100 me-0">
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
        class="mt-12 mt-sm-0 pa-4"
      >
        <VCardText>
          <h4 class="text-h4 mb-1">
            Welcome to <span class="text-capitalize"> {{ themeConfig.app.title }} </span>
          </h4>
          <p class="mb-0">
            Please login using your HRMIS acoount
          </p>
        </VCardText>
        <VCardText>
          <VAlert
            v-if="showAlert"
            color="primary"
            variant="tonal"
            dismissible
            @input="showAlert = false"
          >
            {{ alertMessage }}
          </VAlert>
        </VCardText>
        <VCardText>
          <VForm @submit.prevent="submit">
            <VRow>
              <!-- email -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.username"
                  autofocus
                  label="Username"
                  type="username"
                  placeholder="..........."
                />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.password"
                  label="Password"
                  placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />

                <div class="d-flex align-center flex-wrap justify-space-between mt-2 mb-4">
                  <VCheckbox v-model="form.remember" label="Remember me" />
                  <a class="text-primary ms-2 mb-1" href="/forget-password">Forgot Password?</a>
                </div>

                <VBtn
                  :loading="loadingButton"
                  :disabled="loadingButton"
                  block
                  type="submit"
                >Login</VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "src/@core/scss/template/pages/page-auth.scss";
</style>
