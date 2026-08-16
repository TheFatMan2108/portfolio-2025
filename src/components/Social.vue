<script setup lang="ts">
import Github from "./icons/Github.vue";
import Linkedin from "./icons/Linkedin.vue";
import Instagram from "./icons/Instagram.vue";
import Mail from "./icons/Mail.vue";
import X from "./icons/X.vue";
import Link from "./Link.vue";
import { t } from "../i18n/utils/translate";
import ButtonRound from "./ButtonRound.vue";

import { enabledSocialLinks } from "../content/portfolio";

const props = defineProps<{
  variant?: "theme" | "background";
}>();

// map icon names to components
const icons = {
  mail: Mail,
  github: Github,
  linkedin: Linkedin,
  x: X,
  instagram: Instagram,
} as const;

const getAriaLabel = (label: string) => `${t("go-to")} ${label}`;
</script>

<template>
  <div class="social">
    <Link
      v-for="item in enabledSocialLinks"
      :key="item.id"
      external
      :href="item.url"
      :aria-label="getAriaLabel(item.label)"
      class="social-link"
      data-cursor="circle-white"
    >
      <ButtonRound
        renderAs="div"
        :variant="props.variant ?? 'theme'"
        class="children-unclickable"
        data-hoversound="hover"
      >
        <img
          v-if="item.customIcon"
          :src="item.customIcon"
          alt=""
          class="social-custom-icon"
        />
        <component v-else :is="icons[item.icon]" :aria-label="getAriaLabel(item.label)" external />
      </ButtonRound>
    </Link>
  </div>
</template>

<style scoped lang="scss">
.social {
  display: flex;
  gap: var(--space-md);
}

.social-custom-icon {
  width: 54%;
  height: 54%;
  object-fit: contain;
}
</style>
