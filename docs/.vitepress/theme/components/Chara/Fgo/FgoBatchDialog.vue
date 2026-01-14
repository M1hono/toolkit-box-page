<!--
/**
 * @fileoverview FGO Batch Dialog Component
 * @component FgoBatchDialog
 * @description Modal dialog for batch download options
 */
-->

<template>
    <div v-if="show" class="batch-overlay" @click="$emit('close')">
        <div class="batch-dialog" @click.stop>
            <h3>{{ t.title }}</h3>
            <p class="dialog-desc">{{ t.description }}</p>
            <div class="batch-options">
                <button class="batch-btn" @click="$emit('confirm', 'cropped')">
                    {{ t.batchCropped }}
                    <span class="btn-desc">{{ t.batchCroppedDesc }}</span>
                </button>
                <button class="batch-btn" @click="$emit('confirm', 'full')">
                    {{ t.batchFull }}
                    <span class="btn-desc">{{ t.batchFullDesc }}</span>
                </button>
            </div>
            <button class="cancel-btn" @click="$emit('close')">
                {{ t.cancel }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../../utils/i18n/locale";

    const { t } = useSafeI18n("fgo-batch-dialog", {
        title: "Batch Download",
        description: "Choose download type for all variants",
        batchCropped: "Cropped Selection",
        batchCroppedDesc: "Download with current selection area",
        batchFull: "Full Images",
        batchFullDesc: "Download complete diff images",
        cancel: "Cancel",
    });

    defineProps<{
        show: boolean;
    }>();

    defineEmits<{
        close: [];
        confirm: [type: 'cropped' | 'full'];
    }>();
</script>

<style scoped>
    .batch-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .batch-dialog {
        background: var(--vp-c-bg);
        border: 1px solid var(--vp-c-divider);
        border-radius: 12px;
        padding: 24px;
        min-width: 400px;
        max-width: 90vw;
    }

    .batch-dialog h3 {
        margin: 0 0 12px 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--vp-c-text-1);
    }

    .dialog-desc {
        margin: 0 0 20px 0;
        font-size: 0.9rem;
        color: var(--vp-c-text-3);
    }

     .batch-options {
         margin-bottom: 16px;
         display: flex;
         flex-direction: column;
         gap: 12px;
     }

    .batch-btn {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 16px;
        border: 1px solid var(--vp-c-divider);
        border-radius: 8px;
        background: var(--vp-c-bg);
        cursor: pointer;
        transition: all 0.15s ease;
        text-align: left;
        font-size: 1rem;
        font-weight: 600;
        color: var(--vp-c-text-1);
    }

    .batch-btn:hover {
        border-color: var(--vp-c-brand-1);
        background: var(--vp-c-brand-soft);
    }


    .btn-desc {
        font-size: 0.85rem;
        font-weight: 400;
        margin-top: 4px;
        opacity: 0.9;
    }

    .cancel-btn {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--vp-c-divider);
        border-radius: 6px;
        background: var(--vp-c-bg);
        color: var(--vp-c-text-2);
        cursor: pointer;
        font-size: 0.9rem;
    }

    .cancel-btn:hover {
        background: var(--vp-c-bg-soft);
    }

    @media (max-width: 640px) {
        .batch-dialog {
            min-width: 0;
            width: 90vw;
        }
    }
</style>
