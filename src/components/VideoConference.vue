<template>
  <VRow v-if="!callEnded" class="fullscreen-video-row" no-gutters>
    <VCol :cols="colSize" :md="colSize" :sm="colSize">
      <!-- <VCol cols="12" md="9"> -->
      <div class="video-container" @mousemove="showControls" @click="toggleControls">
        <div class="video-wrap">
          <video ref="remoteVideo" autoplay playsinline class="remote-video" />
          <video ref="localVideo" autoplay playsinline muted class="local-video" />
          <div class="call-timer">
            {{ formatTime(elapsedSeconds) }}
          </div>

          <transition name="fade">
            <div v-if="controlsVisible" class="video-controls" @mouseenter="cancelHide" @mouseleave="scheduleHide">
              <!-- <VBtn variant="tonal" icon="tabler-notebook" color="success" :class="smAndDown ? 'mt-3' : 'ma-3'"
                :size="smAndDown ? 'small' : 'x-large'" @click="toggleCols" /> -->
              <!-- Notebook Button -->
              <VBtn variant="tonal" icon="tabler-notebook" color="success" :class="smAndDown ? 'mt-3' : 'ma-3'"
                :size="smAndDown ? 'small' : 'x-large'" @click="drawerOpen = true" />
              <!-- check call duration value -->
              <!-- <p>{{ callDuration }}</p> -->
              <VMenu location="top">
                <template #activator="{ props }">
                  <VBtn v-if="videoEnabled" v-bind="props" variant="tonal" icon="tabler-video" color="warning"
                    :class="smAndDown ? 'ml-1 mt-3' : 'ma-3'" :size="smAndDown ? 'small' : 'x-large'" />
                  <VBtn v-else v-bind="props" variant="tonal" icon="tabler-video-off" color="error"
                    :class="smAndDown ? 'ml-1 mt-3' : 'ma-3'" :size="smAndDown ? 'small' : 'x-large'" />
                </template>

                <VList>
                  <VListItem v-for="cam in cameras" :key="cam.deviceId" @click="selecVid(cam.deviceId)">
                    <VListItemTitle>
                      <VBtn v-if="selectedCamera == cam.deviceId" icon="tabler-check" variant="text" color="error" />
                      {{ cam.label || "Camera " + cam.deviceId }}
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
                  <VBtn v-if="audioEnabled" v-bind="props" variant="tonal" icon="tabler-microphone"
                    :class="smAndDown ? 'ml-1 mt-3' : 'ma-3'" :size="smAndDown ? 'small' : 'x-large'" />
                  <VBtn v-else v-bind="props" variant="tonal" icon="tabler-microphone-off" color="error"
                    :class="smAndDown ? 'ml-1 mt-3' : 'ma-3'" :size="smAndDown ? 'small' : 'x-large'" />
                </template>

                <VList>
                  <VListItem v-for="mic in microphones" :key="mic.deviceId" @click="selectMic(mic.deviceId)">
                    <VListItemTitle>
                      <VBtn v-if="selectedMic == mic.deviceId" icon="tabler-check" variant="text" color="error" />
                      {{ mic.label || "Mic " + mic.deviceId }}
                    </VListItemTitle>
                  </VListItem>
                  <VListItem @click="toggleAudio">
                    <VListItemTitle>
                      {{ audioEnabled ? "Mute Mic" : "Unmute Mic" }}
                    </VListItemTitle>
                  </VListItem>
                </VList>
              </VMenu>
              <VBtn variant="tonal" :icon="isFullscreen ? 'tabler-minimize' : 'tabler-maximize'" color="secondary"
                :class="smAndDown ? 'ml-1 mt-3' : 'ma-3'" :size="smAndDown ? 'small' : 'x-large'"
                @click="toggleFullscreen" />
              <VBtn variant="tonal" icon="tabler-logout" color="error" :class="smAndDown ? 'ml-1 mt-3' : 'ma-3'"
                :size="smAndDown ? 'small' : 'x-large'" @click="stopCall" />
            </div>
          </transition>
        </div>
      </div>
      <div class="device-selectors d-flex align-center justify-center gap-x-4 mb-1"></div>
    </VCol>
    <VCol cols="12" md="3">
      <!-- Buttons to open forms -->
      <VNavigationDrawer v-model="drawerOpen" location="end" temporary width="400" elevation="0" class="bg-opacity-75">
        <VDivider />
        <VToolbar color="primary">
          <VToolbarTitle class="text-white">Forms</VToolbarTitle>
          <VSpacer />
          <VBtn icon="tabler-x" color="white" @click="drawerOpen = false" />
        </VToolbar>

        <VDivider />

        <VCard flat class="pa-4">
          <!-- Render form section buttons -->
          <VBtn v-for="card in cards" :key="card.id" variant="tonal"
            :class="['justify-start mb-3 w-100 text-white', `btn-${card.color}`]" @click="openCard(card.id)">
            <VIcon v-if="card.icon" :icon="card.icon" start size="24" class="mr-2" />
            {{ card.title }}
          </VBtn>
        </VCard>
      </VNavigationDrawer>
      <!-- Larger drawer: actual form view -->
      <VNavigationDrawer v-model="isDrawerOpen" location="end" temporary width="700" border="none" class="form-drawer">
        <VToolbar variant="tonal"
          :class="['toolbar-' + activeCardIconColor, 'icon-' + activeCardIconColor, 'text-white']">
          <VCol class="mr-2 d-flex align-end">
            <VIcon v-if="activeCardIcon" :icon="activeCardIcon" size="28" class="mr-2" />
            <VToolbarTitle>{{ activeCardTitle }}</VToolbarTitle>
          </VCol>
          <VSpacer />
          <VBtn icon="tabler-x" variant="text" color="white" @click="closeCard()" />
        </VToolbar>
        <VDivider />
        <VCard flat>
          <!-- <VCardText>
            <component :is="activeCardComponent" :consultId="activeMeetingId" />
          </VCardText> -->
          <VCardText class="d-flex justify-center align-center" style="min-height: 200px;">
            <v-progress-circular v-if="isLoading" indeterminate color="primary" size="48" />
            <component v-show="!isLoading" :is="activeCardComponent" :consultId="activeMeetingId"
              @loaded="onComponentLoaded" />
          </VCardText>
        </VCard>
      </VNavigationDrawer>
    </VCol>
  </VRow>

  <VRow v-else>
    <VContainer>
      <div class="hero-text-box text-center px-6">
        <h1 class="hero-title mb-4">THANK YOU!</h1>
        <h6 class="mb-6 text-h5">
          ✅ Your call has ended. All data has been safely stored with strict
          security measures to protect your privacy.
        </h6>
        <div class="position-relative">
          <VBtn :size="$vuetify.display.smAndUp ? 'large' : 'default'" @click="closeTab">
            Close Tab
          </VBtn>
        </div>
      </div>
    </VContainer>
  </VRow>
  <VDialog v-model="isStartDialog" persistent class="v-dialog-sm blur-dialog">
    <!-- Dialog Content -->
    <VCard title="Teleconsultation">
      <VCardText>
        Chief Complaint: <b>{{ consult.title }}</b>
      </VCardText>
      <VCardText>
        Facility name: {{ consult.encoded?.facility?.facilityname }}
      </VCardText>
      <VCardText>
        <video ref="localVideoPreview" autoplay playsinline muted class="video-preview" />
        <VSelect v-model="selectedCamera" :items="cameras" item-title="label" item-value="deviceId"
          label="Select Camera" variant="outlined" class="mt-3" @update:modelValue="selecVid" />
        <VSelect v-model="selectedMic" :items="microphones" item-title="label" item-value="deviceId"
          label="Select Microphone" variant="outlined" class="mt-3" @update:modelValue="selectMic" />
      </VCardText>

      <VCardText class="d-flex justify-center gap-3 flex-wrap">
        <VBtn :color="videoEnabled ? 'error' : 'success'" @click="toggleVideo">
          {{ videoEnabled ? "Turn Off Camera" : "Turn On Camera" }}
        </VBtn>
        <VBtn :color="audioEnabled ? 'error' : 'success'" @click="toggleAudio">
          {{ audioEnabled ? "Mute Mic" : "Unmute Mic" }}
        </VBtn>
        <VBtn @click="startCall"> Enter Teleconsultation </VBtn>
      </VCardText>
    </VCard>
  </VDialog>
  <VOverlay v-model="isProcessingVideo" persistent class="d-flex align-center justify-center" style="height: 100vh;">
    <VCard elevation="12" class="pa-6 text-center">
      <VCardText>
        <VProgressCircular indeterminate color="primary" size="56" width="5" class="mb-6" />

        <h3 class="mb-2">
          Processing Consultation Recording
        </h3>

        <p class="text-body-2 text-medium-emphasis">
          Please wait while we securely save the session video.<br />
          Do not close or refresh this page.
        </p>
      </VCardText>
    </VCard>
  </VOverlay>
  <ErrorSnackbar :message="errorMessage" :visible="isError" @update:visible="isError = $event" />
  <SuccessSnackbar :message="successMessage" :visible="isSuccess" @update:visible="isSuccess = $event" />
  <WarningSnackbar :message="warningMessage" location="top center" :visible="isWarning"
    @update:visible="isWarning = $event" />
</template>

<script lang="ts" setup>
// import AppDrawerHeaderSection from "@/components/AppDrawerHeaderSection.vue"; // Vuexy built-in header (Cancel button + Title)
import { cStatus } from "@/components/snackbars/cStatus";
import ErrorSnackbar from "@/components/snackbars/errors.vue";
import SuccessSnackbar from "@/components/snackbars/success.vue";
import WarningSnackbar from "@/components/snackbars/warning.vue";

import { axiosIns } from "@/plugins/axios";
import { io } from "socket.io-client";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useDisplay } from "vuetify";
import { VCol } from "vuetify/lib/components/index.mjs";
import Form1 from "./forms/form1.vue";
import Form2 from "./forms/form2.vue";
import Form3 from "./forms/form3.vue";
import Form4 from "./forms/form4.vue";
import Form5 from "./forms/form5.vue";

let warningTriggered = false

const props = defineProps<{
  conid: any;
}>();

const callDuration = ref<number | null>(null);

interface CardItem {
  id: number;
  title: string;
  icon: string;
  color: string;
  component: any;
}

const cards = ref<CardItem[]>([
  { id: 1, title: "Demographic Profile", icon: "tabler-user", color: "royalblue", component: Form1 },
  { id: 2, title: "Clinical History & Physical Examination", icon: "tabler-stethoscope", color: "magenta", component: Form2 },
  { id: 3, title: "COVID-19 Screening", icon: "tabler-virus-search", color: "red", component: Form3 },
  { id: 4, title: "Diagnosis / Assessment", icon: "tabler-notes", color: "blue", component: Form4 },
  { id: 5, title: "Plan of Management", icon: "tabler-clipboard-check", color: "green", component: Form5 },
]);

// const activeCard = ref<number | null>(null);
// const showCard = ref(false);

const drawerOpen = ref(false) //button drawer
const isDrawerOpen = ref(false) //form drawer

const activeCardTitle = ref('')
const activeCardIcon = ref('')
const activeCardIconColor = ref('')
const activeCardComponent = ref(null)
const isLoading = ref(false)

// 🧩 Track previously opened component
let lastCardComponent: any = null


function openCard(id: number) {
  const selected = cards.value.find(c => c.id === id)
  if (!selected) return

  const isSameComponent = lastCardComponent === selected.component
  lastCardComponent = selected.component

  drawerOpen.value = false               // close small drawer
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
  } else {
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


const { isError, errorMessage, isSuccess, successMessage, isWarning, warningMessage } = cStatus();
const { smAndDown } = useDisplay();
const colSize = ref(12);
const isStartDialog = ref(true);

// const toggleCols = () => {
//   colSize.value = colSize.value === 12 ? 9 : 12;
// };

const localVideo = ref<HTMLVideoElement | null>(null);
const localVideoPreview = ref<HTMLVideoElement | null>(null);
const remoteVideo = ref<HTMLVideoElement | null>(null);

const selectedCamera = ref<string | null>(null);
const selectedMic = ref<string | null>(null);
const cameras = ref<MediaDeviceInfo[]>([]);
const microphones = ref<MediaDeviceInfo[]>([]);
const videoEnabled = ref(true);
const audioEnabled = ref(true);
const roomId = props.conid;
const consult = ref([]);
let socket: any;
let peerConnection: RTCPeerConnection;
let localStream: MediaStream;
let mediaRecorder: MediaRecorder;
let recordedChunks: Blob[] = [];
const callEnded = ref(false);
const config: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
onMounted(async () => {
  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  const stored = sessionStorage.getItem("consultationData");
  if (stored) {
    consult.value = JSON.parse(stored);
  }
  await loadDevices();
  await restartStream();
  // ✅ 1. Connect to signaling server
  socket = io("https://telemed-dev.dohsox.com", {
    path: "/socket.io",
    transports: ["websocket"],
    withCredentials: true,
  });

  socket.on("connect", () => {
    socket.emit("join", roomId);
  });

  // ✅ 2. Setup socket listeners
  socket.on("offer", async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnection) createPeerConnection();

    await peerConnection!.setRemoteDescription(
      new RTCSessionDescription(offer)
    );
    const answer = await peerConnection!.createAnswer();
    await peerConnection!.setLocalDescription(answer);

    socket.emit("answer", { roomId, answer });
  });

  socket.on("answer", async (answer: RTCSessionDescriptionInit) => {
    successMessage.value = "User Enter the Teleconsultation";
    isSuccess.value = true;
    await peerConnection!.setRemoteDescription(
      new RTCSessionDescription(answer)
    );
  });

  socket.on("ice-candidate", async (candidate: RTCIceCandidateInit) => {
    try {
      await peerConnection!.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("Error adding ICE candidate", err);
    }
  });
  socket.on("user-disconnected", (userId: string) => {
    errorMessage.value = "User Disconnected";
    isError.value = true;
    if (peerConnection) {
      peerConnection.close();
    }
  });
  if (peerConnection) {
    peerConnection.onconnectionstatechange = () => {
      if (
        peerConnection.connectionState === "disconnected" ||
        peerConnection.connectionState === "failed" ||
        peerConnection.connectionState === "closed"
      ) {
        // cleanup UI
        peerConnection.close();
      }
    };
  }
  startRecording();
});

onBeforeUnmount(() => {
  if (peerConnection) peerConnection.close();
  if (socket) socket.disconnect();
});

function createPeerConnection() {
  peerConnection = new RTCPeerConnection(config);

  // send ICE candidates to signaling
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", { roomId, candidate: event.candidate });
    }
  };

  // remote stream
  peerConnection.ontrack = (event) => {
    if (remoteVideo.value) {
      remoteVideo.value.srcObject = event.streams[0];
    }
  };

  return peerConnection;
}

const getStream = async () => {
  const constraints = {
    video: selectedCamera.value
      ? { deviceId: { exact: selectedCamera.value } }
      : true,
    audio: selectedMic.value
      ? { deviceId: { exact: selectedMic.value } }
      : true,
  };
  return await navigator.mediaDevices.getUserMedia(constraints);
};

const restartStream = async () => {
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }

  localStream = await getStream();

  if (localVideo.value) {
    localVideo.value.srcObject = localStream;
  }
  if (localVideoPreview.value) {
    localVideoPreview.value.srcObject = localStream;
  }

  // Replace tracks in peer connection
  if (peerConnection) {
    const senders = peerConnection.getSenders();
    localStream.getTracks().forEach((track) => {
      const sender = senders.find((s) => s.track?.kind === track.kind);
      if (sender) {
        sender.replaceTrack(track);
      }
    });
  }
};

const activeMeetingId = ref<number | null>(null);

async function startCall() {
  try {
    const response = await axiosIns.get(`/api/start-consult`, {
      params: { consult_id: props.conid },
    });

    const data = response.data;

    if (response.data.is_finished) {
      alert("Teleconsultation Finished!");
      return;
    }

    // ✅ store meeting id
    activeMeetingId.value = response.data.id;

    // ✅ Calculate call duration (in seconds)
    const dateMeeting = data.date_meeting; // e.g. "2025-10-29"
    const from = data.from_time
      ? new Date(`${dateMeeting}T${data.from_time}`)
      : null;
    const to = data.to_time
      ? new Date(`${dateMeeting}T${data.to_time}`)
      : null;

    let durationSeconds = null;

    if (from && to && !isNaN(from.getTime()) && !isNaN(to.getTime())) {
      durationSeconds = (to.getTime() - from.getTime()) / 1000;
    }

    callDuration.value = durationSeconds;

    setCallStartTime(response.data.start_time);
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    if (localVideo.value) {
      localVideo.value.srcObject = localStream;
    }

    if (!peerConnection) createPeerConnection();

    localStream.getTracks().forEach((track) => {
      peerConnection!.addTrack(track, localStream!);
    });

    const offer = await peerConnection!.createOffer();
    await peerConnection!.setLocalDescription(offer);

    socket.emit("offer", { roomId, offer });
    isStartDialog.value = false;
  } catch (error) {
    console.error(error);
  } finally {
  }
}
const toggleVideo = () => {
  if (!localStream) return;
  videoEnabled.value = !videoEnabled.value;
  localStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = videoEnabled.value));
};

const toggleAudio = () => {
  if (!localStream) return;
  audioEnabled.value = !audioEnabled.value;
  localStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = audioEnabled.value));
};

const loadDevices = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  cameras.value = devices.filter((d) => d.kind === "videoinput");
  microphones.value = devices.filter((d) => d.kind === "audioinput");

  if (!selectedCamera.value && cameras.value.length) {
    selectedCamera.value = cameras.value[0].deviceId;
  }

  if (!selectedMic.value && microphones.value.length) {
    selectedMic.value = microphones.value[0].deviceId;
  }
};

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
let canvasStream: MediaStream;

const startRecording = () => {
  if (!localVideo.value || !remoteVideo.value) return;

  // Set canvas size to match video layout
  canvas.width = 1280;
  canvas.height = 480;

  // Draw both videos on canvas every frame
  const drawFrame = () => {
    if (!ctx) return;
    ctx.drawImage(localVideo.value!, 0, 0, 640, 480); // Left half
    ctx.drawImage(remoteVideo.value!, 640, 0, 640, 480); // Right half
    requestAnimationFrame(drawFrame);
  };
  drawFrame();

  // Capture canvas as stream
  canvasStream = (canvas as HTMLCanvasElement).captureStream(30); // 30 fps

  // Add local audio to the stream
  localStream.getAudioTracks().forEach((track) => {
    canvasStream.addTrack(track);
  });

  recordedChunks = [];
  mediaRecorder = new MediaRecorder(canvasStream);

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) recordedChunks.push(event.data);
  };

  mediaRecorder.start();
};

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

const isProcessingVideo = ref(false);

const stopCall = async () => {
  if (!confirm("⚠️ Are you sure you want to stop the call?")) return;

  if (mediaRecorder && mediaRecorder.state !== "inactive") {

    isProcessingVideo.value = true;

    // Assign onstop BEFORE stopping
    mediaRecorder.onstop = async () => {

      if (!recordedChunks || recordedChunks.length === 0) {
        alert("⚠️ No video recorded!");
        return;
      }

      const blob = new Blob(recordedChunks, { type: "video/webm" });
      console.log("Blob size:", blob.size); // check size
      if (blob.size === 0) {
        alert("⚠️ Empty video, cannot upload");
        return;
      }

      const formData = new FormData();
      formData.append("consult_id", Number(props.conid));
      formData.append("video", blob, "video-conference.webm");

      // Debug FormData entries
      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }

      try {
        const response = await axiosIns.post(`/api/stop-consult`, formData);
        stopTimer();
        callEnded.value = true;
        isProcessingVideo.value = false;
        console.log("✅ Video uploaded:", response.data);
      } catch (error) {
        alert("❌ Failed to upload video");
        console.error(error.response?.data || error);
        isProcessingVideo.value = false;
      }
    };

    mediaRecorder.stop(); // stop AFTER assigning onstop
  }
};


function selectMic(deviceId: string) {
  selectedMic.value = deviceId;
  restartStream();
}
function selecVid(deviceId: string) {
  selectedCamera.value = deviceId;
  restartStream();
}
const controlsVisible = ref(true);
let hideTimeout: number | null = null;

const showControls = () => {
  controlsVisible.value = true;
  scheduleHide();
};

const toggleControls = () => {
  controlsVisible.value = !controlsVisible.value;
  if (controlsVisible.value) scheduleHide();
};

const scheduleHide = () => {
  if (hideTimeout) clearTimeout(hideTimeout);
  hideTimeout = window.setTimeout(() => {
    controlsVisible.value = false;
  }, 3000);
};

const cancelHide = () => {
  if (hideTimeout) clearTimeout(hideTimeout);
};
const isFullscreen = ref(false);

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    isFullscreen.value = true;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      isFullscreen.value = false;
    }
  }
};
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && isFullscreen.value) {
    toggleFullscreen();
  }
};

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};
const callStartTime = ref<string | null>(null);
const elapsedSeconds = ref(0);
let timerInterval: number | null = null;

const setCallStartTime = (startTime: string) => {
  callStartTime.value = startTime;
  startTimer();
};

const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = window.setInterval(() => {
    if (callStartTime.value) {
      const start = new Date(callStartTime.value).getTime();
      const now = Date.now();
      elapsedSeconds.value = Math.floor((now - start) / 1000);

      // Check for 5-minute warning)
      if (!warningTriggered && elapsedSeconds.value >= callDuration.value - (5 * 60)) {
        warningMessage.value = "Less that 5 minutes remaining!";
        isWarning.value = true;
        warningTriggered = true;
        // console.log("Less that 5 minutes remaining!");
      }
    }
  }, 1000);
};

const stopTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
};

// Format seconds -> HH:MM:SS
const formatTime = (secs: number) => {
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

const closeTab = () => {
  window.close();
};
</script>

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
