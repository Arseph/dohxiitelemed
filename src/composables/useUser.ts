import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';

export function useUser() {
  const store = useStore();

  onMounted(() => {
    store.dispatch('auth/user');
  });

  const user = computed(() => store.getters['auth/user']);

  return { user };
}
