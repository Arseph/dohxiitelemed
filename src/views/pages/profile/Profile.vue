<script setup lang="ts">
import cover from '@/assets/images/bg.png'
import { useUserProfile } from "@/composables/userProfile"
import { useUser } from '@/composables/useUser'
import About from "@/views/pages/profile/About.vue"
import Timeline from "@/views/pages/profile/Timeline.vue"
import { ref, watch } from "vue"

const { user } = useUser()
const { profile } = useUserProfile()
const profileUrl = ref<string | null>(null)
const activeTab = ref('profile')
const tabs = [
  { title: 'Profile', icon: 'tabler-user-check', tab: 'profile' },
]
watch(profile, (newProfile) => {
  if (newProfile instanceof Blob) {
    profileUrl.value = URL.createObjectURL(newProfile)
  }
}, { immediate: true })
</script>
<template>
  <VCard>
    <VImg
      :src="cover"
      min-height="125"
      max-height="250"
      cover
    />

    <VCardText class="d-flex align-bottom flex-sm-row flex-column justify-center gap-x-6">
      <div class="d-flex h-0">
        <VAvatar
                 rounded
                 size="130"
                 :image="profileUrl"
                 class="user-profile-avatar mx-auto"
        />
      </div>

      <div class="user-profile-info w-100 mt-16 pt-6 pt-sm-0 mt-sm-0">
        <h4 class="text-h4 text-center text-sm-start font-weight-medium mb-2">
          {{ user?.info?.first_name }} {{ user?.info?.sur_name }}
          <span v-if="user?.info?.title_name">,{{user?.info?.title_name}}</span>
        </h4>
        <p class="text-sm-start font-weight-medium mb-2">
          {{ user?.info?.nick_name }}
        </p>

        <div class="d-flex align-center justify-center justify-sm-space-between flex-wrap gap-5">
          <div class="d-flex flex-wrap justify-center justify-sm-start flex-grow-1 gap-6">
            <span class="d-flex gap-x-2 align-center">
              <VIcon
                size="24"
                icon="tabler-palette"
              />
              <div class="text-body-1 font-weight-medium">
                {{ user?.info?.hrinfo?.pos?.position }}
              </div>
            </span>

            <span class="d-flex gap-x-2 align-center">
              <VIcon
                size="24"
                icon="tabler-map-pin"
              />
              <div class="text-body-1 font-weight-medium">
                {{ user?.info?.hrinfo?.div?.office }} - {{ user?.info?.hrinfo?.sec?.station }}
              </div>
            </span>
          </div>

          <VBtn prepend-icon="tabler-user-check" to="/profile/edit">
            Edit Profile
          </VBtn>
        </div>
      </div>
    </VCardText>
  </VCard>
  <VTabs
    v-model="activeTab"
    class="v-tabs-pill my-2"
  >
    <VTab
      v-for="item in tabs"
      :key="item.icon"
      :value="item.tab"
    >
      <VIcon
        size="20"
        start
        :icon="item.icon"
      />
      {{ item.title }}
    </VTab>
  </VTabs>
  <VWindow
    v-model="activeTab"
    class="disable-tab-transition"
    :touch="false"
  >
    <VWindowItem value="profile">
      <VRow>
        <VCol
          md="5"
          cols="12"
        >
          <About :data="user" />
        </VCol>

        <VCol
          cols="12"
          md="7"
        >
          <Timeline />
        </VCol>
      </VRow>
    </VWindowItem>
  </VWindow>
</template>

<style lang="scss">
.user-profile-avatar {
  border: 5px solid rgb(var(--v-theme-surface));
  background-color: rgb(var(--v-theme-surface)) !important;
  inset-block-start: -3rem;

  .v-img__img {
    border-radius: 0.125rem;
  }
}
</style>
