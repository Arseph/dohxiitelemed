<template>
  <VCardText class="pt-2">
    <!-- 👉 Form -->
    <VForm class="mt-3" @submit.prevent="submit">
      <VRow>
        <VCol md="6" cols="12">
          <AppTextField
            v-model="accountData.userName"
            label="User Name"
          />
        </VCol>
      </VRow>
      <VRow>
        <VCol md="6" cols="12">
          <AppTextField
            v-model="accountData.currentPassword"
            :type="isCurrentPasswordVisible ? 'text' : 'password'"
            :append-inner-icon="isCurrentPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
            label="Current Password"
            placeholder="············"
            @click:append-inner="isCurrentPasswordVisible = !isCurrentPasswordVisible"
          />
        </VCol>
      </VRow>
      <VRow>
        <VCol md="6" cols="12">
          <AppTextField
            v-model="accountData.newPassword"
            :type="isNewPasswordVisible ? 'text' : 'password'"
            :append-inner-icon="isNewPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
            label="New Password"
            placeholder="············"
            @click:append-inner="isNewPasswordVisible = !isNewPasswordVisible"
          />
        </VCol>
        <VCol md="6" cols="12">
          <AppTextField
            v-model="accountData.confirmPassword"
            :type="isConfirmPasswordVisible ? 'text' : 'password'"
            :append-inner-icon="isConfirmPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
            label="Confirm Password"
            placeholder="············"
            @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
          />
        </VCol>
        <VCardText>
          <h6 class="text-h6 text-medium-emphasis mb-4">
            Password Requirements:
          </h6>

          <VList class="card-list">
            <VListItem
              v-for="item in passwordRequirements"
              :key="item"
              :title="item"
              class="text-medium-emphasis"
            >
              <template #prepend>
                <VIcon
                  size="10"
                  icon="tabler-circle-filled"
                />
              </template>
            </VListItem>
          </VList>
        </VCardText>
        <VCol cols="12" class="d-flex flex-wrap gap-4">
          <VBtn
            :loading="loadingButton"
            :disabled="loadingButton"
            type="submit"
          >
            Save changes
          </VBtn>
          <VBtn
            color="secondary"
            variant="tonal"
            type="reset"
            @click.prevent="resetForm"
          >
            Reset
          </VBtn>
        </VCol>
      </VRow>
    </VForm>
  </VCardText>
</template>
<script lang="ts" setup>
import { cStatus } from "@/components/snackbars/cStatus"
import { useUser } from "@/composables/useUser"
import { axiosIns } from "@/plugins/axios"
import { ref } from "vue"

const isCurrentPasswordVisible = ref(false)
const isNewPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
const loadingButton = ref(false)
const { isError, errorMessage, isSuccess, successMessage } = cStatus()
const { user } = useUser()
const passwordRequirements = [
  'Minimum 8 characters long - the more, the better',
  'At least one lowercase character',
  'At least one number, symbol, or whitespace character',
]
const initialData = {
  userName: user.value?.username,
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}
const accountData = ref(structuredClone(initialData))

const submit = async () => {
  loadingButton.value = true
  if(accountData.value.currentPassword === '') {
    errorMessage.value = 'Please provide current password before changing'
    isError.value = true
    loadingButton.value = false
  } else if(accountData.value.newPassword !== accountData.value.confirmPassword) {
    errorMessage.value = 'New password does not match!'
    isError.value = true
    loadingButton.value = false
  } else {
    try {
      await axiosIns.post(`/api/employee/store/security`, accountData.value)
      successMessage.value = 'Successfully saved Security'
      isSuccess.value = true
    } catch (error) {
      errorMessage.value = error.response?.data?.message || 'Something went wrong. Please try again.'
      isError.value = true
    } finally {
      loadingButton.value = false
    }
  }
}

const resetForm = () => {
  accountData.value = structuredClone(initialData)
}
</script>
