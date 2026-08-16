<script setup lang="ts">
import { computed, useId } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    defaultColor?: string;
    allowTransparent?: boolean;
  }>(),
  {
    defaultColor: "#000000",
    allowTransparent: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const inputId = useId();
const isHexColor = (value: string): boolean => /^#[0-9a-f]{6}$/i.test(value);
const pickerValue = computed(() => (isHexColor(props.modelValue) ? props.modelValue : props.defaultColor));

const updateFromInput = (event: Event): void => {
  emit("update:modelValue", (event.target as HTMLInputElement).value);
};
</script>

<template>
  <div class="field color-field">
    <label class="color-field-label" :for="inputId">{{ label }}</label>
    <div class="color-field-controls">
      <input
        :id="inputId"
        class="color-picker"
        type="color"
        :value="pickerValue"
        :aria-label="`Mở bảng màu ${label}`"
        @input="updateFromInput"
      />
      <input
        class="color-value"
        type="text"
        :value="modelValue"
        :placeholder="defaultColor"
        :aria-label="`Mã màu ${label}`"
        required
        @input="updateFromInput"
      />
      <button
        v-if="allowTransparent"
        class="transparent-button"
        type="button"
        :class="{ active: modelValue === 'transparent' }"
        @click="emit('update:modelValue', 'transparent')"
      >
        Trong suốt
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.color-field {
  display: grid;
  gap: 8px;
  margin-bottom: 18px;
}

.color-field-label {
  color: #b7c0ce;
  font-size: 14px;
  font-weight: 700;
}

.color-field-controls {
  display: grid;
  grid-template-columns: 54px minmax(100px, 1fr) auto;
  gap: 8px;
}

.color-picker,
.color-value,
.transparent-button {
  min-height: 45px;
  border: 1px solid #303949;
  border-radius: 11px;
  outline: none;
}

.color-picker {
  width: 54px;
  padding: 4px;
  background: #0c1118;
  cursor: pointer;

  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  &::-webkit-color-swatch {
    border: 0;
    border-radius: 7px;
  }
}

.color-value {
  width: 100%;
  padding: 12px 14px;
  color: #eff4ff;
  background: #0c1118;

  &:focus {
    border-color: var(--admin-accent);
    box-shadow: 0 0 0 3px rgb(121 242 192 / 12%);
  }
}

.transparent-button {
  padding: 8px 12px;
  color: #aab5c4;
  background:
    linear-gradient(45deg, #161d27 25%, transparent 25%),
    linear-gradient(-45deg, #161d27 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #161d27 75%),
    linear-gradient(-45deg, transparent 75%, #161d27 75%),
    #273142;
  background-position: 0 0, 0 6px, 6px -6px, -6px 0;
  background-size: 12px 12px;
  cursor: pointer;
  font-weight: 800;

  &.active {
    color: #07110d;
    background: var(--admin-accent);
    border-color: var(--admin-accent);
  }
}

@media (max-width: 520px) {
  .color-field-controls {
    grid-template-columns: 54px minmax(0, 1fr);
  }

  .transparent-button {
    grid-column: 1 / -1;
  }
}
</style>
