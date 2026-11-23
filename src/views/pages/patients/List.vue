<script setup lang="ts">
import { useDisplay } from 'vuetify'
import AddPatient from '../../components/AddPatient.vue'
import PatientProfile from '../../components/PatientProfile.vue'
import { cStatus } from '@/components/snackbars/cStatus'
import ErrorSnackbar from '@/components/snackbars/errors.vue'
import SuccessSnackbar from '@/components/snackbars/success.vue'
import { axiosIns } from '@/plugins/axios'

interface PatientRow {
  id: number
  pat_fname?: string
  pat_mname?: string
  pat_lname?: string
  pat_birthDate?: string
  sex_code?: string
  brg_name?: string | null
  pat_mobile?: string | null
  name: string
  initials: string
  hasDob: boolean
  age: string
  dob_formatted: string
  [key: string]: any
}

const { isError, errorMessage, isSuccess, successMessage } = cStatus()
const { xs, smAndDown } = useDisplay()

const patients = ref<PatientRow[]>([])
const isLoading = ref(false)
const hasLoaded = ref(false)
const loadError = ref(false)
const search = ref('')
const showAddDialog = ref(false)
const selectedPatient = ref<PatientRow | null>(null)
const showProfileDialog = ref(false)

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Sex', key: 'sex_code' },
  { title: 'Age / Birth date', key: 'age', sortable: false },
  { title: 'Barangay', key: 'brg_name' },
  { title: 'Contact', key: 'pat_mobile', sortable: false },
]

const dobFormat = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

// Whole years and months, counting a month only once its day has passed
const ageFrom = (dob: Date) => {
  const today = new Date()
  let months = (today.getFullYear() - dob.getFullYear()) * 12 + today.getMonth() - dob.getMonth()
  if (today.getDate() < dob.getDate())
    months--

  const years = Math.floor(months / 12)
  const rest = months % 12
  if (years === 0)
    return `${rest} month${rest === 1 ? '' : 's'}`

  return `${years} yr${years === 1 ? '' : 's'}${rest ? ` ${rest} mo` : ''}`
}

const toRow = (p: any): PatientRow => {
  const dob = p.pat_birthDate ? new Date(p.pat_birthDate) : null
  const validDob = dob && !Number.isNaN(dob.getTime()) ? dob : null
  const first = [p.pat_fname, p.pat_mname ? `${p.pat_mname.charAt(0)}.` : ''].filter(Boolean).join(' ')

  return {
    ...p,
    name: [p.pat_lname, first].filter(Boolean).join(', ') || 'Unnamed patient',
    initials: `${p.pat_fname?.charAt(0) ?? ''}${p.pat_lname?.charAt(0) ?? ''}`.toUpperCase() || '?',

    // PatientProfile and AddPatient read age and dob_formatted directly and append
    // " old" themselves, so keep "N/A" as the no-birth-date value they expect.
    hasDob: Boolean(validDob),
    age: validDob ? ageFrom(validDob) : 'N/A',
    dob_formatted: validDob ? dobFormat.format(validDob) : 'N/A',
  }
}

async function fetchPatients() {
  isLoading.value = true
  try {
    const { data } = await axiosIns.get('/api/patients')
    const list = Array.isArray(data) ? data : (data.data || [])

    patients.value = list.map(toRow)
    loadError.value = false
  }
  catch (error) {
    console.error('Error fetching patients:', error)
    loadError.value = true
  }
  finally {
    isLoading.value = false
    hasLoaded.value = true
  }
}

// Search the fields people actually type: name, barangay or phone number
const filteredPatients = computed(() => {
  const q = search.value?.trim().toLowerCase()
  if (!q)
    return patients.value

  return patients.value.filter(p =>
    [p.name, p.brg_name, p.pat_mobile].some(v => v?.toLowerCase().includes(q)),
  )
})

// Phones get cards instead of a five-column table, revealed a page at a time
const PAGE = 20
const shown = ref(PAGE)

watch(search, () => {
  shown.value = PAGE
})

const visibleCards = computed(() => filteredPatients.value.slice(0, shown.value))

function openProfileDialog(patient: PatientRow) {
  selectedPatient.value = patient
  showProfileDialog.value = true
}

async function savePatient(patientData: any, isExisting: boolean) {
  try {
    const payload = isExisting ? { id: patientData.id } : patientData

    await axiosIns.post('/api/patients/store-or-update', payload)

    successMessage.value = isExisting ? 'Patient selected successfully.' : 'Patient added successfully.'
    isSuccess.value = true

    fetchPatients()
    showAddDialog.value = false
  }
  catch (error) {
    console.error('Error saving patient:', error)
    errorMessage.value = 'Failed to save patient.'
    isError.value = true
  }
}

function handleAddPatientExisting(patient: any) {
  savePatient(patient, true)
}

function handleAddPatientNew(patient: any) {
  const norm = (v?: string) => (v || '').trim().toLowerCase()

  const duplicate = patients.value.find(p =>
    norm(p.pat_fname) === norm(patient.pat_fname)
    && norm(p.pat_mname) === norm(patient.pat_mname)
    && norm(p.pat_lname) === norm(patient.pat_lname),
  )

  if (duplicate) {
    errorMessage.value = 'Patient already exists in list'
    isError.value = true

    return
  }

  savePatient(patient, false)
}

onMounted(fetchPatients)
</script>

<template>
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

  <div class="patients">
    <!-- Header: title + add on one row, search full width below on phones -->
    <div class="patients__header">
      <div class="patients__heading">
        <h2 class="text-h4">
          Patient List
        </h2>
        <p
          v-if="hasLoaded && !loadError"
          class="text-body-2 text-medium-emphasis mb-0"
        >
          {{ search ? `${filteredPatients.length} of ${patients.length}` : patients.length }}
          patient{{ patients.length === 1 ? '' : 's' }}
        </p>
      </div>

      <VTextField
        v-model="search"
        class="patients__search"
        prepend-inner-icon="tabler-search"
        placeholder="Search name, barangay or contact"
        aria-label="Search patients"
        clearable
        hide-details
      />

      <VBtn
        class="patients__add"
        color="primary"
        prepend-icon="tabler-user-plus"
        @click="showAddDialog = true"
      >
        Add Patient
      </VBtn>
    </div>

    <VAlert
      v-if="loadError"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      Couldn't load the patient list.
      <template #append>
        <VBtn
          size="small"
          variant="text"
          :loading="isLoading"
          @click="fetchPatients"
        >
          Retry
        </VBtn>
      </template>
    </VAlert>

    <!-- Phones: one card per patient -->
    <template v-if="smAndDown">
      <VSkeletonLoader
        v-if="!hasLoaded"
        type="list-item-avatar-two-line@6"
      />

      <VCard
        v-else-if="!filteredPatients.length && !loadError"
        variant="flat"
        class="patients__empty"
      >
        <VIcon
          icon="tabler-users"
          size="40"
          class="mb-2 text-disabled"
        />
        <p class="mb-0">
          {{ search ? `No patients match "${search}"` : 'No patients yet' }}
        </p>
      </VCard>

      <div
        v-else
        class="patients__cards"
      >
        <VCard
          v-for="p in visibleCards"
          :key="p.id"
          class="patients__card"
          @click="openProfileDialog(p)"
        >
          <div class="patients__card-main">
            <VAvatar
              color="primary"
              variant="tonal"
              size="42"
            >
              {{ p.initials }}
            </VAvatar>

            <div class="patients__card-body">
              <div class="patients__card-name">
                {{ p.name }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{ [p.sex_code, p.hasDob ? `${p.age} old` : 'No birth date'].filter(Boolean).join(' · ') }}
              </div>
              <div
                v-if="p.brg_name"
                class="patients__meta"
              >
                <VIcon
                  icon="tabler-map-pin"
                  size="16"
                />
                <span>{{ p.brg_name }}</span>
              </div>
            </div>

            <VIcon
              icon="tabler-chevron-right"
              class="text-disabled"
            />
          </div>

          <!-- Tapping the number dials it instead of opening the profile -->
          <a
            v-if="p.pat_mobile"
            class="patients__phone"
            :href="`tel:${p.pat_mobile}`"
            @click.stop
          >
            <VIcon
              icon="tabler-phone"
              size="16"
            />
            {{ p.pat_mobile }}
          </a>
        </VCard>

        <VBtn
          v-if="shown < filteredPatients.length"
          variant="tonal"
          color="primary"
          block
          @click="shown += PAGE"
        >
          Show more ({{ filteredPatients.length - shown }} left)
        </VBtn>
      </div>
    </template>

    <!-- Tablets and desktop: table -->
    <VCard v-else>
      <VDataTable
        :headers="headers"
        :items="filteredPatients"
        :loading="isLoading"
        class="green-table"
        item-value="id"
        hover
        :no-data-text="search ? `No patients match “${search}”` : 'No patients yet'"
      >
        <template #item.name="{ item }">
          <button
            type="button"
            class="patients__name-link"
            @click="openProfileDialog(item)"
          >
            <VAvatar
              color="primary"
              variant="tonal"
              size="34"
            >
              {{ item.initials }}
            </VAvatar>
            <span>{{ item.name }}</span>
          </button>
        </template>

        <template #item.age="{ item }">
          <template v-if="item.hasDob">
            <div>{{ item.age }} old</div>
            <div class="text-body-2 text-medium-emphasis">
              {{ item.dob_formatted }}
            </div>
          </template>
          <span
            v-else
            class="text-disabled"
          >N/A</span>
        </template>

        <template #item.brg_name="{ item }">
          {{ item.brg_name || '—' }}
        </template>

        <template #item.pat_mobile="{ item }">
          {{ item.pat_mobile || '—' }}
        </template>
      </VDataTable>
    </VCard>

    <!-- Add Patient Dialog -->
    <VDialog
      v-model="showAddDialog"
      max-width="900px"
      :fullscreen="xs"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center dialog-title-green">
          <VIcon icon="tabler-user-plus" />
          <span class="text-h5">Select/Add Patient</span>
          <VBtn
            icon="tabler-x"
            variant="text"
            aria-label="Close"
            @click="showAddDialog = false"
          />
        </VCardTitle>

        <VCardText>
          <AddPatient
            @close="showAddDialog = false"
            @selected-existing="handleAddPatientExisting"
            @added-new="handleAddPatientNew"
            @open-profile="openProfileDialog"
          />
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Profile Dialog -->
    <VDialog
      v-model="showProfileDialog"
      :fullscreen="xs"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between profile-top-bar-royalblue">
          <span class="text-h4 text-truncate">Patient Information</span>
          <VBtn
            icon="tabler-x"
            variant="text"
            color="default"
            aria-label="Close"
            @click="showProfileDialog = false"
          />
        </VCardTitle>

        <VCardText :class="{ 'px-2': xs }">
          <PatientProfile
            v-if="selectedPatient"
            :patient="selectedPatient"
            @close="showProfileDialog = false"
            @saved="fetchPatients"
          />
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<style lang="scss" scoped>
.patients {
  padding: 1rem;

  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
    margin-block-end: 1.25rem;
  }

  &__heading {
    flex: 1 1 auto;
  }

  &__search {
    flex: 0 1 340px;
  }

  &__name-link {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0;
    border: 0;
    background: none;
    color: rgb(var(--v-theme-primary));
    cursor: pointer;
    font: inherit;
    font-weight: 500;
    text-align: start;

    &:hover span,
    &:focus-visible span {
      text-decoration: underline;
    }
  }

  &__cards {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__card-main {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 0.875rem 0.75rem 0.875rem 1rem;
  }

  &__card-body {
    flex: 1 1 auto;
    min-inline-size: 0;
  }

  &__card-name {
    font-weight: 600;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-block-start: 0.125rem;
    color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
    font-size: 0.875rem;
  }

  &__phone {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.625rem 1rem;
    border-block-start: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    color: rgb(var(--v-theme-primary));
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;
  }

  // The brand green is the same dark shade in both themes and nearly disappears on
  // a dark surface. Use the lighter green from the login page for names, avatars
  // and phone links (not the Add button, whose white label needs the dark green).
  // VAvatar carries its own .v-theme--dark class, which redefines the variable, so
  // it needs its own selector.
  .v-theme--dark &__name-link,
  .v-theme--dark &__card,
  .v-theme--dark &__name-link :deep(.v-avatar),
  .v-theme--dark &__card :deep(.v-avatar) {
    --v-theme-primary: 138, 216, 182;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2.5rem 1rem;
    color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
    text-align: center;
  }

  // Phones and tablets in portrait: title + Add on top, search spans the next row
  @media (max-width: 959.98px) {
    padding: 0.75rem;

    &__header {
      gap: 0.75rem;
    }

    &__search {
      flex: 1 1 100%;
      order: 3;
    }
  }
}
</style>
