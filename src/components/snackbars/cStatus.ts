import { ref } from "vue"

const isError = ref(false)
const errorMessage = ref("")
const isSuccess = ref(false)
const successMessage = ref("")
const isWarning = ref(false)
const warningMessage = ref("")
export function cStatus() {
  return { isError, errorMessage, isSuccess, successMessage, isWarning, warningMessage }
}
