<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import gsap from "gsap";
import Notch from "../../../components/Notch.vue";
import { getYouTubeEmbedUrl, resolveProjectMediaType } from "../utils/mediaSource";

import type { ProjectMediaType } from "../../../content/portfolio.types";

const wrapperRef = ref<HTMLDivElement | null>(null);
const mediaRef = ref<HTMLVideoElement | HTMLImageElement | HTMLIFrameElement | null>(null);
const mediaContentRef = ref<HTMLDivElement | null>(null);

export interface Props {
  type: ProjectMediaType;
  src: string;
  alt?: string;
  caption?: string;
  index: number;
}

const props = defineProps<Props>();
const resolvedType = computed(() => resolveProjectMediaType(props.type, props.src));
const youtubeEmbedUrl = computed(() => getYouTubeEmbedUrl(props.src));
const videoMimeType = computed(() => {
  const path = props.src.toLowerCase().split(/[?#]/, 1)[0] ?? "";
  if (path.endsWith(".webm")) return "video/webm";
  if (path.endsWith(".ogv") || path.endsWith(".ogg")) return "video/ogg";
  return "video/mp4";
});

const wrapperClasses = computed(() => {
  return {
    "project-media": true,
  };
});

watchEffect((onInvalidate) => {
  const wrapper = wrapperRef.value;
  const mediaContent = mediaContentRef.value;
  const media = mediaRef.value;
  if (!wrapper || !mediaContent || !media) return;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: wrapper,
      start: "top bottom",
      end: "bottom bottom",
      toggleActions: "play none none reset",
    },
  });
  tl.fromTo(mediaContent, { scale: 0.8 }, { scale: 1, duration: 0.4, ease: "power1.out" }, 0);
  tl.fromTo(media, { scale: 1.2 }, { scale: 1, duration: 0.4, ease: "power1.out" }, 0);

  onInvalidate(() => {
    tl.kill();
    gsap.set(mediaContent, { scale: 1 });
    gsap.set(media, { scale: 1 });
  });
});
</script>

<template>
  <div :class="wrapperClasses" ref="wrapperRef">
    <div class="project-media-content" ref="mediaContentRef">
      <img
        v-if="resolvedType === 'image'"
        :src="props.src"
        :alt="props.alt"
        loading="lazy"
        fetchpriority="high"
        class="project-media-image"
        ref="mediaRef"
      />
      <iframe
        v-else-if="resolvedType === 'youtube' && youtubeEmbedUrl"
        :src="youtubeEmbedUrl"
        :title="props.alt || props.caption || 'YouTube video'"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        referrerpolicy="strict-origin-when-cross-origin"
        class="project-media-youtube"
        ref="mediaRef"
      />
      <div v-else-if="resolvedType === 'youtube'" class="project-media-error" role="status">
        Link YouTube không hợp lệ
      </div>
      <video v-else autoplay muted loop playsinline preload="metadata" class="project-media-video" ref="mediaRef">
        <source :src="props.src" :type="videoMimeType" />
        Trình duyệt không hỗ trợ video này.
      </video>
    </div>
    <div class="project-media-caption" v-if="props.caption">
      <Notch class="project-media-caption-notch project-media-caption-notch-left" />
      <Notch class="project-media-caption-notch project-media-caption-notch-top" />
      <p class="project-media-caption-copy">{{ props.caption }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.project-media {
  width: 100%;
  height: 100%;
  grid-column: 1 / 13;
  max-width: 900px;
  justify-self: center;
  position: relative;
  aspect-ratio: 16 / 9;

  @include mixins.mq("md") {
    grid-column: 2 / 12;
  }

  @include mixins.mq("lg") {
    grid-column: 3 / 11;
  }

  &-caption {
    position: absolute;
    bottom: -1px;
    right: -1px;
    background-color: var(--color-background-400);
    padding: var(--space-xxs) var(--space-sm);
    border-radius: var(--radius-md) 0 0 0;

    @include mixins.mq("md") {
      padding: var(--space-xxs) var(--space-sm);
    }

    @include mixins.mq("lg") {
      padding: var(--space-xs) var(--space-md);
      border-radius: var(--radius-lg) 0 0 0;
    }

    &-notch {
      position: absolute;
      color: var(--color-background-400);
      --icon-color: var(--color-background-400);
      width: var(--radius-md);

      @include mixins.mq("md") {
        width: var(--radius-lg);
      }

      &-left {
        left: 0;
        bottom: 0;
        transform: translate(-100%, 0) scale(-1) rotate(90deg);
      }

      &-top {
        top: 0;
        right: 0;
        transform: translate(0, -100%) scale(-1) rotate(90deg);
      }
    }

    &-copy {
      font-size: var(--font-size-sm);
      font-weight: 700;

      @include mixins.mq("md") {
        font-size: var(--font-size-md);
      }
    }
  }

  &-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &-youtube {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
  }

  &-error {
    display: grid;
    width: 100%;
    height: 100%;
    padding: var(--space-md);
    color: var(--color-text-200);
    place-items: center;
    text-align: center;
  }

  &-content {
    overflow: hidden;
    border-radius: var(--radius-lg);
    background-color: var(--color-background-300);
    width: 100%;
    height: 100%;
  }
}
</style>
