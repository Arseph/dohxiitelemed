<script lang="ts" setup>
import { defineProps } from 'vue'
import { format } from 'date-fns'
const user = defineProps<{
  data: any
}>()
const date = new Date(user.data?.info?.hrinfo?.date_hired)
const hired = isNaN(date.getTime())
  ? 'Invalid date'
  : format(date, 'MMMM d, yyyy')
</script>

<template>
  <VCard class="mb-6">
    <VCardText>
      <p class="text-sm text-disabled">
        ABOUT
      </p>
      <VList class="card-list text-medium-emphasis">
        <VListItem>
          <VListItemTitle class="mb-3">
            <span class="d-flex align-center">
              <VIcon
                icon="tabler-user"
                size="24"
                class="me-2"
              />
              <div class="text-body-1 font-weight-medium me-2">
                Full Name:
              </div>
              <div>{{ data?.info?.first_name }} {{ data?.info?.middle_name }} {{ data?.info?.sur_name }}</div>
            </span>
          </VListItemTitle>
          <VListItemTitle class="mb-3">
            <span class="d-flex align-center">
              <VIcon
                icon="tabler-check"
                size="24"
                class="me-2"
              />
              <div class="text-body-1 font-weight-medium me-2">
                Status:
              </div>
              <div>{{data?.status}}</div>
            </span>
          </VListItemTitle>
          <VListItemTitle class="mb-3">
            <span class="d-flex align-center">
              <VIcon
                icon="tabler-calendar"
                size="24"
                class="me-2"
              />
              <div class="text-body-1 font-weight-medium me-2">
                Date Hired:
              </div>
              <div>{{hired}}</div>
            </span>
          </VListItemTitle>
        </VListItem>
      </VList>

      <p class="text-sm text-disabled mt-6">
        CONTACTS
      </p>

      <VList class="card-list text-medium-emphasis">
        <VListItem>
          <VListItemTitle class="mb-3">
            <span class="d-flex align-center">
              <VIcon
                icon="tabler-phone-call"
                size="24"
                class="me-2"
              />
              <div class="text-body-1 font-weight-medium me-2">
                Contact:
              </div>
              <div>{{ data?.info?.cell_no }}</div>
            </span>
          </VListItemTitle>
          <VListItemTitle class="mb-3">
            <span class="d-flex align-center">
              <VIcon
                icon="tabler-mail"
                size="24"
                class="me-2"
              />
              <div class="text-body-1 font-weight-medium me-2">
                Email:
              </div>
              <div>{{data?.email}}</div>
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
</style>
