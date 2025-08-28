<template>
  <div class="signature-container">
    <canvas
      ref="canvas"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="stopDrawing"
      @mouseleave="stopDrawing"
      @touchstart.prevent="startDrawing"
      @touchmove.prevent="draw"
      @touchend="stopDrawing"
    ></canvas>
  </div>
  <div class="controls">
    <button @click="clearCanvas">Clear</button>
    <button @click="saveSignature">Save</button>
  </div>
</template>

<script lang="ts">
import { cStatus } from "@/components/snackbars/cStatus";
import { axiosIns } from "@/plugins/axios";
import { defineComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
export default defineComponent({
  name: "Signature",
  props: {
    isActive: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    const { isError, errorMessage, isSuccess, successMessage } = cStatus()
    const canvas = ref<HTMLCanvasElement | null>(null);
    let context: CanvasRenderingContext2D | null = null;
    let isDrawing = false;
    const fetchSignature = async () => {
      try {
        const response = await axiosIns.get('api/employee/fetch/signature');
        const signatureDataUrl = response.data.signature;
        loadSignature(signatureDataUrl);
      } catch (error) {
        console.error("Error fetching signature:", error);
      }
    };
    const loadSignature = (signature: string) => {
      if (canvas.value && context) {
        const img = new Image();
        img.onload = () => {
          const canvasWidth = canvas.value!.width;
          const canvasHeight = canvas.value!.height;

          // Original image dimensions
          const imgWidth = img.width;
          const imgHeight = img.height;

          // Calculate dimensions to maintain aspect ratio
          const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
          const scaledWidth = imgWidth * scale;
          const scaledHeight = imgHeight * scale;

          // Calculate the position to center the image
          const x = (canvasWidth - scaledWidth) / 2;
          const y = (canvasHeight - scaledHeight) / 2;

          context!.clearRect(0, 0, canvasWidth, canvasHeight); // Clear the canvas
          context!.drawImage(img, x, y, scaledWidth, scaledHeight);
        };
        img.src = signature; // Set the signature image source
      }
    };

    const initializeCanvas = async () => {
      if (canvas.value) {
        await nextTick();

        const containerWidth = canvas.value.offsetWidth;
        const containerHeight = canvas.value.offsetHeight;

        canvas.value.width = containerWidth;
        canvas.value.height = containerHeight;

        context = canvas.value.getContext("2d");
        if (context) {
          context.strokeStyle = "black";
          context.lineWidth = 2;
        }
      }
    };

    const clearCanvas = () => {
      if (context && canvas.value) {
        context.clearRect(0, 0, canvas.value.width, canvas.value.height);
      }
    };


    const resizeCanvas = () => {
      if (!canvas.value || !context) return;

      const oldWidth = canvas.value.width;
      const oldHeight = canvas.value.height;

      const newWidth = canvas.value.offsetWidth;
      const newHeight = canvas.value.offsetHeight;

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = oldWidth;
      tempCanvas.height = oldHeight;
      const tempContext = tempCanvas.getContext("2d");

      if (tempContext && context) {
        tempContext.drawImage(canvas.value, 0, 0);

        canvas.value.width = newWidth;
        canvas.value.height = newHeight;

        context.fillStyle = "white";
        context.fillRect(0, 0, newWidth, newHeight);
        context.drawImage(
          tempCanvas,
          0,
          0,
          oldWidth,
          oldHeight,
          0,
          0,
          newWidth,
          newHeight
        );
      }
    };

    const startDrawing = (event: MouseEvent | TouchEvent) => {
      isDrawing = true;
      if (context) {
        const { x, y } = getCanvasCoordinates(event);
        context.beginPath();
        context.moveTo(x, y);
      }
    };

    const draw = (event: MouseEvent | TouchEvent) => {
      if (!isDrawing || !context) return;

      const { x, y } = getCanvasCoordinates(event);
      context.lineTo(x, y);
      context.stroke();
    };

    const stopDrawing = () => {
      if (isDrawing && context) {
        context.closePath();
      }
      isDrawing = false;
    };

    const saveSignature = async () => {
      if (canvas.value) {
        const tempCanvas = document.createElement("canvas");
        const tempContext = tempCanvas.getContext("2d");

        if (tempContext && context) {
          tempCanvas.width = canvas.value.width;
          tempCanvas.height = canvas.value.height;

          const imageData = context.getImageData(0, 0, canvas.value.width, canvas.value.height);
          tempContext.putImageData(imageData, 0, 0);

          // Remove transparent background
          const trimmedCanvas = document.createElement("canvas");
          const trimmedContext = trimmedCanvas.getContext("2d");

          if (trimmedContext) {
            trimmedCanvas.width = canvas.value.width;
            trimmedCanvas.height = canvas.value.height;

            const nonEmptyPixels = tempContext.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            trimmedContext.putImageData(nonEmptyPixels, 0, 0);

            const dataUrl = trimmedCanvas.toDataURL("image/png");

            try {
              await axiosIns.post(`/api/employee/store/signature`, { signature: dataUrl });
              successMessage.value = "Successfully saved Signature";
              isSuccess.value = true;
            } catch (error) {
              errorMessage.value = error.response?.data?.message || "Something went wrong. Please try again.";
              isError.value = true;
            }
          }
        }
      }
    };


    const getCanvasCoordinates = (event: MouseEvent | TouchEvent) => {
      const rect = canvas.value!.getBoundingClientRect();
      const x =
        (event instanceof MouseEvent
          ? event.clientX
          : event.touches[0].clientX) - rect.left;
      const y =
        (event instanceof MouseEvent
          ? event.clientY
          : event.touches[0].clientY) - rect.top;
      return { x, y };
    };

    watch(
      () => props.isActive,
      (newVal) => {
        if (newVal) {
          initializeCanvas();
          fetchSignature();
        }
      }
    );

    onMounted(() => {
      if (props.isActive) {
        initializeCanvas();
        fetchSignature();
      }
      window.addEventListener("resize", resizeCanvas);
    });

    onBeforeUnmount(() => {
      window.removeEventListener("resize", resizeCanvas);
    });

    return {
      canvas,
      startDrawing,
      draw,
      stopDrawing,
      clearCanvas,
      saveSignature,
    };
  },
});
</script>

<style scoped>
.signature-container {
  border: 1px solid #ccc;
  width: 100%;
  height: 300px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.signature-container canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.controls {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  justify-content: center;
}
</style>
