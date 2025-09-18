<template>
  <!-- Show message if no data -->
  <div v-if="props.data.length === 0" class="text-center py-4 text-medium-emphasis">
    No Pending Teleconsultation Found
  </div>

  <!-- Data Table -->
  <div v-else class="mt-3">
    <!-- Search Box -->
    <VTextField
      v-model="search"
      label="Search Teleconsultation"
      prepend-inner-icon="tabler-search"
      variant="outlined"
      density="compact"
      class="mb-4"
    />

    <VDataTable
      :headers="headers"
      :items="filteredData"
      :items-per-page="5"
      class="elevation-1"
    >
      <template #item.facility="{ item }">
        <VBadge
          dot
          location="start center"
          offset-x="2"
          color="primary"
          class="me-3"
        >
          <span class="ms-4">{{ item.facility.facilityname }}</span>
        </VBadge>
      </template>

      <template #item.status="{ item }">
        <VChip
            :color="resolveStatusVariant(item.status).color"
            class="font-weight-medium"
            size="small"
        >
            {{ resolveStatusVariant(item.status).text }}
        </VChip>
      </template>
    </VDataTable>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{
  data: any[]
}>()

const search = ref("")
const setModal = ref(false)
const selectedItem = ref([])
const headers = [
  { title: "Chief Complaint", key: "title" },
  { title: "Facility", key: "facility" },
  { title: "Status", key: "status", sortable: false },
]

const filteredData = computed(() => {
  if (!search.value) return props.data
  return props.data.filter(item =>
    item.title.toLowerCase().includes(search.value.toLowerCase()) ||
    item.facility.facilityname.toLowerCase().includes(search.value.toLowerCase())
  )
})
const resolveStatusVariant = (status: string) => {
  if (status === 'Accept')
    return { color: 'success', text: 'Accepted' }
  else if (status === 'Pending')
    return { color: 'warning', text: 'Pending' }
  else
    return { color: 'info', text: 'N/A' }
}
</script>
