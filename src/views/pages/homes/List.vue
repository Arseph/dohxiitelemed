<script setup lang="ts">
import { axiosIns } from '@/plugins/axios';
import { register } from 'swiper/element/bundle';
import { onMounted, onUnmounted, ref } from 'vue';
register()
const logisticData = ref([
  { icon: 'tabler-video-plus', color: 'primary', title: 'Start Teleconsultation', isHover: false, modal: 'start', swipe: 0 },
  { icon: 'tabler-video', color: 'warning', title: 'Join Teleconsultation', isHover: false, modal: 'join', swipe: 1 },
  { icon: 'tabler-corner-left-down-double', color: 'info', title: 'Pending Teleconsultation', isHover: false, modal: 'pending', swipe: 2 },
  { icon: 'tabler-calendar-clock', color: 'error', title: 'Request Teleconsultation', isHover: false, modal: 'schedule', swipe: 3 },
])
const facilities = ref([])
const docCat = ref([])
const patient = ref([])
const start = ref([])
const active = ref(0)
const pending = ref([])
const req = ref([])
const isRefreshing = ref(false)

const fetchTele = async () => {
  try {
    isRefreshing.value = true

    const response = await axiosIns.get(`/api/teleconsultation`);
    facilities.value = response.data.facilities
    docCat.value = response.data.telecat
    patient.value = response.data.patients.map((pat: any) => ({
      id: pat.id,
      name: `${pat.pat_fname} ${pat.pat_mname ?? ''} ${pat.pat_lname}`.replace(/\s+/g, ' ').trim(),
    }))
    start.value = response.data?.data
    active.value = response.data?.active_user?.id
    pending.value = response.data?.data_req
    req.value = response.data?.data_my_req
  } catch (error) {
  } finally {
    isRefreshing.value = false
  }
};
const activeModal = ref<string | null>(null)

// Function to open modal
const openModal = (modal: string) => {
  activeModal.value = modal
}

// Function to close modal
const closeModal = () => {
  activeModal.value = null
}

// A request was submitted from the dialog — the lists behind it are now out of date.
const onRequestCreated = () => {
  closeModal()
  fetchTele()
}

/**
 * Someone else did something that affects this user's lists.
 *
 * The backend already pushes to `my-channel.{userId}` whenever a teleconsultation is
 * requested for or scheduled with this user (see PusherHelper::trigger in
 * TeleController). App.vue re-broadcasts those in-page as `teleconsult-notification`,
 * so this page can refresh without opening a second Pusher connection or waiting for
 * the user to reload.
 */
const onRemoteActivity = () => {
  fetchTele()
}

/**
 * Fallback for anything the push missed — a dropped websocket, a notification fired
 * while the tab was closed, or a change made by someone this user is not the target
 * of. Refetching only when the tab regains focus keeps this close to free, unlike a
 * timer that polls whether or not anyone is looking.
 */
const onWindowFocus = () => {
  if (document.visibilityState === 'visible')
    fetchTele()
}
const time = ref('')
const date = ref('')
const swiperEl = ref<any>(null)
const updateDateTime = () => {
  const now = new Date()
  time.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  date.value = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}
const swipeSpecific = (index: number) => {
  if (swiperEl.value && swiperEl.value.swiper) {
    swiperEl.value.swiper.slideTo(index)
  }
}
let interval: number

onMounted(() => {
  swiperEl.value = document.querySelector('swiper-container')
  updateDateTime()
  fetchTele()
  interval = window.setInterval(updateDateTime, 1000)
  window.addEventListener('teleconsult-notification', onRemoteActivity)
  document.addEventListener('visibilitychange', onWindowFocus)
})

onUnmounted(() => {
  clearInterval(interval)
  window.removeEventListener('teleconsult-notification', onRemoteActivity)
  document.removeEventListener('visibilitychange', onWindowFocus)
})
</script>

<template>
  <VRow>
    <VCol cols="5" md="5" sm="5">
      <VRow>
        <VCol v-for="(data, index) in logisticData" :key="index" cols="12" md="12" sm="12">
          <VCard class="logistics-card-statistics cursor-pointer"
            :style="data.isHover ? `border-block-end-color: rgb(var(--v-theme-${data.color}))` : `border-block-end-color: rgba(var(--v-theme-${data.color}),0.38)`"
            @mouseenter="data.isHover = true" @mouseleave="data.isHover = false" @click="swipeSpecific(data.swipe)">
            <VCardText>
              <div class="d-flex align-center justify-center gap-x-4 mb-1">
                <VAvatar variant="tonal" :color="data.color" rounded>
                  <VIcon :icon="data.icon" size="28" />
                </VAvatar>
              </div>
              <div class="d-flex align-center justify-center text-body-1 mb-1">
                {{ data.title }}
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VCol>
    <VCol cols="7" md="7" sm="7">
      <VCard class="bg-cover bg-center" style="background-image: url('https://picsum.photos/800/400?blur=2');">
        <VCardItem>
          <div class="d-flex align-center justify-center gap-x-4 mb-1">
            <h1 class="text-white">{{ time }}</h1><br></br>
          </div>
          <div class="d-flex align-center justify-center gap-x-4 mb-1">
            <h3 class="text-white">{{ date }}</h3>
          </div>
          <!--
            Lists refresh on their own after any action and on push, but an explicit
            control matters when someone is waiting on a colleague to schedule.
          -->
          <div class="d-flex align-center justify-center gap-x-2">
            <VBtn
              size="small"
              variant="tonal"
              color="white"
              prepend-icon="tabler-refresh"
              :loading="isRefreshing"
              @click="fetchTele"
            >
              Refresh
            </VBtn>
          </div>
        </VCardItem>
      </VCard>
      <swiper-container ref="swiperEl" :loop="false" slides-per-view="1">
        <!-- Slide 1 -->
        <swiper-slide>
          <h1 class="text-h5 mt-6 mb-6">
            <VIcon icon="tabler-video" size="28" class="mr-3" />
            Today's Teleconsultation
          </h1>
          <Start :data="start" :active_id="active" />
        </swiper-slide>

        <!-- Slide 2 -->
        <swiper-slide>
          <h1 class="text-h5 mt-6 mb-6">
            <VIcon icon="tabler-video" size="28" class="mr-3" />
            Join Teleconsultation
          </h1>
          <Join :data="start" :active_id="active" />
        </swiper-slide>

        <!-- Slide 3 -->
        <swiper-slide>
          <h1 class="text-h5 mt-6 mb-6">
            <VIcon icon="tabler-video" size="28" class="mr-3" />
            Pending Teleconsultation
          </h1>
          <Pending :data="pending" @refresh="fetchTele" />
        </swiper-slide>
        <swiper-slide>
          <h1 class="text-h5 mt-6 mb-6">
            <VIcon icon="tabler-video" size="28" class="mr-3" />
            Request Teleconsultation
            <VBtn icon="tabler-plus" variant="tonal" color="success" rounded class="ml-6"
              @click="openModal('schedule')" />
            <RequestPal :data="req" />
          </h1>
        </swiper-slide>
      </swiper-container>
    </VCol>
  </VRow>

  <!-- Single Dialog -->
  <VDialog v-model="activeModal" max-width="600">
    <DialogCloseBtn @click="closeModal" />
    <VCard>
      <VCardTitle>
        <!-- Different titles based on modal -->
        <span v-if="activeModal === 'start'">Start Consultation</span>
        <span v-else-if="activeModal === 'join'">Join Teleconsultation</span>
        <span v-else-if="activeModal === 'schedule'">Request Teleconsultation</span>
        <span v-else-if="activeModal === 'pending'">Pending Teleconsultation</span>
      </VCardTitle>

      <VCardText>
        <div v-if="activeModal === 'start'">
          🚀 You can start a new consultation here.
        </div>

        <div v-else-if="activeModal === 'join'">
          🔗 Enter meeting details to join your teleconsultation.
        </div>
        <div v-else-if="activeModal === 'schedule'">
          <Request :facilities="facilities" :docCat="docCat" :patient="patient" @close="onRequestCreated" />
        </div>
      </VCardText>
    </VCard>
  </VDialog>
</template>
<style lang="scss" scoped>
@use "@core/scss/base/mixins" as mixins;

.logistics-card-statistics {
  border-block-end-style: solid;
  border-block-end-width: 2px;

  &:hover {
    border-block-end-width: 3px;
    margin-block-end: -1px;

    @include mixins.elevation(8);

    transition: all 0.1s ease-out;
  }
}

.skin--bordered {
  .logistics-card-statistics {
    border-block-end-width: 2px;

    &:hover {
      border-block-end-width: 3px;
      margin-block-end: -2px;
      transition: all 0.1s ease-out;
    }
  }
}
</style>
