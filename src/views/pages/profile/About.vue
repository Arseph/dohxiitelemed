<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
  data: any
}>()

const about = computed(() => [
  { icon: 'tabler-user', label: 'Full Name', value: [props.data?.fname, props.data?.mname, props.data?.lname].filter(Boolean).join(' ') },
  { icon: 'tabler-crown', label: 'Role', value: props.data?.level },
  { icon: 'tabler-check', label: 'Status', value: props.data?.status },
  { icon: 'tabler-briefcase', label: 'Designation', value: props.data?.designation },
  { icon: 'tabler-building-hospital', label: 'Facility', value: props.data?.facility?.facilityname },
  { icon: 'tabler-id', label: 'License No.', value: props.data?.license_no },
])

const contacts = computed(() => [
  { icon: 'tabler-phone-call', label: 'Contact', value: props.data?.contact },
  { icon: 'tabler-mail', label: 'Email', value: props.data?.email },
])
</script>

<template>
  <VCard class="mb-6">
    <VCardText>
      <p class="text-sm text-disabled">
        ABOUT
      </p>
      <VList class="card-list text-medium-emphasis">
        <VListItem>
          <VListItemTitle
            v-for="item in about"
            :key="item.label"
            class="mb-3"
          >
            <span class="d-flex align-center">
              <VIcon
                :icon="item.icon"
                size="24"
                class="me-2"
              />
              <div class="text-body-1 font-weight-medium me-2">
                {{ item.label }}:
              </div>
              <div class="text-capitalize-first">{{ item.value || '—' }}</div>
            </span>
          </VListItemTitle>
        </VListItem>
      </VList>

      <p class="text-sm text-disabled mt-6">
        CONTACTS
      </p>

      <VList class="card-list text-medium-emphasis">
        <VListItem>
          <VListItemTitle
            v-for="item in contacts"
            :key="item.label"
            class="mb-3"
          >
            <span class="d-flex align-center">
              <VIcon
                :icon="item.icon"
                size="24"
                class="me-2"
              />
              <div class="text-body-1 font-weight-medium me-2">
                {{ item.label }}:
              </div>
              <div>{{ item.value || '—' }}</div>
            </span>
          </VListItemTitle>
        </VListItem>
      </VList>
    </VCardText>
  </VCard>
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 16px;
}

.text-capitalize-first::first-letter {
  text-transform: uppercase;
}
</style>
