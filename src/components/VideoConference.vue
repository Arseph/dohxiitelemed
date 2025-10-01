<template>
  <VRow>
    <VCol :cols="colSize" :md="colSize" :sm="colSize">
      <div class="video-container">
        <div class="video-wrap">
          <video ref="remoteVideo" autoplay playsinline class="remote-video" />
          <video ref="localVideo" autoplay playsinline muted class="local-video" />
        </div>
      </div>
      <div class="device-selectors d-flex align-center justify-center gap-x-4 mb-1">
        <VBtn
          variant="tonal"
          icon="tabler-notebook"
          color="success"
          :class="smAndDown ? 'mt-3' : 'ma-3'"
          :size="smAndDown ? 'small' : 'x-large'"
          @click="toggleCols"
        />
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
                  v-if="selectedCamera == cam.deviceId"
                  icon="tabler-check"
                  variant="text"
                  color="error"
                />
                {{ cam.label || 'Camera ' + cam.deviceId }}
              </VListItemTitle>
            </VListItem>
            <VListItem
              @click="toggleVideo"
            >
              <VListItemTitle>
                {{ videoEnabled ? 'Turn Off Camera' : 'Turn On Camera' }}
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
                  v-if="selectedMic == mic.deviceId"
                  icon="tabler-check"
                  variant="text"
                  color="error"
                />
                {{ mic.label || 'Mic ' + mic.deviceId }}
              </VListItemTitle>
            </VListItem>
            <VListItem
              @click="toggleAudio"
            >
              <VListItemTitle>
                {{ audioEnabled ? 'Mute Mic' : 'Unmute Mic' }}
              </VListItemTitle>
            </VListItem>
          </VList>
        </VMenu>
        <VBtn
          variant="tonal"
          icon="tabler-logout"
          color="error"
          :class="smAndDown ? 'ml-1 mt-3' : 'ma-3'"
          :size="smAndDown ? 'small' : 'x-large'"
          @click="stopRecording"
        />
      </div>
    </VCol>
    <VCol v-if="colSize == 6" cols="6" md="6" sm="6">
      <div v-if="activeCard === null" class="flex gap-2">
        <button
          v-for="card in cards"
          :key="card.id"
          @click="openCard(card.id)"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Open {{ card.title }}
        </button>
      </div>
      <Transition name="slide">
      <!-- Show active card -->
      <div
        v-if="activeCard !== null"
        class="fixed top-0 left-0 h-full w-64 bg-white shadow-lg p-4"
      >
        <VCard>
          <VCardTitle>
            <div class="d-flex justify-end">
              <button
                @click="closeCard"
                class="px-2 py-1 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Back
              </button>
            </div>
            {{ cards.find(c => c.id === activeCard)?.title }}
          </VCardTitle>
          <VCardText>
            <!-- Render dynamic component -->
            <component :is="cards.find(c => c.id === activeCard)?.component" />
          </VCardText>
        </VCard>
      </div>
    </Transition>
    </VCol>
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
         <video ref="localVideoPreview" autoplay playsinline muted class="video-preview"/>
        <VSelect
        v-model="selectedCamera"
        :items="cameras"
        item-title="label"
        item-value="deviceId"
        label="Select Camera"
        variant="outlined"
        class="mt-3"
        @update:modelValue="selecVid"
        />
        <VSelect
        v-model="selectedMic"
        :items="microphones"
        item-title="label"
        item-value="deviceId"
        label="Select Microphone"
        variant="outlined"
        class="mt-3"
          @update:modelValue="selectMic"
        />
      </VCardText>

      <VCardText class="d-flex justify-center gap-3 flex-wrap">
        <VBtn
          :color="videoEnabled ? 'error' : 'success'"
          @click="toggleVideo"
        >
          {{ videoEnabled ? 'Turn Off Camera' : 'Turn On Camera' }}
        </VBtn>
        <VBtn
          :color="audioEnabled ? 'error' : 'success'"
          @click="toggleAudio"
        >
          {{ audioEnabled ? 'Mute Mic' : 'Unmute Mic' }}
        </VBtn>
        <VBtn @click="startCall">
          Enter Teleconsultation
        </VBtn>
      </VCardText>
    </VCard>
  </VDialog>
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


<script lang="ts" setup>
import { cStatus } from "@/components/snackbars/cStatus";
import ErrorSnackbar from '@/components/snackbars/errors.vue';
import SuccessSnackbar from '@/components/snackbars/success.vue';
import { io } from 'socket.io-client';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useDisplay } from 'vuetify';
import { VCardTitle, VCol } from 'vuetify/lib/components/index.mjs';
import Form1 from "./forms/form1.vue";
import Form2 from "./forms/form2.vue";

const props = defineProps<{
    conid: any
}>()
interface CardItem {
  id: number
  title: string
  component: any
}
const cards = ref<CardItem[]>([
  { id: 1, title: "Demographic Profile", component: Form1 },
  { id: 2, title: "Form 2", component: Form2 },
])
const activeCard = ref<number | null>(null)
const showCard = ref(false)

const openCard = (id: number) => {
  activeCard.value = id
}
const closeCard = () => {
  activeCard.value = null
}
const { isError, errorMessage, isSuccess, successMessage } = cStatus()
const { smAndDown } = useDisplay()
const colSize = ref(12)
const isStartDialog = ref(true)
const toggleCols = () => {
  colSize.value = colSize.value === 12 ? 6 : 12
}

const localVideo = ref<HTMLVideoElement | null>(null)
const localVideoPreview = ref<HTMLVideoElement | null>(null)
const remoteVideo = ref<HTMLVideoElement | null>(null)

const selectedCamera = ref<string | null>(null)
const selectedMic = ref<string | null>(null)
const cameras = ref<MediaDeviceInfo[]>([])
const microphones = ref<MediaDeviceInfo[]>([])
const videoEnabled = ref(true)
const audioEnabled = ref(true)
const roomId = props.conid
const consult = ref([])
let socket: any
let peerConnection: RTCPeerConnection
let localStream: MediaStream
let mediaRecorder: MediaRecorder
let recordedChunks: Blob[] = []

const config: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
  ],
}
onMounted(async () => {
  const stored = sessionStorage.getItem('consultationData')
  if (stored) {
    consult.value = JSON.parse(stored)
  }
  await loadDevices()
  await restartStream()
  // ✅ 1. Connect to signaling server
  socket = io("https://telemed-dev.dohsox.com", {
    path: "/socket.io",
    transports: ["websocket"],
    withCredentials: true,
  })

  socket.on("connect", () => {
    console.log("✅ Connected to signaling server")
    socket.emit("join", roomId)
  })

  // ✅ 2. Setup socket listeners
  socket.on("offer", async (offer: RTCSessionDescriptionInit) => {
    console.log("📩 Received offer", offer)

    if (!peerConnection) createPeerConnection()

    await peerConnection!.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await peerConnection!.createAnswer()
    await peerConnection!.setLocalDescription(answer)

    socket.emit("answer", { roomId, answer })
  })

  socket.on("answer", async (answer: RTCSessionDescriptionInit) => {
    console.log("📩 Received answer", answer)
    successMessage.value = "User Enter the Teleconsultation";
    isSuccess.value = true;
    await peerConnection!.setRemoteDescription(new RTCSessionDescription(answer))
  })

  socket.on("ice-candidate", async (candidate: RTCIceCandidateInit) => {
    console.log("📩 Received candidate", candidate)
    try {
      await peerConnection!.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (err) {
      console.error("Error adding ICE candidate", err)
    }
  })
  socket.on("user-disconnected", (userId: string) => {
    console.log(`❌ User ${userId} disconnected`)
    // Here you can close the peer connection or show UI
    errorMessage.value = "User Disconnected";
    isError.value = true;
    if (peerConnection) {
      peerConnection.close()
    }
  })
  if (peerConnection) {
    peerConnection.onconnectionstatechange = () => {
      console.log("🔄 Connection state:", peerConnection.connectionState)

      if (peerConnection.connectionState === "disconnected" || 
          peerConnection.connectionState === "failed" || 
          peerConnection.connectionState === "closed") {
        console.log("❌ Remote peer disconnected")
        // cleanup UI
        peerConnection.close()
      }
    }
  }
  startRecording()
})

onBeforeUnmount(() => {
  if (peerConnection) peerConnection.close()
  if (socket) socket.disconnect()
})

function createPeerConnection() {
  peerConnection = new RTCPeerConnection(config)

  // send ICE candidates to signaling
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("📤 Sending ICE", event.candidate)
      socket.emit("ice-candidate", { roomId, candidate: event.candidate })
    }
  }

  // remote stream
  peerConnection.ontrack = (event) => {
    console.log("🎥 Remote stream received")
    if (remoteVideo.value) {
      remoteVideo.value.srcObject = event.streams[0]
    }
  }

  return peerConnection
}

const getStream = async () => {
  const constraints = {
    video: selectedCamera.value ? { deviceId: { exact: selectedCamera.value } } : true,
    audio: selectedMic.value ? { deviceId: { exact: selectedMic.value } } : true
  }
  return await navigator.mediaDevices.getUserMedia(constraints)
}

const restartStream = async () => {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop())
  }

  localStream = await getStream()

  if (localVideo.value) {
    localVideo.value.srcObject = localStream
  }
  if (localVideoPreview.value) {
    localVideoPreview.value.srcObject = localStream
  }

  // Replace tracks in peer connection
  if (peerConnection) {
    const senders = peerConnection.getSenders()
    localStream.getTracks().forEach(track => {
      const sender = senders.find(s => s.track?.kind === track.kind)
      if (sender) {
        sender.replaceTrack(track)
      }
    })
  }
}

async function startCall() {
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
  
  if (localVideo.value) {
    localVideo.value.srcObject = localStream
  }
  
  if (!peerConnection) createPeerConnection()
  
  localStream.getTracks().forEach((track) => {
    peerConnection!.addTrack(track, localStream!)
  })
  
  const offer = await peerConnection!.createOffer()
  await peerConnection!.setLocalDescription(offer)
  
  socket.emit("offer", { roomId, offer })
  isStartDialog.value = false
}
const toggleVideo = () => {
  if (!localStream) return
  videoEnabled.value = !videoEnabled.value
  localStream.getVideoTracks().forEach(track => (track.enabled = videoEnabled.value))
}

const toggleAudio = () => {
  if (!localStream) return
  audioEnabled.value = !audioEnabled.value
  localStream.getAudioTracks().forEach(track => (track.enabled = audioEnabled.value))
}

const loadDevices = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices()
  cameras.value = devices.filter(d => d.kind === 'videoinput')
  microphones.value = devices.filter(d => d.kind === 'audioinput')

  if (!selectedCamera.value && cameras.value.length) {
    selectedCamera.value = cameras.value[0].deviceId
  }

  if (!selectedMic.value && microphones.value.length) {
    selectedMic.value = microphones.value[0].deviceId
  }
}

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
let canvasStream: MediaStream

const startRecording = () => {
  if (!localVideo.value || !remoteVideo.value) return

  // Set canvas size to match video layout
  canvas.width = 1280
  canvas.height = 480

  // Draw both videos on canvas every frame
  const drawFrame = () => {
    if (!ctx) return
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

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) recordedChunks.push(event.data)
  }

  mediaRecorder.start()
}


const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)

      // Auto-download
      const a = document.createElement('a')
      a.href = url
      a.download = 'video-conference.webm'
      a.click()

      URL.revokeObjectURL(url)
    }
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
</script>

<style scoped>
.video-container {
  display: flex;
  justify-content: center;
  align-items: center;
}
.video-wrap {
  position: relative;
  width: 100%;
  max-width: 1280px;
  height: 520px;
  background: #000;
  overflow: hidden;
  border-radius: 12px;
}

.remote-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  box-shadow: 0 0 10px rgba(0,0,0,0.6);
}
@media (max-width: 768px) {
  .local-video {
    width: 30%;
    max-width: 120px;
    bottom: 0.5rem;
    right: 0.5rem;
    height:140px;
  }

  .video-wrap {
    aspect-ratio: auto;
    height: 500px;
  }
}
.blur-dialog >>> .v-overlay__scrim {
  backdrop-filter: blur(60px);
  background-color: rgba(0, 0, 0, 0.4); /* Optional: dark tint */
}
.video-preview {
  width: 100%;
  height: 250px; /* you can adjust based on dialog size */
  object-fit: cover; /* fills space, crops if needed */
  border-radius: 8px;
  background: black; /* fallback if no stream */
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
</style>
