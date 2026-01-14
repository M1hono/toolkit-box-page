<!--
/**
 * @fileoverview FGO Top Controls Component
 * @component FgoTopControls
 * @description Controls that should appear above the canvas on mobile (image select, ratio, selection)
 */
-->

<template>
    <div class="top-controls">
        <div v-if="hasImages" class="card">
            <div class="card-title">{{ t.image }}</div>
            <select
                class="select"
                :value="currentImageKey"
                @change="onImageChange"
            >
                <option v-for="(url, key) in allImages" :key="key" :value="key">
                    {{ key }}
                </option>
            </select>
        </div>

        <div class="card">
            <div class="card-title">{{ t.ratio }}</div>
            <div class="ratio-grid">
                <button
                    v-for="ratio in aspectRatios"
                    :key="ratio"
                    :class="[
                        'ratio-btn',
                        { active: currentAspectRatio === ratio },
                    ]"
                    @click="$emit('set-aspect-ratio', ratio)"
                >
                    {{ ratio }}
                </button>
            </div>
        </div>

        <div class="card">
            <div class="card-title">{{ t.selection }}</div>
            <div class="grid">
                <label class="field">
                    <span class="label">X</span>
                    <input
                        class="input"
                        type="number"
                        :value="Math.round(selection.x)"
                        @input="onCoord('x', $event)"
                    />
                </label>
                <label class="field">
                    <span class="label">Y</span>
                    <input
                        class="input"
                        type="number"
                        :value="Math.round(selection.y)"
                        @input="onCoord('y', $event)"
                    />
                </label>
                <label class="field">
                    <span class="label">{{ t.width }}</span>
                    <input
                        class="input"
                        type="number"
                        :value="Math.round(selection.width)"
                        @input="onCoord('width', $event)"
                    />
                </label>
                <label class="field">
                    <span class="label">{{ t.height }}</span>
                    <input
                        class="input"
                        type="number"
                        :value="Math.round(selection.height)"
                        @input="onCoord('height', $event)"
                    />
                </label>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed } from "vue";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type { SelectionRect } from "../../../../utils/chara/fgo/types";

    const { t } = useSafeI18n("fgo-top-controls", {
        image: "Image",
        ratio: "Aspect Ratio",
        selection: "Selection",
        width: "W",
        height: "H",
    });

    const props = defineProps<{
        allImages: Record<string, string>;
        currentImageKey: string;
        selection: SelectionRect;
        currentAspectRatio: string;
    }>();

    const emit = defineEmits<{
        "select-image": [key: string];
        "set-aspect-ratio": [ratio: string];
        "update-selection": [selection: SelectionRect];
    }>();

    const aspectRatios = ["custom", "1:1", "4:3", "3:2", "16:9", "21:9"];
    const hasImages = computed(() => Object.keys(props.allImages).length > 0);

    function onImageChange(e: Event) {
        const el = e.target as HTMLSelectElement;
        const key = el.value;
        if (!key) return;
        emit("select-image", key);
    }

    function onCoord(field: keyof SelectionRect, e: Event) {
        const el = e.target as HTMLInputElement;
        const value = Math.max(0, Number.parseInt(el.value || "0", 10) || 0);
        emit("update-selection", { ...props.selection, [field]: value });
    }
</script>

<style scoped>
    .top-controls {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .card {
        background: var(--vp-c-bg);
        border: 1px solid var(--vp-c-divider);
        border-radius: 10px;
        padding: 12px;
    }

    .card-title {
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--vp-c-text-1);
        margin-bottom: 10px;
    }

    .select {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid var(--vp-c-divider);
        border-radius: 8px;
        background: var(--vp-c-bg);
        color: var(--vp-c-text-1);
        font-size: 0.85rem;
    }

    .ratio-grid {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 6px;
    }

    .ratio-btn {
        padding: 8px 6px;
        border: 1px solid var(--vp-c-divider);
        border-radius: 8px;
        background: var(--vp-c-bg);
        color: var(--vp-c-text-1);
        font-size: 0.75rem;
        cursor: pointer;
    }

    .ratio-btn.active {
        background: var(--vp-c-brand-1);
        border-color: var(--vp-c-brand-1);
        color: #fff;
    }

    .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .label {
        font-size: 0.75rem;
        color: var(--vp-c-text-3);
    }

    .input {
        padding: 8px 10px;
        border: 1px solid var(--vp-c-divider);
        border-radius: 8px;
        background: var(--vp-c-bg);
        color: var(--vp-c-text-1);
        font-size: 0.85rem;
    }

    .input:focus {
        outline: none;
        border-color: var(--vp-c-brand-1);
    }

    @media (max-width: 640px) {
        .ratio-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }
    }
</style>
