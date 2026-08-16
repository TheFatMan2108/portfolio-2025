import { ref } from "vue";

export const locale = ref<string | null>(null);
export const translations = ref<Record<string, string>>({});
