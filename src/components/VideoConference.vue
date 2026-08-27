<script lang="ts" setup>
import { type Socket, io } from 'socket.io-client'
import { onBeforeUnmount, onMounted, provide, ref } from 'vue'
import type { Component } from 'vue'
import { useDisplay } from 'vuetify'
import Form1 from './forms/form1.vue'
import Form2 from './forms/form2.vue'
import Form3 from './forms/form3.vue'
import Form4 from './forms/form4.vue'
import Form5 from './forms/form5.vue'
import { axiosIns } from '@/plugins/axios'
import WarningSnackbar from '@/components/snackbars/warning.vue'
import SuccessSnackbar from '@/components/snackbars/success.vue'
import ErrorSnackbar from '@/components/snackbars/errors.vue'
import { cStatus } from '@/components/snackbars/cStatus'

const props = defineProps<{
  conid: string | number
}>()

let warningTriggered = false

const callDuration = ref<number | null>(null)

interface ConsultData {
  title?: string
  encoded?: {
    facility?: {
      facilityname?: string
    }
  }
}

interface CardItem {
  id: number
  title: string
  icon: string
  color: string
  component: Component
}

const cards = ref<CardItem[]>([
  { id: 1, title: 'Demographic Profile', icon: 'tabler-user', color: 'royalblue', component: Form1 },
  { id: 2, title: 'Clinical History & Physical Examination', icon: 'tabler-stethoscope', color: 'magenta', component: Form2 },
  { id: 3, title: 'COVID-19 Screening', icon: 'tabler-virus-search', color: 'red', component: Form3 },
  { id: 4, title: 'Diagnosis / Assessment', icon: 'tabler-notes', color: 'blue', component: Form4 },
  { id: 5, title: 'Plan of Management', icon: 'tabler-clipboard-check', color: 'green', component: Form5 },
])

// const activeCard = ref<number | null>(null);
// const showCard = ref(false);

const drawerOpen = ref(false) // button drawer
const isDrawerOpen = ref(false) // form drawer

const activeCardTitle = ref('')
const activeCardIcon = ref('')
const activeCardIconColor = ref('')
const activeCardComponent = ref<Component | null>(null)
const isLoading = ref(false)

// 🧩 Track previously opened component
let lastCardComponent: Component | null = null

function openCard(id: number) {
  const selected = cards.value.find(c => c.id === id)
  if (!selected)
    return

  const isSameComponent = lastCardComponent === selected.component

  lastCardComponent = selected.component

  drawerOpen.value = false // close small drawer
  activeCardTitle.value = selected.title
  activeCardIcon.value = selected.icon
  activeCardIconColor.value = selected.color
  activeCardComponent.value = selected.component

  // 🔹 Handle loading logic
  if (isSameComponent) {
    // Option A: Instantly skip spinner
    isLoading.value = false

    // Option B: Flash loader briefly (optional)
    // isLoading.value = true
    // nextTick(() => (isLoading.value = false))
  }
  else {
    isLoading.value = true
  }

  // delay anim
  setTimeout(() => {
    isDrawerOpen.value = true
  }, 250)
}

function onComponentLoaded() {
  isLoading.value = false
}

function closeCard() {
  isDrawerOpen.value = false
  drawerOpen.value = true
}

const { isError, errorMessage, isSuccess, successMessage, isWarning, warningMessage } = cStatus()
const { smAndDown } = useDisplay()
const colSize = ref(12)
const isStartDialog = ref(true)

// const toggleCols = () => {
//   colSize.value = colSize.value === 12 ? 9 : 12;
// };

const localVideo = ref<HTMLVideoElement | null>(null)
const localVideoPreview = ref<HTMLVideoElement | null>(null)
const remoteVideo = ref<HTMLVideoElement | null>(null)
const isUploadPromptDialog = ref(false)

const selectedCamera = ref<string | null>(null)
const selectedMic = ref<string | null>(null)
const cameras = ref<MediaDeviceInfo[]>([])
const microphones = ref<MediaDeviceInfo[]>([])
const videoEnabled = ref(true)
const audioEnabled = ref(true)
const roomId = props.conid
const consult = ref<ConsultData>({})
let socket: Socket

// Shared with the form components via inject('formSync') so they can relay field
// edits over the same room as the call. Deliberately a plain object, not reactive —
// the forms mount when the drawer opens, which is after onMounted has set `socket`,
// and wrapping a Socket in a reactive proxy breaks its internals.
const formSyncCtx: { socket: Socket | null; roomId: string | number } = {
  socket: null,
  roomId,
}

provide('formSync', formSyncCtx)

// Nullable on purpose: RTCPeerConnection.close() is terminal but leaves the object
// truthy, so a plain `if (peerConnection)` guard would never rebuild it and the call
// could never recover from the other side dropping out.
let peerConnection: RTCPeerConnection | null = null
let localStream: MediaStream
let mediaRecorder: MediaRecorder
let recordedChunks: Blob[] = []
const callEnded = ref(false)

const config: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
}

const isFullscreen = ref(false)

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  }
  else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
      isFullscreen.value = false
    }
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isFullscreen.value)
    toggleFullscreen()
}

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

const callStartTime = ref<string | null>(null)
const elapsedSeconds = ref(0)
let timerInterval: number | null = null

const stopTimer = () => {
  if (timerInterval)
    clearInterval(timerInterval)
  timerInterval = null
}

const startTimer = () => {
  if (timerInterval)
    clearInterval(timerInterval)

  timerInterval = window.setInterval(() => {
    if (callStartTime.value) {
      const start = new Date(callStartTime.value).getTime()
      const now = Date.now()

      elapsedSeconds.value = Math.floor((now - start) / 1000)

      // Check for 5-minute warning)
      if (!warningTriggered && callDuration.value !== null && elapsedSeconds.value >= callDuration.value - (5 * 60)) {
        warningMessage.value = 'Less that 5 minutes remaining!'
        isWarning.value = true
        warningTriggered = true

        // console.log("Less that 5 minutes remaining!");
      }
    }
  }, 1000)
}

const setCallStartTime = (startTime: string) => {
  callStartTime.value = startTime
  startTimer()
}

onMounted(async () => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('fullscreenchange', handleFullscreenChange)

  const stored = sessionStorage.getItem('consultationData')
  if (stored)
    consult.value = JSON.parse(stored)

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  await loadDevices()
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  await restartStream()

  // ✅ 1. Connect to signaling server
  socket = io('http://10.10.124.140:3000', {
  // socket = io('https://telemed-dev.dohsox.com', {
    path: '/socket.io',
    transports: ['websocket'],
    withCredentials: true,
  })

  formSyncCtx.socket = socket

  socket.on('connect', () => {
    socket.emit('join', roomId)
  })

  // ✅ 2. Setup socket listeners
  socket.on('offer', async (offer: RTCSessionDescriptionInit) => {
    // ensure… rebuilds if the previous connection was closed, and attaches our own
    // camera/mic — without that the answering side sends nothing back.
    const pc = ensurePeerConnection()

    await pc.setRemoteDescription(new RTCSessionDescription(offer))

    const answer = await pc.createAnswer()

    await pc.setLocalDescription(answer)

    socket.emit('answer', { roomId, answer })
  })

  socket.on('answer', async (answer: RTCSessionDescriptionInit) => {
    // An answer for a connection we no longer have is stale — applying it throws.
    if (!peerConnection || peerConnection.signalingState === 'closed')
      return

    successMessage.value = 'User Enter the Teleconsultation'
    isSuccess.value = true
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(answer),
    )
  })

  socket.on('ice-candidate', async (candidate: RTCIceCandidateInit) => {
    // Candidates keep arriving after a teardown; dropping them quietly avoids the
    // console filling with InvalidStateError on an already-closed connection.
    if (!peerConnection || peerConnection.signalingState === 'closed')
      return

    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
    }
    catch (err) {
      console.error('Error adding ICE candidate', err)
    }
  })
  socket.on('user-disconnected', () => {
    errorMessage.value = 'User Disconnected'
    isError.value = true
    teardownPeerConnection()
  })

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  startRecording()
})

onBeforeUnmount(() => {
  if (peerConnection)
    peerConnection.close()
  if (socket)
    socket.disconnect()
  if (localStream)
    localStream.getTracks().forEach(t => t.stop())
  stopTimer()
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  if (hideTimeout)
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    clearTimeout(hideTimeout)
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})

function createPeerConnection() {
  peerConnection = new RTCPeerConnection(config)

  // send ICE candidates to signaling
  peerConnection.onicecandidate = event => {
    if (event.candidate)
      socket.emit('ice-candidate', { roomId, candidate: event.candidate })
  }

  // remote stream
  peerConnection.ontrack = event => {
    if (remoteVideo.value)
      remoteVideo.value.srcObject = event.streams[0]
  }

  // Handle connection state changes
  peerConnection.onconnectionstatechange = () => {
    if (!peerConnection)
      return

    if (
      peerConnection.connectionState === 'disconnected'
      || peerConnection.connectionState === 'failed'
      || peerConnection.connectionState === 'closed'
    )
      teardownPeerConnection()
  }

  return peerConnection
}

/** Close and forget, so the next offer builds a working connection instead of
 *  reusing a closed one. Closing without clearing the reference is what left the
 *  call permanently dead after the other participant dropped. */
function teardownPeerConnection() {
  if (!peerConnection)
    return

  try {
    peerConnection.close()
  }
  catch {
    // already closed — nothing to do
  }
  peerConnection = null
}

/** Attach the local camera/mic to the connection, skipping tracks already sent.
 *  The offer path did this inline but the answer path never did, so whoever
 *  answered negotiated with no media of their own and the caller saw a black frame. */
function attachLocalTracks() {
  if (!peerConnection || !localStream)
    return

  const senders = peerConnection.getSenders()

  localStream.getTracks().forEach(track => {
    if (!senders.some(s => s.track === track))
      peerConnection!.addTrack(track, localStream)
  })
}

/** The only way a peer connection should be obtained. */
function ensurePeerConnection() {
  if (!peerConnection || peerConnection.signalingState === 'closed')
    createPeerConnection()

  attachLocalTracks()

  return peerConnection!
}

const getStream = async () => {
  const constraints = {
    video: selectedCamera.value
      ? { deviceId: { exact: selectedCamera.value } }
      : true,
    audio: selectedMic.value
      ? { deviceId: { exact: selectedMic.value } }
      : true,
  }

  return await navigator.mediaDevices.getUserMedia(constraints)
}

const loadDevices = async () => {
  // Must request permission first — enumerateDevices returns empty labels without it
  try {
    const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })

    tempStream.getTracks().forEach(t => t.stop()) // release immediately; restartStream will re-acquire
  }
  catch (err) {
    console.warn('Permission request failed:', err)
  }

  const devices = await navigator.mediaDevices.enumerateDevices()

  cameras.value = devices.filter(d => d.kind === 'videoinput')
  microphones.value = devices.filter(d => d.kind === 'audioinput')

  if (!selectedCamera.value && cameras.value.length)
    selectedCamera.value = cameras.value[0].deviceId

  if (!selectedMic.value && microphones.value.length)
    selectedMic.value = microphones.value[0].deviceId
}

const restartStream = async () => {
  if (localStream)
    localStream.getTracks().forEach(track => track.stop())

  localStream = await getStream()

  if (localVideo.value)
    localVideo.value.srcObject = localStream

  if (localVideoPreview.value)
    localVideoPreview.value.srcObject = localStream

  // Replace tracks in peer connection
  if (peerConnection) {
    const senders = peerConnection.getSenders()

    localStream.getTracks().forEach(track => {
      const sender = senders.find(s => s.track?.kind === track.kind)
      if (sender)
        sender.replaceTrack(track)
    })
  }
}

const activeMeetingId = ref<number | null>(null)

async function startCall() {
  try {
    const response = await axiosIns.get('/api/start-consult', {
      params: { consult_id: props.conid },
    })

    const data = response.data

    if (response.data.is_finished) {
      alert('Teleconsultation Finished!')

      return
    }

    // ✅ store meeting id
    activeMeetingId.value = response.data.id

    // ✅ Calculate call duration (in seconds)
    const dateMeeting = data.date_meeting
    const from = data.from_time ? new Date(`${dateMeeting}T${data.from_time}`) : null
    const to = data.to_time ? new Date(`${dateMeeting}T${data.to_time}`) : null

    let durationSeconds = null
    if (from && to && !Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()))
      durationSeconds = (to.getTime() - from.getTime()) / 1000

    callDuration.value = durationSeconds

    setCallStartTime(response.data.start_time)

    // ✅ Stop preview stream reference (stream itself stays alive as localStream)
    if (localVideoPreview.value)
      localVideoPreview.value.srcObject = null

    // ✅ Reuse the existing localStream acquired in the dialog (preserves selected devices)
    // If for some reason it doesn't exist yet, fall back to getStream()
    if (!localStream)
      localStream = await getStream()

    // Apply current toggle states to the reused stream
    localStream.getVideoTracks().forEach(t => (t.enabled = videoEnabled.value))
    localStream.getAudioTracks().forEach(t => (t.enabled = audioEnabled.value))

    if (localVideo.value)
      localVideo.value.srcObject = localStream

    // Attaching tracks is part of ensure… now, and it skips any already sent —
    // the old unconditional addTrack loop duplicated senders when a call restarted.
    const pc = ensurePeerConnection()

    const offer = await pc.createOffer()

    await pc.setLocalDescription(offer)

    socket.emit('offer', { roomId, offer })
    isStartDialog.value = false
  }
  catch (error) {
    console.error(error)
  }
}

const toggleVideo = () => {
  if (!localStream)
    return
  videoEnabled.value = !videoEnabled.value
  localStream
    .getVideoTracks()
    .forEach(track => (track.enabled = videoEnabled.value))
}

const toggleAudio = () => {
  if (!localStream)
    return
  audioEnabled.value = !audioEnabled.value
  localStream
    .getAudioTracks()
    .forEach(track => (track.enabled = audioEnabled.value))
}

let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let canvasStream: MediaStream

const startRecording = () => {
  if (!localVideo.value || !remoteVideo.value)
    return

  // Lazily create canvas so it's always in a browser context
  if (!canvas) {
    canvas = document.createElement('canvas')
    ctx = canvas.getContext('2d')
  }

  // Set canvas size to match video layout
  canvas.width = 1280
  canvas.height = 480

  // Draw both videos on canvas every frame
  const drawFrame = () => {
    if (!ctx)
      return
    ctx.drawImage(localVideo.value!, 0, 0, 640, 480) // Left half
    ctx.drawImage(remoteVideo.value!, 640, 0, 640, 480) // Right half
    requestAnimationFrame(drawFrame)
  }

  drawFrame()

  // Capture canvas as stream
  canvasStream = (canvas as HTMLCanvasElement).captureStream(30) // 30 fps

  // Add local audio to the stream
  localStream.getAudioTracks().forEach(track => {
    canvasStream.addTrack(track)
  })

  recordedChunks = []
  mediaRecorder = new MediaRecorder(canvasStream)

  mediaRecorder.ondataavailable = event => {
    if (event.data.size > 0)
      recordedChunks.push(event.data)
  }

  mediaRecorder.start()
}

// const stopCall = async () => {
//   if (!confirm("⚠️ Are you sure you want to stop the call?")) {
//     return;
//   }

//   if (mediaRecorder && mediaRecorder.state !== "inactive") {
//     mediaRecorder.stop();

//     mediaRecorder.onstop = async () => {
//       const blob = new Blob(recordedChunks, { type: "video/webm" });

//       const formData = new FormData();
//       formData.append("consult_id", props.conid);
//       formData.append("video", blob, "video-conference.webm");

//       try {
//         const response = await axiosIns.post(`/api/stop-consult`, formData, {
//           headers: {
//             "Content-Type": "multipart/form-data",
//           },
//         });
//         stopTimer();
//         callEnded.value = true;
//       } catch (error) {
//         alert("❌ Failed to upload video");
//         console.error(error);
//       }
//     };
//   }
// };

const isProcessingVideo = ref(false)
let pendingBlob: Blob | null = null

// Shared cleanup
const finishCall = () => {
  stopTimer()
  pendingBlob = null
  callEnded.value = true
}

const stopCall = async () => {
  if (!confirm('⚠️ Are you sure you want to stop the call?'))
    return

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' })

      pendingBlob = blob.size > 0 ? blob : null
      isUploadPromptDialog.value = true // show upload prompt
    }
    mediaRecorder.stop()
  }
  else {
    // No recording active, just prompt
    pendingBlob = null
    isUploadPromptDialog.value = true
  }
}

// Step 2b: user chose to skip upload
const endCallWithoutUpload = async () => {
  isUploadPromptDialog.value = false
  isProcessingVideo.value = true

  try {
    await axiosIns.post('/api/stop-consult', { consult_id: Number(props.conid) })
  }
  catch (error) {
    const err = error as { response?: { data?: unknown } }

    console.error(err.response?.data || error)
  }
  finally {
    isProcessingVideo.value = false
    finishCall()
  }
}

const endCallWithUpload = async () => {
  if (!pendingBlob) {
    warningMessage.value = 'No recording available to upload.'
    isWarning.value = true
    await endCallWithoutUpload()

    return
  }

  isUploadPromptDialog.value = false
  isProcessingVideo.value = true

  const formData = new FormData()

  formData.append('consult_id', String(props.conid))
  formData.append('video', pendingBlob, 'video-conference.webm')

  try {
    await axiosIns.post('/api/stop-consult', formData)
    successMessage.value = 'Recording uploaded successfully.'
    isSuccess.value = true
  }
  catch (error) {
    errorMessage.value = 'Failed to upload recording.'
    isError.value = true

    const err = error as { response?: { data?: unknown } }

    console.error(err.response?.data || error)
  }
  finally {
    isProcessingVideo.value = false
    finishCall()
  }
}

function selectMic(deviceId: string) {
  selectedMic.value = deviceId
  restartStream()
}
function selecVid(deviceId: string) {
  selectedCamera.value = deviceId
  restartStream()
}
const controlsVisible = ref(true)
let hideTimeout: number | null = null

const showControls = () => {
  controlsVisible.value = true
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  scheduleHide()
}

const toggleControls = () => {
  controlsVisible.value = !controlsVisible.value
  if (controlsVisible.value)
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    scheduleHide()
}

const scheduleHide = () => {
  if (hideTimeout)
    clearTimeout(hideTimeout)
  hideTimeout = window.setTimeout(() => {
    controlsVisible.value = false
  }, 3000)
}

const cancelHide = () => {
  if (hideTimeout)
    clearTimeout(hideTimeout)
}

// Format seconds -> HH:MM:SS
const formatTime = (secs: number) => {
  const h = String(Math.floor(secs / 3600)).padStart(2, '0')
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')

  return `${h}:${m}:${s}`
}

const closeTab = () => {
  window.close()
}
</script>

<template>
  <VRow
    v-if="!callEnded"
    class="fullscreen-video-row"
    no-gutters
  >
    <VCol
      :cols="colSize"
      :md="colSize"
      :sm="colSize"
    >
      <!-- <VCol cols="12" md="9"> -->
      <div
        class="video-container"
        @mousemove="showControls"
        @click="toggleControls"
      >
        <div class="video-wrap">
          <video
            ref="remoteVideo"
            autoplay
            playsinline
            class="remote-video"
          />
          <video
            ref="localVideo"
            autoplay
            playsinline
            muted
            class="local-video"
          />
          <div class="call-timer">
            {{ formatTime(elapsedSeconds) }}
          </div>

          <Transition name="fade">
            <div
              v-if="controlsVisible"
              class="video-controls"
              @mouseenter="cancelHide"
              @mouseleave="scheduleHide"
            >
              <!--
                <VBtn variant="tonal" icon="tabler-notebook" color="success" :class="smAndDown ? 'mt-3' : 'ma-3'"
                :size="smAndDown ? 'small' : 'x-large'" @click="toggleCols" />
              -->
              <!-- Notebook Button -->
              <VBtn
                variant="tonal"
                icon="tabler-notebook"
                color="success"
                :class="smAndDown ? 'mt-3' : 'ma-3'"
                :size="smAndDown ? 'small' : 'x-large'"
                @click="drawerOpen = true"
              />
              <!-- check call duration value -->
              <!-- <p>{{ callDuration }}</p> -->
              <VMenu location="top">
                <template #activator="{ props }">
                  <VBtn
                    v-if="videoEnabled"
                    v-bind="props"
                    variant="tonal"
                    icon="tabler-video"
                    color="warning"
                    :class="smAndDown ? 'ml-1 mt-3' : 'ma-3'"
                    :size="smAndDown ? 'small' : 'x-large'"
                  />
                  <VBtn
                    v-else
                    v-bind="props"
                    variant="tonal"
                    icon="tabler-video-off"
                    color="error"
                    :class="smAndDown ? 'ml-1 mt-3' : 'ma-3'"
                    :size="smAndDown ? 'small' : 'x-large'"
                  />
                </template>

                <VList>
                  <VListItem
                    v-for="cam in cameras"
                    :key="cam.deviceId"
                    @click="selecVid(cam.deviceId)"
                  >
                    <VListItemTitle>
                      <VBtn
                        v-if="selectedCamera === cam.deviceId"
                        icon="tabler-check"
                        variant="text"
                        color="error"
                      />
                      {{ cam.label || `Camera ${cam.deviceId}` }}
                    </VListItemTitle>
                  </VListItem>
                  <VListItem @click="toggleVideo">
                    <VListItemTitle>
                      {{ videoEnabled ? "Turn Off Camera" : "Turn On Camera" }}
                    </VListItemTitle>
                  </VListItem>
                </VList>
              </VMenu>
              <VMenu location="top">
                <template #activator="{ props }">
                  <VBtn
                    v-if="audioEnabled"
                    v-bind="props"
                    variant="tonal"
                    icon="tabler-microphone"
                    :class="smAndDown ? 'ml-1 mt-3' : 'ma-3'"
                    :size="smAndDown ? 'small' : 'x-large'"
                  />
                  <VBtn
                    v-else
                    v-bind="props"
                    variant="tonal"
                    icon="tabler-microphone-off"
                    color="error"
                    :class="smAndDown ? 'ml-1 mt-3' : 'ma-3'"
                    :size="smAndDown ? 'small' : 'x-large'"
                  />
                </template>

                <VList>
                  <VListItem
                    v-for="mic in microphones"
                    :key="mic.deviceId"
                    @click="selectMic(mic.deviceId)"
                  >
                    <VListItemTitle>
                      <VBtn
                        v-if="selectedMic === mic.deviceId"
                        icon="tabler-check"
                        variant="text"
                        color="error"
                      />
                      {{ mic.label || `Mic ${mic.deviceId}` }}
                    </VListItemTitle>
                  </VListItem>
                  <VListItem @click="toggleAudio">
                    <VListItemTitle>
                      {{ audioEnabled ? "Mute Mic" : "Unmute Mic" }}
                    </VListItemTitle>
                  </VListItem>
                </VList>
              </VMenu>
              <VBtn
                variant="tonal"
                :icon="isFullscreen ? 'tabler-minimize' : 'tabler-maximize'"
                color="secondary"
                :class="smAndDown ? 'ml-1 mt-3' : 'ma-3'"
                :size="smAndDown ? 'small' : 'x-large'"
                @click="toggleFullscreen"
              />
              <VBtn
                variant="tonal"
                icon="tabler-logout"
                color="error"
                :class="smAndDown ? 'ml-1 mt-3' : 'ma-3'"
                :size="smAndDown ? 'small' : 'x-large'"
                @click="stopCall"
              />
            </div>
          </Transition>
        </div>
      </div>
      <div class="device-selectors d-flex align-center justify-center gap-x-4 mb-1" />
    </VCol>
    <VCol
      cols="12"
      md="3"
    >
      <!-- Buttons to open forms -->
      <VNavigationDrawer
        v-model="drawerOpen"
        location="end"
        temporary
        width="400"
        elevation="0"
        class="bg-opacity-75"
      >
        <VDivider />
        <VToolbar color="primary">
          <VToolbarTitle class="text-white">
            Forms
          </VToolbarTitle>
          <VSpacer />
          <VBtn
            icon="tabler-x"
            color="white"
            @click="drawerOpen = false"
          />
        </VToolbar>

        <VDivider />

        <VCard
          flat
          class="pa-4"
        >
          <!-- Render form section buttons -->
          <VBtn
            v-for="card in cards"
            :key="card.id"
            variant="tonal"
            class="justify-start mb-3 w-100 text-white"
            :class="[`btn-${card.color}`]"
            @click="openCard(card.id)"
          >
            <VIcon
              v-if="card.icon"
              :icon="card.icon"
              start
              size="24"
              class="mr-2"
            />
            {{ card.title }}
          </VBtn>
        </VCard>
      </VNavigationDrawer>
      <!-- Larger drawer: actual form view -->
      <VNavigationDrawer
        v-model="isDrawerOpen"
        location="end"
        temporary
        width="700"
        border="none"
        class="form-drawer"
      >
        <VToolbar
          variant="tonal"
          class="text-white"
          :class="[`toolbar-${activeCardIconColor}`, `icon-${activeCardIconColor}`]"
        >
          <VCol class="mr-2 d-flex align-end">
            <VIcon
              v-if="activeCardIcon"
              :icon="activeCardIcon"
              size="28"
              class="mr-2"
            />
            <VToolbarTitle>{{ activeCardTitle }}</VToolbarTitle>
          </VCol>
          <VSpacer />
          <VBtn
            icon="tabler-x"
            variant="text"
            color="white"
            @click="closeCard"
          />
        </VToolbar>
        <VDivider />
        <VCard flat>
          <!--
            <VCardText>
            <component :is="activeCardComponent" :consultId="activeMeetingId" />
            </VCardText>
          -->
          <VCardText
            class="d-flex justify-center align-center"
            style="min-height: 200px;"
          >
            <VProgressCircular
              v-if="isLoading"
              indeterminate
              color="primary"
              size="48"
            />
            <component
              :is="activeCardComponent"
              v-show="!isLoading"
              :consult-id="activeMeetingId"
              @loaded="onComponentLoaded"
            />
          </VCardText>
        </VCard>
      </VNavigationDrawer>
    </VCol>
  </VRow>

  <VRow v-else>
    <VContainer>
      <div class="hero-text-box text-center px-6">
        <h1 class="hero-title mb-4">
          THANK YOU!
        </h1>
        <h6 class="mb-6 text-h5">
          ✅ Your call has ended. All data has been safely stored with strict
          security measures to protect your privacy.
        </h6>
        <div class="position-relative">
          <VBtn
            :size="$vuetify.display.smAndUp ? 'large' : 'default'"
            @click="closeTab"
          >
            Close Tab
          </VBtn>
        </div>
      </div>
    </VContainer>
  </VRow>
  <VDialog
    v-model="isStartDialog"
    persistent
    class="v-dialog-sm blur-dialog"
  >
    <!-- Dialog Content -->
    <VCard title="Teleconsultation">
      <VCardText>
        Chief Complaint: <b>{{ consult.title }}</b>
      </VCardText>
      <VCardText>
        Facility name: {{ consult.encoded?.facility?.facilityname }}
      </VCardText>
      <VCardText>
        <video
          ref="localVideoPreview"
          autoplay
          playsinline
          muted
          class="video-preview"
        />
        <VSelect
          v-model="selectedCamera"
          :items="cameras"
          item-title="label"
          item-value="deviceId"
          label="Select Camera"
          variant="outlined"
          class="mt-3"
          @update:model-value="selecVid"
        />
        <VSelect
          v-model="selectedMic"
          :items="microphones"
          item-title="label"
          item-value="deviceId"
          label="Select Microphone"
          variant="outlined"
          class="mt-3"
          @update:model-value="selectMic"
        />
      </VCardText>

      <VCardText class="d-flex justify-center gap-3 flex-wrap">
        <VBtn
          :color="videoEnabled ? 'error' : 'success'"
          @click="toggleVideo"
        >
          {{ videoEnabled ? "Turn Off Camera" : "Turn On Camera" }}
        </VBtn>
        <VBtn
          :color="audioEnabled ? 'error' : 'success'"
          @click="toggleAudio"
        >
          {{ audioEnabled ? "Mute Mic" : "Unmute Mic" }}
        </VBtn>
        <VBtn @click="startCall">
          Enter Teleconsultation
        </VBtn>
      </VCardText>
    </VCard>
  </VDialog>
  <!-- Upload Prompt Dialog -->
  <VDialog
    v-model="isUploadPromptDialog"
    persistent
    class="v-dialog-sm"
  >
    <VCard title="Save Consultation Recording?">
      <VCardText>
        Would you like to upload the session recording before ending the call?
      </VCardText>
      <VCardText class="d-flex justify-center gap-3 flex-wrap">
        <VBtn
          color="primary"
          :loading="isProcessingVideo"
          @click="endCallWithUpload"
        >
          Yes, Upload Recording
        </VBtn>
        <VBtn
          color="error"
          variant="tonal"
          @click="endCallWithoutUpload"
        >
          No, End Without Upload
        </VBtn>
      </VCardText>
    </VCard>
  </VDialog>
  <VOverlay
    v-model="isProcessingVideo"
    persistent
    class="d-flex align-center justify-center"
    style="height: 100vh;"
  >
    <VCard
      elevation="12"
      class="pa-6 text-center"
    >
      <VCardText>
        <VProgressCircular
          indeterminate
          color="primary"
          size="56"
          width="5"
          class="mb-6"
        />

        <h3 class="mb-2">
          Processing Consultation Recording
        </h3>

        <p class="text-body-2 text-medium-emphasis">
          Please wait while we securely save the session video.<br>
          Do not close or refresh this page.
        </p>
      </VCardText>
    </VCard>
  </VOverlay>
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
  <WarningSnackbar
    :message="warningMessage"
    location="top center"
    :visible="isWarning"
    @update:visible="isWarning = $event"
  />
</template>

<style scoped>
.fullscreen-video-row {
  width: 100%;
  height: 100%;
  flex: 1;
}

html:fullscreen .fullscreen-video-row {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  margin: 0;
  z-index: 9999;
  background: #000000;
}

html:fullscreen .remote-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.video-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000000;
  overflow: hidden;
  border-radius: 12px;
}

.remote-video {
  position: relative;
  width: 100%;
  height: 700px;
  background: #000;
  overflow: hidden;
  border-radius: 12px;
}

.local-video {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  width: 20%;
  max-width: 240px;
  aspect-ratio: 16 / 9;
  border: 2px solid white;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.6);
  margin-right: 20px;
}

@media (max-width: 768px) {
  .local-video {
    width: 30%;
    max-width: 120px;
    bottom: 0.5rem;
    right: 0.5rem;
    height: 140px;
  }

  .video-wrap {
    aspect-ratio: auto;
    height: 500px;
  }
}

.blur-dialog>>>.v-overlay__scrim {
  backdrop-filter: blur(60px);
  background-color: rgba(0, 0, 0, 0.4);
  /* Optional: dark tint */
}

.video-preview {
  width: 100%;
  height: 250px;
  /* you can adjust based on dialog size */
  object-fit: cover;
  /* fills space, crops if needed */
  border-radius: 8px;
  background: black;
  /* fallback if no stream */
}

.slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-enter-to {
  transform: translateX(0);
  opacity: 1;
}

.slide-enter-active {
  transition: all 0.3s ease;
}

.slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-leave-active {
  transition: all 0.3s ease;
}

.video-controls {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  background: rgba(0, 0, 0, 0.5);
  padding: 10px 20px;
  border-radius: 40px;
  transition: opacity 0.3s ease;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  opacity: 1;
  transform: translate(-50%, 0);
}

.call-timer {
  position: absolute;
  top: 10px;
  left: 20px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  z-index: 10;
}

@media (max-width: 599px) {
  .hero-title {
    font-size: 1.5rem !important;
    line-height: 2.375rem !important;
  }
}

.hero-title {
  animation: shine 2s ease-in-out infinite alternate;
  background: linear-gradient(135deg, #28c76f 0%, #5a4aff 47.92%, #ff3739 100%);
  -webkit-background-clip: text;
  background-clip: text;
  font-size: 42px;
  font-weight: 800;
  line-height: 48px;
  -webkit-text-fill-color: rgba(0, 0, 0, 0%);
}
</style>
