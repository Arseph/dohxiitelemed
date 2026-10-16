<script lang="ts" setup>
import { cStatus } from "@/components/snackbars/cStatus"
import ErrorSnackbar from '@/components/snackbars/errors.vue'
import SuccessSnackbar from '@/components/snackbars/success.vue'
import Basic from "@/views/pages/profile/Basic.vue"
import Security from "@/views/pages/profile/Security.vue"
import { ref } from "vue"
const currentTab = ref(0)
const { isError, errorMessage, isSuccess, successMessage } = cStatus()
</script>

<template>
  <VTabs
    v-model="currentTab"
    class="v-tabs-pill"
  >
    <VTab>
      <VIcon
        icon="tabler-user"
        class="sm"
      />&nbsp;
      Profile
    </VTab>
    <VTab>
      <VIcon
        icon="tabler-lock"
        class="sm"
      />&nbsp;
      Security
    </VTab>
  </VTabs>
  <VCardText>
</VCardText>
  <VCard class="mt-5">
    <VCardText>
      <VWindow v-model="currentTab" :touch="false">
        <VWindowItem :value="0">
          <Basic />
        </VWindowItem>
        <VWindowItem :value="1">
          <Security />
        </VWindowItem>
        <!-- My Signature tab hidden: the signatures table has not been migrated yet -->
      </VWindow>
    </VCardText>
  </VCard>
  <ErrorSnackbar
    :message="errorMessage"
    :visible="isError"
    @update:visible="isError = $event"
  />
  <SuccessSnackbar
    :message="successMessage"
    :visible="isSuccess"
    @update:visible="isSuccess = $event"
  />
</template>
