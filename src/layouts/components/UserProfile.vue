<script setup lang="ts">
import { useUserProfile } from "@/composables/userProfile"
import { useUser } from '@/composables/useUser'
import { axiosIns } from "@/plugins/axios"
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import LoggedStatus from "./LoggedStatus.vue"

const store = useStore()
const router = useRouter()

const { user } = useUser()
const { profile } = useUserProfile()
const profileUrl = ref<string | null>(null)
const tokenValid = ref(false)
onMounted(() => {
  const token = localStorage.getItem('auth_token')
  if (!token) {
      router.push('/login')
  }
  if (profile.value instanceof Blob) {
    profileUrl.value = URL.createObjectURL(profile.value)
  }
  // validate()
})

const validate = async () => {
  try {
      await axiosIns.get('/api/auth/validate-token');
  } catch (error) {
    tokenValid.value = true;
  }
};

const avatarText = (name: string) => {
  return name ? name.charAt(0).toUpperCase() : ''
}
const logout = async () => {
  await store.dispatch('auth/logout')
  router.push('/login')
}
watch(profile, (newProfile) => {
  if (newProfile instanceof Blob) {
    profileUrl.value = URL.createObjectURL(newProfile)
  }
}, { immediate: true })
</script>

<template>
  <VBadge dot location="bottom right" offset-x="3" offset-y="3" bordered color="success">
    <VAvatar class="cursor-pointer" variant="tonal">
      <VAvatar v-if="!profileUrl" color="success" variant="tonal">
        <span>{{ avatarText(user?.info?.first_name) }}</span>
      </VAvatar>
      <VAvatar v-else variant="tonal">
        <VImg
          :src="profileUrl"
        />
      </VAvatar>

      <VMenu activator="parent" width="230" location="bottom end" offset="14px">
        <VList>
          <VListItem>
            <VListItemAction v-if="!profileUrl" start class="d-flex align-center justify-center mb-6">
              <VBadge dot location="bottom right" offset-x="3" offset-y="3" color="success">
                <VAvatar color="success" variant="tonal">
                  <span>{{ avatarText(user?.info?.first_name) }}</span>
                </VAvatar>
              </VBadge>
            </VListItemAction>
            <VListItemAction v-else start class="d-flex align-center justify-center mb-6">
              <VBadge dot location="bottom right" offset-x="3" offset-y="3" color="success">
                <VAvatar variant="tonal">
                  <VImg
                    :src="profileUrl"
                  />
                </VAvatar>
              </VBadge>
            </VListItemAction>
            <VListItemTitle class="font-weight-semibold d-flex align-center justify-center">{{ user?.info?.first_name }} {{ user?.info?.sur_name }}</VListItemTitle>
          </VListItem>

          <VDivider class="my-2" />

          <VListItem link to="/profile">
            <VIcon class="me-2" icon="tabler-user" size="22" />
            <VListItemTitle>Profile</VListItemTitle>
          </VListItem>
          <VDivider class="my-2" />

          <VListItem>
            <div class="px-4 py-2">
              <VBtn
                block
                size="small"
                color="error"
                append-icon="tabler-logout"
                @click="logout"
              >
                Logout
              </VBtn>
            </div>
          </VListItem>
        </VList>
      </VMenu>
    </VAvatar>
  </VBadge>
  <LoggedStatus
    :visible="tokenValid"
    @update:visible="tokenValid = $event"
  />
</template>
