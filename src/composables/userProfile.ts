import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';

export function useUserProfile() {
const store = useStore();
const profile = ref<Blob | null>(null);

onMounted(async () => {
try {
const response = await store.dispatch('auth/userProfile');
if (response instanceof Blob) {
profile.value = response;
}
} catch (e) {
profile.value = null;
}
});

return { profile };
}
