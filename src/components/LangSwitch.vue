<script setup lang="ts">
import Button from "./Button.vue";
import { locale } from "../i18n/store";
import { changeLocale } from "../i18n/utils/locale";
import { enabledLanguages } from "../content/portfolio";
</script>

<template>
  <div v-if="enabledLanguages.length > 1" class="lang-switch" aria-label="Language selector">
    <Button
      v-for="language in enabledLanguages"
      :key="language.code"
      :variant="locale === language.code ? 'accent' : 'border'"
      size="sm"
      :aria-pressed="locale === language.code"
      :title="language.name"
      @click="changeLocale(language.code)"
      data-cursor="circle-white"
      data-sound="click"
      data-hoversound="hover"
    >
      {{ language.label }}
    </Button>
  </div>
</template>

<style scoped lang="scss">
.lang-switch {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-xs);
}
</style>
