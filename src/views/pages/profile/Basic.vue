<template>
  <VCardText class="d-flex">
    <!-- 👉 Avatar -->
    <VAvatar
      rounded
      size="100"
      class="me-6"
      :image="profileUrl"
    />
    <!-- 👉 Upload Photo -->
    <form class="d-flex flex-column justify-center gap-4">
      <div class="d-flex flex-wrap gap-4">
        <VBtn
          color="primary"
          size="small"
          @click="refInputEl?.click()"
        >
          <VIcon
            icon="tabler-cloud-upload"
            class="sm"
          />
          <span class="d-none d-sm-block">Upload new photo</span>
        </VBtn>

        <input
          ref="refInputEl"
          type="file"
          name="file"
          accept=".jpeg,.png,.jpg,GIF"
          hidden
          @input="changeAvatar"
        >
      </div>

      <p class="text-body-1 mb-0">
        Allowed JPG, GIF or PNG. Max size of 2MB
      </p>
    </form>
  </VCardText>

  <VCardText class="pt-2">
    <!-- 👉 Form -->
    <VForm class="mt-3" @submit.prevent="submit">
      <VRow>
        <VCol md="6" cols="12">
          <AppTextField
            v-model="accountData.fname"
            label="First Name"
          />
        </VCol>
        <VCol md="6" cols="12">
          <AppTextField
            v-model="accountData.mname"
            label="Middle Name"
          />
        </VCol>
        <VCol md="6" cols="12">
          <AppTextField
            v-model="accountData.lname"
            label="Last Name"
          />
        </VCol>
        <VCol md="6" cols="12">
          <AppTextField
            v-model="accountData.title"
            label="Title (e.g., MD, CESO III)"
          />
        </VCol>
        <VCol cols="12" md="6">
          <AppTextField
            v-model="accountData.email"
            label="E-mail"
            placeholder="johndoe@gmail.com"
            type="email"
          />
        </VCol>
        <VCol cols="12" md="6">
          <AppTextField
            v-model="accountData.contact"
            label="Phone Number"
            placeholder="+1 (917) 543-9876"
          />
        </VCol>
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
import { useUserProfile } from "@/composables/userProfile"
import { useUser } from "@/composables/useUser"
import { axiosIns } from "@/plugins/axios"
import { ref, watch } from "vue"
import { useStore } from "vuex"

const store = useStore()
const { user } = useUser()
const { profile } = useUserProfile()

const profileUrl = ref<string | null>(null)
const { isError, errorMessage, isSuccess, successMessage } = cStatus()
const loadingButton = ref(false)
const refInputEl = ref<HTMLElement>()
const selectedProfile = ref<File | null>(null)

const fromUser = (u: any) => ({
  fname: u?.fname ?? '',
  mname: u?.mname ?? '',
  lname: u?.lname ?? '',
  title: u?.title ?? '',
  email: u?.email ?? '',
  contact: u?.contact ?? '',
})
let initialData = fromUser(user.value)
const accountData = ref(structuredClone(initialData))

// The user may load after this component mounts
watch(user, (u) => {
  initialData = fromUser(u)
  accountData.value = structuredClone(initialData)
})

const changeAvatar = (file: Event) => {
  const fileReader = new FileReader()
  const { files } = file.target as HTMLInputElement

  if (files && files.length) {
    const selectedFile = files[0];
    const validFileTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validFileTypes.includes(selectedFile.type)) {
      errorMessage.value = 'Invalid file type. Please select an image.';
      isError.value = true;
      return;
    }
    const maxSizeInBytes = 2 * 1024 * 1024;
    if (selectedFile.size > maxSizeInBytes) {
      errorMessage.value = 'File is too large. Maximum size is 2MB.';
      isError.value = true;
      return;
    }
    selectedProfile.value = selectedFile
    fileReader.readAsDataURL(selectedFile)
    fileReader.onload = () => {
      if (typeof fileReader.result === 'string')
        profileUrl.value = fileReader.result
      saveProfile()
    }
  }
}

const saveProfile = async () => {
  if (!selectedProfile.value) return

  const formData = new FormData()
  formData.append('file', selectedProfile.value)
  try {
    await axiosIns.post(`/api/employee/store/profile-pic`, formData)
    await store.dispatch('auth/refreshUser')
    successMessage.value = 'Successfully saved profile picture'
    isSuccess.value = true
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Image not supported. Please try another'
    isError.value = true
  }
}
const resetForm = () => {
  accountData.value = structuredClone(initialData)
}
const submit = async () => {
  loadingButton.value = true
  try {
    const { data } = await axiosIns.post(`/api/employee/store/profile`, accountData.value)
    store.commit('auth/SET_USER', data.user)
    successMessage.value = 'Successfully saved profile'
    isSuccess.value = true
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Something went wrong. Please try again.'
    isError.value = true
  } finally {
    loadingButton.value = false
  }
}
watch(profile, (newProfile) => {
  if (newProfile instanceof Blob) {
    profileUrl.value = URL.createObjectURL(newProfile)
  }
}, { immediate: true })
</script>
