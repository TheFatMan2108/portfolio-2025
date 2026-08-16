<script setup lang="ts">
import { computed } from "vue";
import { getTechnologyTag } from "../content/portfolio";

const props = defineProps<{
  variant: string;
}>();

const tag = computed(() => getTechnologyTag(props.variant));
const tagStyle = computed(() => ({
  backgroundColor: tag.value?.backgroundColor ?? "transparent",
  color: tag.value?.textColor ?? "var(--color-text-400)",
  borderColor: tag.value?.borderColor ?? "var(--color-grayscale-400)",
}));
</script>

<template>
  <div class="tag" :style="tagStyle">
    <p class="tag-copy">{{ tag?.label ?? variant }}</p>
  </div>
</template>

<style scoped lang="scss">
.tag {
  border-radius: var(--radius-md);
  padding: calc(var(--space-xxs) - var(--stroke-md)) calc(var(--space-sm  ) - var(--stroke-md));
  border: var(--stroke-md) solid transparent;

  &-copy {
    font-size: var(--font-size-xs);
    font-weight: 700;
  }
}
</style>
