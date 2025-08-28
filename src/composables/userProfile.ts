import { computed, onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';

export function useUserProfile() {
  const store = useStore();
  const profile = ref(null);

  onMounted(async () => {
    if (!store.getters['auth/profile']) {
      await store.dispatch('auth/profile');
    }
    profile.value = store.getters['auth/profile'];
  });

  watch(
    () => store.getters['auth/profile'],
    (newProfile) => {
      profile.value = newProfile;
      console.log(newProfile)
    },
    { immediate: true }
  );

  return { profile: computed(() => profile.value) };
}
