<!--
/**
 * @fileoverview Arknights Batch Download Dialog
 * @component ArknightsBatchDialog
 * @description Modal dialog for batch download options
 */
-->

<template>
    <div v-if="show" class="batch-overlay" @click="$emit('close')">
        <div class="batch-dialog" @click.stop>
            <h3 class="dialog-title">{{ t.title }}</h3>
            <div class="batch-options">
                <button class="batch-option" @click="$emit('batch-crop')">
                    <div class="option-content">
                        <div class="option-title">{{ t.batchCrop }}</div>
                        <div class="option-desc">{{ t.batchCropDesc }}</div>
                    </div>
                </button>
                <button class="batch-option" @click="$emit('batch-full')">
                    <div class="option-content">
                        <div class="option-title">{{ t.batchFull }}</div>
                        <div class="option-desc">{{ t.batchFullDesc }}</div>
                    </div>
                </button>
            </div>
            <button class="dialog-cancel" @click="$emit('close')">
                {{ t.cancel }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../../utils/i18n/locale";

    const { t } = useSafeI18n("arknights-batch-dialog", {
        title: "Batch Download",
        batchCrop: "Batch Crop",
        batchCropDesc: "Download all variants with current selection",
        batchFull: "Batch Full",
        batchFullDesc: "Download all original variants",
        cancel: "Cancel",
    });

    defineProps<{
        show: boolean;
    }>();

    defineEmits<{
        close: [];
        "batch-crop": [];
        "batch-full": [];
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

    .dialog-title {
        margin: 0 0 16px 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--vp-c-text-1);
    }

    .batch-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 16px;
    }

    .batch-option {
        display: flex;
        align-items: stretch;
        padding: 16px;
        border: 1px solid var(--vp-c-divider);
        border-radius: 8px;
        background: var(--vp-c-bg);
        cursor: pointer;
        transition: all 0.15s ease;
        text-align: left;
    }

    .batch-option:hover {
        border-color: var(--vp-c-brand-1);
        background: var(--vp-c-brand-soft);
    }

    .option-title {
        font-weight: 600;
        font-size: 1rem;
        color: var(--vp-c-text-1);
        margin-bottom: 4px;
    }

    .option-desc {
        font-size: 0.85rem;
        color: var(--vp-c-text-3);
    }

    .dialog-cancel {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--vp-c-divider);
        border-radius: 6px;
        background: var(--vp-c-bg);
        color: var(--vp-c-text-2);
        cursor: pointer;
        font-size: 0.9rem;
    }

    .dialog-cancel:hover {
        background: var(--vp-c-bg-soft);
    }

    @media (max-width: 640px) {
        .batch-dialog {
            min-width: 0;
            width: 90vw;
        }
    }
</style>
