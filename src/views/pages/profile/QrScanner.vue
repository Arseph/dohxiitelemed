<template>
  <AlertSuccess 
    :message="successMessage"
    :visible="isSuccess"
    @update:visible="isSuccess = $event"
  />
  <AlertError
    :message="errorMessage"
    :visible="isError"
    @update:visible="isError = $event"
  />
  <div class="qr-code-container">
    <div class="scanner-wrapper">
      <div id="reader" class="mirrored-video"></div>
      <div v-if="isScanning" class="scanning-line"></div>
    </div>
    <VBtn block v-if="!isScanning" @click="qrScan">Scan Again</VBtn>
  </div>
  <LoadingProcess
    :visible="isLoading"
    @update:visible="isLoading = $event"
  />
</template>

<script lang="ts">
import AlertSuccess from '@/components/snackbars/alertSuccess.vue';
import ErrorSnackbar from '@/components/snackbars/errors.vue';
import LoadingProcess from '@/components/snackbars/loading.vue';
import SuccessSnackbar from '@/components/snackbars/success.vue';
import { axiosIns } from '@/plugins/axios';
import { Html5Qrcode } from 'html5-qrcode';
import { defineComponent, onMounted, ref } from 'vue';
export default defineComponent({
  name: 'QrCodeScanner',
  components: {
    LoadingProcess,
    ErrorSnackbar,
    AlertSuccess,
    SuccessSnackbar,
  },
  setup() {
    const decodedData = ref<string | null>(null);
    const isScanning = ref(true);
    const isLoading = ref(false)
    const { user } = useUser();
    const isError = ref(false)
    const errorMessage = ref('')
    const successMessage = ref('')
    const isSuccess = ref(false)
    const latitude = ref<number | null>(null);
    const longitude = ref<number | null>(null);

    const allowedPolygon: [number, number][] = [
      [6.474110, 124.807114],
      [6.476402, 124.808041],
      [6.475055, 124.805018],
      [6.477366, 124.806256],
    ];
    const isWithinAllowedArea = (): boolean => {
      if (latitude.value === null || longitude.value === null) return false;
      return isPointInPolygon(latitude.value, longitude.value, allowedPolygon);
    };
    function isPointInPolygon(lat: number, lon: number, polygon: [number, number][]): boolean {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];

        const intersect =
          yi > lon !== yj > lon &&
          lat < ((xj - xi) * (lon - yi)) / (yj - yi) + xi;

        if (intersect) inside = !inside;
      }
      return inside;
    }

    const getUserLocation = () => {
      return new Promise<void>((resolve, reject) => {
        if (!navigator.geolocation) {
          errorMessage.value = 'Geolocation is not supported by your browser.';
          isError.value = true;
          reject();
          return;
        }
        
        navigator.geolocation.getCurrentPosition(
          position => {
            latitude.value = position.coords.latitude;
            longitude.value = position.coords.longitude;
            resolve();
          },
          error => {
            errorMessage.value = `Location error: ${error.message}`;
            isError.value = true;
            reject();
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });
    };
    onMounted(() => {
      qrScan();
    });
    const qrScan = async () => {
      await nextTick();

      const html5QrCode = new Html5Qrcode("reader");
      const isMobileScreen = ref(false);
      isError.value = false
      errorMessage.value = ''
      successMessage.value = ''
      isSuccess.value = false

      const qrCodeSuccessCallback = (decodedText: string) => {
      isLoading.value = true;
      decodedData.value = decodedText;
      if(decodedData.value == 'PSLIP-23XZ8F91') {
        passSlip()
      } else {
        submit();
      }
      html5QrCode.stop();
      isLoading.value = false;
      isScanning.value = false;
    };

    isScanning.value = true;
    html5QrCode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        qrCodeSuccessCallback
      )
      .catch((err) => {
        errorMessage.value = err;
        isError.value = true;
      });
  };


    const submit = async () => {
      try {
        const response = await axiosIns.post(`/api/employee/attendance/${user.value.id}`, {
            data: decodedData.value,
        });
        isLoading.value = false;
        isSuccess.value = true
        decodedData.value = null
        successMessage.value = response.data.message
      } catch (error) {
        errorMessage.value = error.response.data.message
        isError.value = true
      }
    }
    const passSlip = async () => {
      try {
        await getUserLocation();
      } catch {
        return;
      }
      
      if (!isWithinAllowedArea()) {
        errorMessage.value = `You are not within the authorized scanning zone.`;

        isError.value = true;
        return;
      }
      try {
        const response = await axiosIns.post(`/api/employee/pass-slips-active/${user.value.id}`, {
            data: decodedData.value,
        });
        isLoading.value = false;
        isSuccess.value = true
        decodedData.value = null
        successMessage.value = response.data.message
      } catch (error) {
        errorMessage.value = error.response.data.message
        isError.value = true
      }
    }

    return {
      decodedData,
      isScanning,
      qrScan,
      isLoading,
      isError,
      errorMessage,
      successMessage,
      isSuccess,
    };
  },
});
</script>

<style scoped>
.qr-code-container {
  text-align: center;
  margin-top: 20px;
}

.scanner-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
  max-width: 400px;
  height: 400px;
}
.mirrored-video video {
  transform: scaleX(-1); /* Flip video horizontally */
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}
.scanning-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: rgba(0, 255, 0, 0.7);
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
  animation: scan 2s linear infinite; /* Infinite scanning animation */
}

@keyframes scan {
  0% {
    top: 0;
  }
  100% {
    top: 100%;
  }
}
</style>
