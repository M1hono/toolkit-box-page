<template>
    <v-card flat class="manaweave-pattern-output">
        <v-card-text class="pa-6">
            <div class="preview-shell">
                <div class="preview-header">
                    <h3 class="preview-title">
                        {{ shapeOnly ? t.shapeData : t.outputFormat }}
                    </h3>
                    <div class="format-actions">
                        <v-btn-toggle
                            :model-value="shapeOnly ? 'shape' : 'full'"
                            @update:model-value="
                                emit('update:shape-only', $event === 'shape')
                            "
                            mandatory
                            variant="text"
                            density="comfortable"
                            class="format-toggle"
                        >
                            <v-btn value="full" size="small">
                                {{ t.fullRecipe }}
                            </v-btn>
                            <v-btn value="shape" size="small">
                                {{ t.onlyShape }}
                            </v-btn>
                        </v-btn-toggle>
                        <v-btn-toggle
                            v-if="!shapeOnly"
                            :model-value="outputFormat"
                            @update:model-value="
                                emit('update:output-format', $event)
                            "
                            mandatory
                            variant="text"
                            density="comfortable"
                            class="format-toggle"
                        >
                            <v-btn value="json" size="small">JSON</v-btn>
                            <v-btn value="kjs" size="small">KubeJS</v-btn>
                        </v-btn-toggle>
                        <v-btn
                            v-if="!shapeOnly"
                            @click="copyToClipboard"
                            variant="text"
                            class="copy-button toolbar-action"
                        >
                            <v-icon start>mdi-content-copy</v-icon>
                            {{ t.copyCode }}
                        </v-btn>
                    </div>
                </div>

                <div class="preview-output">
                    <template v-if="shapeOnly ? hasShape : true">
                        <div v-if="shapeOnly" class="shape-blocks">
                            <section
                                v-for="block in shapeBlocks"
                                :key="block.label"
                                class="shape-block"
                            >
                                <div class="shape-block__header">
                                    <span class="shape-block__title">{{
                                        block.label
                                    }}</span>
                                    <v-btn
                                        @click="copyShapeBlock(block.content)"
                                        variant="text"
                                        size="small"
                                        class="toolbar-action shape-block__copy"
                                    >
                                        <v-icon start>mdi-content-copy</v-icon>
                                        {{ t.copy }}
                                    </v-btn>
                                </div>
                                <pre class="shape-block__body"><code>{{ block.content }}</code></pre>
                            </section>
                        </div>
                        <div
                            v-else-if="highlightedOutput"
                            class="preview-code"
                            v-html="highlightedOutput"
                        />
                        <pre v-else class="code-fallback"><code>{{ outputContent }}</code></pre>
                    </template>
                    <div v-else class="preview-empty">
                        {{ t.defineShapeToSeeShape }}
                    </div>
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { computed, onMounted, ref, watch } from "vue";
    import { useData } from "vitepress";
    import { createHighlighter } from "shiki";
    import type { HighlighterCore } from "shiki";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type { ManaweaveOutputFormat } from "../../../../utils/manaweavePatternEditor";
    import {
        generateManaweavingPatternJsonPreview,
        generateManaweavingPatternKjsPreview,
        generateManaweavingPatternShapePreview,
    } from "../../../../utils/manaweavePatternEditor";

    const { t } = useSafeI18n("manaweave-pattern-output", {
        copy: "Copy",
        copyCode: "Copy Code",
        defineShapeToSeeShape:
            "Define at least one non-zero cell to see shape data.",
        fullRecipe: "Full Recipe",
        onlyShape: "Only Shape",
        outputFormat: "Output Format",
        pattern: "pattern",
        shapeData: "Shape Data",
    });

    const { isDark } = useData();

    const props = defineProps<{
        outputFormat: ManaweaveOutputFormat;
        pattern: number[][];
        tier: number;
        requiredFaction: string;
        shapeOnly: boolean;
    }>();

    const emit = defineEmits<{
        "update:output-format": [format: ManaweaveOutputFormat];
        "update:shape-only": [value: boolean];
    }>();

    const highlighter = ref<HighlighterCore | null>(null);
    const highlightedOutput = ref("");
    const hasShape = computed(() =>
        props.pattern.some((row) => row.some((cell) => cell !== 0))
    );
    const shapeBlocks = computed(() => [
        {
            label: t.pattern,
            content: generateManaweavingPatternShapePreview(props.pattern),
        },
    ]);

    const outputContent = computed(() =>
        props.outputFormat === "json"
            ? generateManaweavingPatternJsonPreview(
                  props.pattern,
                  props.tier,
                  props.requiredFaction
              )
            : generateManaweavingPatternKjsPreview(
                  props.pattern,
                  props.tier,
                  props.requiredFaction
              )
    );

    const renderHighlightedOutput = async () => {
        if (props.shapeOnly) {
            highlightedOutput.value = "";
            return;
        }

        if (!highlighter.value) {
            highlightedOutput.value = "";
            return;
        }

        try {
            highlightedOutput.value = highlighter.value.codeToHtml(
                outputContent.value,
                {
                    lang: props.outputFormat === "json" ? "json" : "javascript",
                    theme: isDark.value ? "github-dark" : "github-light",
                }
            );
        } catch (error) {
            console.error("Failed to highlight manaweaving pattern preview:", error);
            highlightedOutput.value = "";
        }
    };

    onMounted(async () => {
        try {
            highlighter.value = await createHighlighter({
                themes: ["github-dark", "github-light"],
                langs: ["json", "javascript"],
            });
            await renderHighlightedOutput();
        } catch (error) {
            console.error(
                "Failed to create manaweaving pattern preview highlighter:",
                error
            );
        }
    });

    watch(
        [outputContent, () => props.outputFormat, () => props.shapeOnly, isDark],
        () => {
            void renderHighlightedOutput();
        },
        { immediate: true }
    );

    const copyToClipboard = () => {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(outputContent.value);
        }
    };

    const copyShapeBlock = (textToCopy: string) => {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(textToCopy);
        }
    };
</script>

<style scoped>
    .preview-shell {
        border: 1px solid color-mix(in srgb, var(--ritual-border) 84%, transparent);
        border-radius: 12px;
        background: color-mix(in srgb, var(--vp-c-bg) 94%, var(--ritual-surface-muted) 6%);
        overflow: hidden;
    }

    .preview-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        padding: 14px 16px;
        border-bottom: 1px solid color-mix(in srgb, var(--ritual-border) 84%, transparent);
        background: color-mix(in srgb, var(--vp-c-bg) 90%, var(--ritual-surface-muted) 10%);
    }

    .preview-title {
        margin: 0;
        color: var(--vp-c-text-1);
        font-size: 1rem;
        font-weight: 600;
        line-height: 1.35;
    }

    .preview-output {
        padding: 16px;
    }

    .preview-code,
    .code-fallback,
    .shape-block__body {
        display: block;
        min-height: 320px;
        margin: 0;
        border: 1px solid color-mix(in srgb, var(--ritual-border) 84%, transparent);
        border-radius: 10px;
        background: var(--ritual-code-bg);
        overflow: auto;
    }

    .preview-code :deep(pre),
    .code-fallback,
    .shape-block__body {
        margin: 0;
        padding: 16px;
        background: transparent !important;
    }

    .preview-code :deep(.shiki) {
        min-height: 320px;
        padding: 16px;
        background: transparent !important;
    }

    .preview-code :deep(code),
    .code-fallback code,
    .shape-block__body code {
        font-size: 0.92rem;
        line-height: 1.65;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    }

    .code-fallback {
        color: var(--vp-c-text-1);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
    }

    .preview-empty {
        display: flex;
        align-items: center;
        min-height: 180px;
        padding: 18px 16px;
        border: 1px solid color-mix(in srgb, var(--ritual-border) 84%, transparent);
        border-radius: 10px;
        background: var(--ritual-code-bg);
        color: var(--vp-c-text-2);
        line-height: 1.55;
    }

    .shape-blocks {
        display: grid;
        grid-template-columns: repeat(1, minmax(0, 1fr));
        gap: 12px;
    }

    .shape-block {
        border: 1px solid color-mix(in srgb, var(--ritual-border) 84%, transparent);
        border-radius: 10px;
        background: color-mix(in srgb, var(--vp-c-bg) 94%, var(--ritual-surface-muted) 6%);
        overflow: hidden;
    }

    .shape-block__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px;
        border-bottom: 1px solid color-mix(in srgb, var(--ritual-border) 84%, transparent);
        background: color-mix(in srgb, var(--vp-c-bg) 90%, var(--ritual-surface-muted) 10%);
    }

    .shape-block__title {
        color: var(--vp-c-text-1);
        font-size: 0.95rem;
        font-weight: 600;
        line-height: 1.35;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    }

    .shape-block__copy {
        color: var(--vp-c-text-1) !important;
    }

    .shape-block__body {
        min-height: 0;
        border: 0;
        border-radius: 0;
        color: var(--vp-c-text-1);
        white-space: pre-wrap;
        overflow-wrap: anywhere;
    }

    .format-actions {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
        justify-content: flex-end;
    }

    .format-toggle {
        padding: 3px;
        border: 1px solid color-mix(in srgb, var(--ritual-border) 84%, transparent);
        border-radius: 10px;
        background: var(--ritual-control-bg);
        gap: 2px;
    }

    .format-toggle :deep(.v-btn) {
        min-width: 78px;
        border-radius: 8px !important;
        text-transform: none;
        color: var(--vp-c-text-2);
    }

    .format-toggle :deep(.v-btn--active) {
        background: color-mix(in srgb, var(--ritual-accent) 14%, var(--vp-c-bg) 86%);
        color: var(--ritual-accent);
    }

    .copy-button {
        color: var(--vp-c-text-1) !important;
    }
</style>
