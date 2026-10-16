<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { VForm } from 'vuetify/components/VForm'
import { cStatus } from '@/components/snackbars/cStatus'
import ConfirmDialog from '@/components/snackbars/confirmDialog.vue'
import ErrorSnackbar from '@/components/snackbars/errors.vue'
import SuccessSnackbar from '@/components/snackbars/success.vue'
import { axiosIns } from '@/plugins/axios'

const props = defineProps<{
  patient: any
}>()

const emit = defineEmits(['updated'])

const medform = ref<VForm>()
const { isError, errorMessage, isSuccess, successMessage } = cStatus()

const isEditing = ref(false)
const isLoading = ref(false)
const isSaving = ref(false)

/**
 * The narrative and social sections — one record per patient, keyed on patient_id
 * with no meeting_id. Per-consultation findings live in tele_clinical_histories.
 *
 * Diagnoses are NOT here: they are rows in patient_problems, because a patient
 * routinely carries more than one condition. The icd10 / date_diagnosis /
 * time_diagnosis columns still exist on the table but are no longer written.
 *
 * The five lifestyle/medication flags are int columns, so they carry 1/0 rather than
 * booleans; see the false-value note on the checkboxes below.
 */
const history = ref({
  patient_id: props.patient?.id ?? null,
  history_present_illness: '',
  present_med_fam_soc: '',
  past_med_history: '',
  past_specify: '',
  past_surg_his_op: '',
  date_surgical: '',
  fam_history: '',
  fam_specify: '',
  smoking: null as number | null,
  alcohol: null as number | null,
  illicit_drug: null as number | null,
  oral_agents: null as number | null,
  hyper_med: null as number | null,
})

/** Snapshot taken on load, so Cancel genuinely reverts rather than just exiting. */
const original = ref<Record<string, any>>({})

// ---- ICD-10 lookup ----------------------------------------------------------
//
// The diagnosis table holds ~22,800 rows, so the list is fetched from the server as
// the user types rather than loaded up front. `icd10` stores the diagnosis row id —
// that is what MedicalHistory::icd relates on — not the code itself.

interface DiagnosisOption {
  id: number
  diagcode: string
  diagdesc: string
}

interface MainCategory { diagcat: string; catdesc: string }
interface SubCategory { diagsubcat: string; diagscatdesc: string }

const diagnosisOptions = ref<DiagnosisOption[]>([])
const diagnosisSearch = ref('')
const isSearchingDiagnosis = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | undefined

/**
 * Optional narrowing by the ICD-10 hierarchy: 26 chapters -> 266 blocks -> codes.
 * Neither is stored on the record; they only filter what the diagnosis field offers,
 * so someone who knows the code can ignore them and just type it.
 */
const mainCategories = ref<MainCategory[]>([])
const subCategories = ref<SubCategory[]>([])
const selectedMainCat = ref<string | null>(null)
const selectedSubCat = ref<string | null>(null)

const diagnosisLabel = (d: DiagnosisOption) => `${d.diagcode} — ${d.diagdesc}`
const mainCatLabel = (c: MainCategory) => `${c.diagcat} — ${c.catdesc}`
const subCatLabel = (c: SubCategory) => `${c.diagsubcat} — ${c.diagscatdesc}`

async function fetchDiagnoses(term: string) {
  isSearchingDiagnosis.value = true
  try {
    const response = await axiosIns.get('/api/diagnosis-search', {
      params: {
        q: term,
        maincat: selectedMainCat.value ?? undefined,
        category: selectedSubCat.value ?? undefined,
      },
    })

    diagnosisOptions.value = response.data.data ?? []
  }
  catch (error) {
    console.error('Error searching diagnoses:', error)
  }
  finally {
    isSearchingDiagnosis.value = false
  }
}

async function fetchMainCategories() {
  try {
    const response = await axiosIns.get('/api/diagnosis-main-categories')

    mainCategories.value = response.data.data ?? []
  }
  catch (error) {
    console.error('Error loading diagnosis categories:', error)
  }
}

async function fetchSubCategories(mainCat: string | null) {
  if (!mainCat) {
    subCategories.value = []

    return
  }

  try {
    const response = await axiosIns.get('/api/diagnosis-sub-categories-by-main', {
      params: { maincat: mainCat },
    })

    subCategories.value = response.data.data ?? []
  }
  catch (error) {
    console.error('Error loading diagnosis sub-categories:', error)
  }
}

function onMainCatChange(value: string | null) {
  selectedMainCat.value = value

  // The old block belongs to the previous chapter.
  selectedSubCat.value = null
  fetchSubCategories(value)
  fetchDiagnoses(diagnosisSearch.value ?? '')
}

function onSubCatChange(value: string | null) {
  selectedSubCat.value = value
  fetchDiagnoses(diagnosisSearch.value ?? '')
}

// Debounced: without it every keystroke fires a request, and each one scans a
// 22k-row table.
watch(diagnosisSearch, term => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchDiagnoses(term ?? ''), 300)
})

// ---- problem list -----------------------------------------------------------
//
// Saved immediately on confirm rather than batched with the rest of the form: each
// problem is its own row, and holding several unsaved additions in memory only to
// lose them if the page closes is worse than a request per change.

interface Problem {
  id?: number
  patient_id: number | null
  diagnosis_id: number | null
  problem: string
  onset_date: string | null
  status: string
  resolved_date: string | null
  notes: string
  diagnosis?: DiagnosisOption | null
}

const problems = ref<Problem[]>([])
const problemDialog = ref(false)
const isSavingProblem = ref(false)

const blankProblem = (): Problem => ({
  patient_id: props.patient?.id ?? null,
  diagnosis_id: null,
  problem: '',
  onset_date: null,
  status: 'active',
  resolved_date: null,
  notes: '',
})

const editingProblem = ref<Problem>(blankProblem())

async function fetchProblems() {
  if (!props.patient?.id)
    return

  try {
    const response = await axiosIns.get(`/api/patient-problems/${props.patient.id}`)

    problems.value = response.data.data ?? []
  }
  catch (error) {
    console.error('Error loading problem list:', error)
  }
}

function openProblemDialog(existing?: Problem) {
  editingProblem.value = existing
    ? { ...existing }
    : blankProblem()

  // Seed the picker so an existing problem shows its code rather than a bare id.
  if (existing?.diagnosis)
    diagnosisOptions.value = [existing.diagnosis]

  problemDialog.value = true
}

async function saveProblem() {
  // Mirrors the server rule: a problem needs either an ICD-10 entry or a description.
  if (!editingProblem.value.diagnosis_id && !editingProblem.value.problem.trim()) {
    errorMessage.value = 'Select a diagnosis or describe the problem.'
    isError.value = true

    return
  }

  isSavingProblem.value = true
  try {
    await axiosIns.post('/api/patient-problems', {
      ...editingProblem.value,
      patient_id: props.patient?.id,
    })

    problemDialog.value = false
    await fetchProblems()
    fetchSnapshots()
    successMessage.value = 'Problem saved.'
    isSuccess.value = true
  }
  catch (error: any) {
    errorMessage.value = error?.response?.data?.message ?? 'Failed to save problem.'
    isError.value = true
  }
  finally {
    isSavingProblem.value = false
  }
}

/**
 * Removal is a hard delete, so it confirms first.
 *
 * Resolving is the right action for a condition the patient no longer has — that
 * keeps it on the record. This is for correcting a mistaken entry, and the prompt
 * says so, because the two are easy to confuse.
 */
const confirmRemove = ref(false)
const problemToRemove = ref<Problem | null>(null)

const removeConfirmText = computed(() => {
  const label = problemToRemove.value?.diagnosis?.diagdesc ?? problemToRemove.value?.problem ?? ''

  return `Remove "${label}" from the problem list? If the patient no longer has this condition, mark it resolved instead — that keeps it on the record.`
})

function removeProblem(p: Problem) {
  problemToRemove.value = p
  confirmRemove.value = true
}

async function onRemoveConfirmed(confirmed: any) {
  const target = problemToRemove.value

  problemToRemove.value = null
  if (!confirmed || !target)
    return

  try {
    await axiosIns.delete(`/api/patient-problems/${target.id}`)
    await fetchProblems()
    fetchSnapshots()
    successMessage.value = 'Problem removed.'
    isSuccess.value = true
  }
  catch (error) {
    console.error('Error removing problem:', error)
    errorMessage.value = 'Failed to remove problem.'
    isError.value = true
  }
}

// ---- history timeline -------------------------------------------------------
//
// Every change writes a full snapshot server-side. This lists them and shows what a
// chosen one contained — the audits table records the same changes as JSON diffs,
// which nobody is going to reconstruct by hand.

interface Snapshot {
  id: number
  meeting_id: number | null
  reason: string | null
  taken_at: string
  user?: { id: number; fname?: string; lname?: string } | null
}

const snapshots = ref<Snapshot[]>([])
const showTimeline = ref(false)
const viewingSnapshot = ref<any>(null)
const isLoadingSnapshot = ref(false)

const snapshotWho = (s: Snapshot) => {
  const name = [s.user?.fname, s.user?.lname].filter(Boolean).join(' ').trim()

  return name || 'Unknown user'
}

const snapshotWhen = (s: Snapshot) =>
  s.taken_at ? new Date(s.taken_at.replace(' ', 'T')).toLocaleString() : ''

async function fetchSnapshots() {
  if (!props.patient?.id)
    return

  try {
    const response = await axiosIns.get(`/api/medical-history-snapshots/${props.patient.id}`)

    snapshots.value = response.data.data ?? []
  }
  catch (error) {
    console.error('Error loading history timeline:', error)
  }
}

/**
 * Which history fields a snapshot shows, and what to call them.
 *
 * An explicit map rather than iterating the payload: it fixes the order, keeps
 * bookkeeping columns (id, patient_id, timestamps) out of a clinical view, and means
 * a column added to the table later does not silently appear here unlabelled.
 */
const snapshotFieldLabels: Record<string, string> = {
  history_present_illness: 'History of Present Illness',
  present_med_fam_soc: 'Present Medical / Family / Social History',
  past_med_history: 'Past Medical History',
  past_specify: 'Specify',
  past_surg_his_op: 'Past Surgical History / Operation',
  date_surgical: 'Date of Surgery',
  fam_history: 'Family History',
  fam_specify: 'Specify',
  smoking: 'Smoking',
  alcohol: 'Alcohol',
  illicit_drug: 'Illicit Drug Use',
  oral_agents: 'Oral Agents',
  hyper_med: 'Hypertension Medication',
}

/** The five int flags are 1/0; everything else is text or a date. */
const flagFields = ['smoking', 'alcohol', 'illicit_drug', 'oral_agents', 'hyper_med']

function formatSnapshotValue(key: string, value: any) {
  if (flagFields.includes(key)) {
    // null means never answered, which is not the same as answered "no".
    if (value === null || value === undefined || value === '')
      return '—'

    return Number(value) ? 'Yes' : 'No'
  }

  return value === null || value === undefined || value === '' ? '—' : value
}

async function openSnapshot(s: Snapshot) {
  isLoadingSnapshot.value = true
  viewingSnapshot.value = null
  try {
    const response = await axiosIns.get(`/api/medical-history-snapshot/${s.id}`)

    viewingSnapshot.value = response.data.data
  }
  catch (error) {
    console.error('Error loading snapshot:', error)
    errorMessage.value = 'Failed to load that entry.'
    isError.value = true
  }
  finally {
    isLoadingSnapshot.value = false
  }
}

// ---- load / save ------------------------------------------------------------

async function fetchHistory() {
  if (!props.patient?.id)
    return

  isLoading.value = true
  try {
    const response = await axiosIns.get(`/api/medical-history/${props.patient.id}`)
    const record = response.data.data

    if (record) {
      for (const key of Object.keys(history.value)) {
        if (record[key] !== undefined && record[key] !== null)
          (history.value as any)[key] = record[key]
      }
    }

    history.value.patient_id = props.patient.id

    // Seed the autocomplete with the saved diagnosis, otherwise the field shows a
    // bare id until the user happens to search for it again.
    const saved = response.data.diagnosis
    if (saved)
      diagnosisOptions.value = [saved]

    original.value = { ...history.value }
  }
  catch (error) {
    console.error('Error loading medical history:', error)
    errorMessage.value = 'Failed to load medical history.'
    isError.value = true
  }
  finally {
    isLoading.value = false
  }
}

async function saveHistory() {
  try {
    isSaving.value = true

    const { valid } = await medform.value!.validate()
    if (!valid) {
      errorMessage.value = 'Please correct the errors before saving.'
      isError.value = true

      return
    }

    await axiosIns.post('/api/medical-history', history.value)

    original.value = { ...history.value }

    // the save wrote a snapshot server-side
    fetchSnapshots()
    successMessage.value = 'Medical history saved.'
    isSuccess.value = true
    isEditing.value = false
    emit('updated')
  }
  catch (error: any) {
    console.error('Error saving medical history:', error)
    errorMessage.value = error?.response?.data?.message ?? 'Failed to save medical history.'
    isError.value = true
  }
  finally {
    isSaving.value = false
  }
}

function cancelEdit() {
  history.value = { ...history.value, ...original.value } as typeof history.value
  isEditing.value = false
}

onMounted(() => {
  fetchHistory()
  fetchProblems()
  fetchSnapshots()
  fetchDiagnoses('')
  fetchMainCategories()
})

// The profile keeps one component instance while switching patients, so reload when
// the id changes rather than only on mount.
watch(() => props.patient?.id, id => {
  if (id) {
    history.value.patient_id = id
    fetchHistory()
    fetchProblems()
    fetchSnapshots()
  }
})
</script>

<template>
  <VForm
    ref="medform"
    style="align-self: stretch; width: 100%; padding-block-end: 9rem;"
  >
    <VTooltip
      v-if="isEditing"
      text="Save"
      location="top"
    >
      <template #activator="{ props: tip }">
        <VBtn
          v-bind="tip"
          variant="tonal"
          color="success"
          icon="tabler-device-floppy"
          size="48"
          class="fab-fixed-botr"
          :loading="isSaving"
          @click="saveHistory"
        />
      </template>
    </VTooltip>
    <VTooltip
      v-if="isEditing"
      text="Cancel"
      location="top"
    >
      <template #activator="{ props: tip }">
        <VBtn
          v-bind="tip"
          variant="tonal"
          color="error"
          icon="tabler-x"
          size="48"
          class="fab-fixed-botr me-15"
          @click="cancelEdit"
        />
      </template>
    </VTooltip>
    <VTooltip
      v-if="!isEditing"
      text="Edit"
      location="top"
    >
      <template #activator="{ props: tip }">
        <VBtn
          v-bind="tip"
          variant="tonal"
          color="success"
          icon="tabler-edit"
          size="48"
          rounded
          class="fab-fixed-botr"
          @click="isEditing = true"
        />
      </template>
    </VTooltip>

    <VProgressLinear
      v-if="isLoading"
      indeterminate
      color="primary"
      class="mb-4"
    />

    <!-- Present illness -->
    <div class="text-h6 mt-2 mb-2">
      Present Illness
    </div>
    <VRow>
      <VCol cols="12">
        <VTextarea
          v-model="history.history_present_illness"
          label="History of Present Illness"
          outlined
          dense
          auto-grow
          rows="2"
          counter
          maxlength="255"
          :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }"
        />
      </VCol>
    </VRow>
    <VRow>
      <VCol cols="12">
        <VTextarea
          v-model="history.present_med_fam_soc"
          label="Present Medical / Family / Social History"
          outlined
          dense
          auto-grow
          rows="2"
          counter
          maxlength="255"
          :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }"
        />
      </VCol>
    </VRow>

    <!--
      Problem list. Replaces the single icd10 / date_diagnosis pair that could only
      ever hold one condition — comorbidity is normal, so each gets its own row.
    -->
    <div class="d-flex align-center mt-4 mb-2">
      <div class="text-h6">
        Problem List
      </div>
      <VBtn
        v-if="isEditing"
        size="small"
        variant="tonal"
        color="primary"
        class="ms-4"
        prepend-icon="tabler-plus"
        @click="openProblemDialog"
      >
        Add Problem
      </VBtn>
    </div>

    <VAlert
      v-if="!problems.length"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      No conditions recorded.
    </VAlert>

    <VTable
      v-else
      density="compact"
      class="mb-2"
    >
      <thead>
        <tr>
          <th>Status</th>
          <th>ICD-10</th>
          <th>Condition</th>
          <th>Onset</th>
          <th>Resolved</th>
          <th v-if="isEditing" />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="p in problems"
          :key="p.id"
        >
          <td>
            <VChip
              size="x-small"
              :color="p.status === 'resolved' ? 'success' : 'primary'"
              variant="tonal"
            >
              {{ p.status === 'resolved' ? 'Resolved' : 'Active' }}
            </VChip>
          </td>
          <td>{{ p.diagnosis?.diagcode ?? '—' }}</td>
          <td>{{ p.diagnosis?.diagdesc ?? p.problem }}</td>
          <td>{{ p.onset_date ?? '—' }}</td>
          <td>{{ p.resolved_date ?? '—' }}</td>
          <td v-if="isEditing">
            <VBtn
              icon="tabler-edit"
              size="x-small"
              variant="text"
              @click="openProblemDialog(p)"
            />
            <VBtn
              icon="tabler-trash"
              size="x-small"
              variant="text"
              color="error"
              @click="removeProblem(p)"
            />
          </td>
        </tr>
      </tbody>
    </VTable>

    <!-- Past history -->
    <div class="text-h6 mt-4 mb-2">
      Past Medical &amp; Surgical History
    </div>
    <VRow>
      <VCol
        cols="12"
        md="4"
      >
        <VTextField
          v-model="history.past_med_history"
          label="Past Medical History"
          outlined
          dense
          counter
          maxlength="100"
          :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }"
        />
      </VCol>
      <VCol
        cols="12"
        md="8"
      >
        <VTextField
          v-model="history.past_specify"
          label="Specify"
          outlined
          dense
          counter
          maxlength="255"
          :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }"
        />
      </VCol>
    </VRow>
    <VRow>
      <VCol
        cols="12"
        md="8"
      >
        <VTextField
          v-model="history.past_surg_his_op"
          label="Past Surgical History / Operation"
          outlined
          dense
          counter
          maxlength="255"
          :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }"
        />
      </VCol>
      <VCol
        cols="12"
        md="4"
      >
        <VTextField
          v-model="history.date_surgical"
          type="date"
          label="Date of Surgery"
          outlined
          dense
          :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }"
        />
      </VCol>
    </VRow>

    <!-- Family history -->
    <div class="text-h6 mt-4 mb-2">
      Family History
    </div>
    <VRow>
      <VCol
        cols="12"
        md="4"
      >
        <VTextField
          v-model="history.fam_history"
          label="Family History"
          outlined
          dense
          counter
          maxlength="255"
          :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }"
        />
      </VCol>
      <VCol
        cols="12"
        md="8"
      >
        <VTextField
          v-model="history.fam_specify"
          label="Specify"
          outlined
          dense
          counter
          maxlength="255"
          :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }"
        />
      </VCol>
    </VRow>

    <!-- Social & maintenance -->
    <div class="text-h6 mt-4 mb-2">
      Social History &amp; Maintenance Medication
    </div>
    <VRow>
      <!--
        false-value is 0, not Vuetify's default boolean false: these are int columns
        and MySQL rejects 'false' the moment a box is unticked.
      -->
      <VCol
        cols="12"
        md="4"
      >
        <VCheckbox
          v-model="history.smoking"
          label="Smoking"
          :true-value="1"
          :false-value="0"
          density="compact"
          hide-details
          :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }"
        />
      </VCol>
      <VCol
        cols="12"
        md="4"
      >
        <VCheckbox
          v-model="history.alcohol"
          label="Alcohol"
          :true-value="1"
          :false-value="0"
          density="compact"
          hide-details
          :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }"
        />
      </VCol>
      <VCol
        cols="12"
        md="4"
      >
        <VCheckbox
          v-model="history.illicit_drug"
          label="Illicit Drug Use"
          :true-value="1"
          :false-value="0"
          density="compact"
          hide-details
          :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }"
        />
      </VCol>
    </VRow>
    <VRow>
      <VCol
        cols="12"
        md="4"
      >
        <VCheckbox
          v-model="history.oral_agents"
          label="Oral Agents"
          :true-value="1"
          :false-value="0"
          density="compact"
          hide-details
          :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }"
        />
      </VCol>
      <VCol
        cols="12"
        md="4"
      >
        <VCheckbox
          v-model="history.hyper_med"
          label="Hypertension Medication"
          :true-value="1"
          :false-value="0"
          density="compact"
          hide-details
          :readonly="!isEditing"
          :class="{ 'custom-disabled': !isEditing }"
        />
      </VCol>
    </VRow>
    <!--
      Change history. Every save writes a full snapshot server-side; this surfaces
      them so "what did we know at that visit" is answerable without replaying diffs
      out of the audits table.
    -->
    <div class="d-flex align-center mt-6 mb-2">
      <div class="text-h6">
        Change History
      </div>
      <VChip
        v-if="snapshots.length"
        size="x-small"
        class="ms-2"
        variant="tonal"
      >
        {{ snapshots.length }}
      </VChip>
      <VBtn
        size="small"
        variant="text"
        class="ms-2"
        :prepend-icon="showTimeline ? 'tabler-chevron-up' : 'tabler-chevron-down'"
        @click="showTimeline = !showTimeline"
      >
        {{ showTimeline ? 'Hide' : 'Show' }}
      </VBtn>
    </div>

    <VExpandTransition>
      <div v-show="showTimeline">
        <VAlert
          v-if="!snapshots.length"
          type="info"
          variant="tonal"
          density="compact"
        >
          No changes recorded yet.
        </VAlert>

        <VTable
          v-else
          density="compact"
        >
          <thead>
            <tr>
              <th>When</th>
              <th>Changed</th>
              <th>By</th>
              <th>Consultation</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in snapshots"
              :key="s.id"
            >
              <td>{{ snapshotWhen(s) }}</td>
              <td>
                <VChip
                  size="x-small"
                  variant="tonal"
                  :color="s.reason === 'problem' ? 'primary' : 'secondary'"
                >
                  {{ s.reason === 'problem' ? 'Problem list' : 'History' }}
                </VChip>
              </td>
              <td>{{ snapshotWho(s) }}</td>
              <td>
                <span v-if="s.meeting_id">#{{ s.meeting_id }}</span>
                <span
                  v-else
                  class="text-disabled"
                >Patient profile</span>
              </td>
              <td>
                <VBtn
                  size="x-small"
                  variant="text"
                  @click="openSnapshot(s)"
                >
                  View
                </VBtn>
              </td>
            </tr>
          </tbody>
        </VTable>
      </div>
    </VExpandTransition>
  </VForm>

  <!--
    Problems save on confirm rather than with the rest of the form: each is its own
    row, and batching them risks losing several at once.
  -->
  <VDialog
    v-model="problemDialog"
    max-width="700"
    persistent
  >
    <VCard>
      <VCardTitle>
        {{ editingProblem.id ? 'Edit Problem' : 'Add Problem' }}
      </VCardTitle>
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <VSelect
              :model-value="selectedMainCat"
              :items="mainCategories"
              :item-title="mainCatLabel"
              item-value="diagcat"
              label="ICD-10 Chapter (optional filter)"
              outlined
              dense
              clearable
              @update:model-value="onMainCatChange"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VSelect
              :model-value="selectedSubCat"
              :items="subCategories"
              :item-title="subCatLabel"
              item-value="diagsubcat"
              label="Block (optional filter)"
              outlined
              dense
              clearable
              :readonly="!selectedMainCat"
              no-data-text="Choose a chapter first"
              @update:model-value="onSubCatChange"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol cols="12">
            <VAutocomplete
              v-model="editingProblem.diagnosis_id"
              v-model:search="diagnosisSearch"
              :items="diagnosisOptions"
              :item-title="diagnosisLabel"
              item-value="id"
              label="Diagnosis (ICD-10)"
              outlined
              dense
              clearable
              no-filter
              :loading="isSearchingDiagnosis"
              no-data-text="Type to search ICD-10 codes"
              hint="Search by code (E11) or description (diabetes)"
              persistent-hint
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol cols="12">
            <VTextField
              v-model="editingProblem.problem"
              label="Or describe the condition"
              outlined
              dense
              counter
              maxlength="255"
              hint="Use this when no ICD-10 entry fits"
              persistent-hint
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="editingProblem.onset_date"
              type="date"
              label="Onset Date"
              outlined
              dense
            />
          </VCol>
          <VCol
            cols="12"
            md="4"
          >
            <VSelect
              v-model="editingProblem.status"
              :items="[
                { title: 'Active', value: 'active' },
                { title: 'Resolved', value: 'resolved' },
              ]"
              item-title="title"
              item-value="value"
              label="Status"
              outlined
              dense
            />
          </VCol>
          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="editingProblem.resolved_date"
              type="date"
              label="Resolved Date"
              outlined
              dense
              :readonly="editingProblem.status !== 'resolved'"
              hint="Defaults to today when resolved"
              persistent-hint
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol cols="12">
            <VTextField
              v-model="editingProblem.notes"
              label="Notes"
              outlined
              dense
              counter
              maxlength="255"
            />
          </VCol>
        </VRow>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          variant="tonal"
          color="secondary"
          @click="problemDialog = false"
        >
          Cancel
        </VBtn>
        <VBtn
          variant="tonal"
          color="success"
          :loading="isSavingProblem"
          @click="saveProblem"
        >
          Save
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Read-only view of one snapshot. Never editable: that is the point of them. -->
  <VDialog
    :model-value="!!viewingSnapshot || isLoadingSnapshot"
    max-width="800"
    scrollable
    @update:model-value="viewingSnapshot = null"
  >
    <VCard>
      <VCardTitle class="d-flex align-center">
        <span>History as recorded</span>
        <VSpacer />
        <VBtn
          icon="tabler-x"
          variant="text"
          size="small"
          @click="viewingSnapshot = null"
        />
      </VCardTitle>

      <VCardText v-if="isLoadingSnapshot">
        <VProgressLinear
          indeterminate
          color="primary"
        />
      </VCardText>

      <VCardText v-else-if="viewingSnapshot">
        <div class="text-caption text-medium-emphasis mb-4">
          {{ snapshotWhen(viewingSnapshot) }} · {{ snapshotWho(viewingSnapshot) }}
          <span v-if="viewingSnapshot.meeting_id"> · consultation #{{ viewingSnapshot.meeting_id }}</span>
          <span v-else> · edited from the patient profile</span>
        </div>

        <div class="text-subtitle-2 mb-1">
          Problem list
        </div>
        <div
          v-if="!viewingSnapshot.payload?.problems?.length"
          class="text-disabled mb-4"
        >
          None recorded at this point.
        </div>
        <VTable
          v-else
          density="compact"
          class="mb-4"
        >
          <tbody>
            <tr
              v-for="p in viewingSnapshot.payload.problems"
              :key="p.id"
            >
              <td style="width: 90px;">
                <VChip
                  size="x-small"
                  variant="tonal"
                  :color="p.status === 'resolved' ? 'success' : 'primary'"
                >
                  {{ p.status === 'resolved' ? 'Resolved' : 'Active' }}
                </VChip>
              </td>
              <td style="width: 90px;">
                {{ p.diagnosis?.diagcode ?? '—' }}
              </td>
              <td>{{ p.diagnosis?.diagdesc ?? p.problem }}</td>
              <td style="width: 110px;">
                {{ p.onset_date ?? '—' }}
              </td>
            </tr>
          </tbody>
        </VTable>

        <div class="text-subtitle-2 mb-1">
          Medical history
        </div>
        <div
          v-if="!viewingSnapshot.payload?.history"
          class="text-disabled"
        >
          No history recorded at this point.
        </div>
        <VTable
          v-else
          density="compact"
        >
          <tbody>
            <tr
              v-for="(label, key) in snapshotFieldLabels"
              :key="key"
            >
              <td
                style="width: 320px;"
                class="text-medium-emphasis"
              >
                {{ label }}
              </td>
              <td>{{ formatSnapshotValue(key, viewingSnapshot.payload.history[key]) }}</td>
            </tr>
          </tbody>
        </VTable>
      </VCardText>
    </VCard>
  </VDialog>

  <ConfirmDialog
    v-model="confirmRemove"
    title="Remove problem"
    :text="removeConfirmText"
    @close="onRemoveConfirmed"
  />

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

<style scoped>
.custom-disabled {
  opacity: 0.6;
  pointer-events: none;
}
</style>
