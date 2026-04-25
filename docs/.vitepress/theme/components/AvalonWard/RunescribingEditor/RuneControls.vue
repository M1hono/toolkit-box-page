<template>
    <v-card flat class="rune-controls">
        <v-card-text class="pa-6">
            <div class="buttons mb-6">
                <v-row dense class="buttons__row">
                    <v-col cols="12" sm="6">
                        <v-btn
                            @click="emit('clear-grid')"
                            block
                            variant="outlined"
                            size="large"
                            class="action-btn"
                        >
                            {{ t.clearGrid }}
                        </v-btn>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-btn
                            @click="emit('fill-grid')"
                            block
                            variant="outlined"
                            size="large"
                            class="action-btn"
                        >
                            {{ t.fillGrid }}
                        </v-btn>
                    </v-col>
                </v-row>
            </div>

            <div class="values-section mb-6">
                <v-row>
                    <v-col cols="12" md="6">
                        <v-card flat class="value-card h-100">
                            <v-card-text class="pa-4">
                                <div class="section-heading">
                                    {{ t.horizontal }}
                                </div>
                                <div class="value-stack">
                                    <div class="value-row">
                                        <div class="value-copy">
                                            <div class="value-label">
                                                {{ t.decimal }}
                                            </div>
                                            <code class="value-chip">{{
                                                hDecimal
                                            }}</code>
                                        </div>
                                        <v-btn
                                            @click="copyToClipboard(hDecimal)"
                                            icon="mdi-content-copy"
                                            size="small"
                                            variant="text"
                                            class="icon-action-btn toolbar-action"
                                            :aria-label="`${t.copy} ${t.horizontal} ${t.decimal}`"
                                        ></v-btn>
                                    </div>
                                    <div class="value-row value-row--stacked">
                                        <div class="value-label">
                                            {{ t.binary }}
                                        </div>
                                        <code class="value-chip value-chip--wide">{{
                                            hBinary
                                        }}</code>
                                    </div>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-card flat class="value-card h-100">
                            <v-card-text class="pa-4">
                                <div class="section-heading">
                                    {{ t.vertical }}
                                </div>
                                <div class="value-stack">
                                    <div class="value-row">
                                        <div class="value-copy">
                                            <div class="value-label">
                                                {{ t.decimal }}
                                            </div>
                                            <code class="value-chip">{{
                                                vDecimal
                                            }}</code>
                                        </div>
                                        <v-btn
                                            @click="copyToClipboard(vDecimal)"
                                            icon="mdi-content-copy"
                                            size="small"
                                            variant="text"
                                            class="icon-action-btn toolbar-action"
                                            :aria-label="`${t.copy} ${t.vertical} ${t.decimal}`"
                                        ></v-btn>
                                    </div>
                                    <div class="value-row value-row--stacked">
                                        <div class="value-label">
                                            {{ t.binary }}
                                        </div>
                                        <code class="value-chip value-chip--wide">{{
                                            vBinary
                                        }}</code>
                                    </div>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </div>

            <div class="config-section mb-6">
                <v-card flat class="section-card">
                    <v-card-text class="pa-4">
                        <div class="section-heading">
                            {{ t.recipeConfiguration }}
                        </div>
                        <div class="config-fields rune-field-stack">
                            <div class="config-field">
                                <span class="rune-field-label">{{
                                    t.outputItem
                                }}</span>
                                <input
                                    :value="config.output"
                                    @input="
                                        updateTextConfig(
                                            'output',
                                            ($event.target as HTMLInputElement)
                                                .value
                                        )
                                    "
                                    :placeholder="t.outputItemPlaceholder"
                                    type="text"
                                    class="rune-native-input"
                                />
                            </div>
                            <div class="config-field">
                                <span class="rune-field-label">{{
                                    t.tier
                                }}</span>
                                <input
                                    :value="config.tier"
                                    @input="
                                        updateNumericConfig(
                                            'tier',
                                            ($event.target as HTMLInputElement)
                                                .value
                                        )
                                    "
                                    type="number"
                                    min="1"
                                    step="1"
                                    class="rune-native-input rune-native-input--mono"
                                />
                            </div>
                            <div class="config-field">
                                <span class="rune-field-label">{{
                                    t.requiredFaction
                                }}</span>
                                <input
                                    :value="config.requiredFaction"
                                    @input="
                                        updateTextConfig(
                                            'requiredFaction',
                                            ($event.target as HTMLInputElement)
                                                .value
                                        )
                                    "
                                    :placeholder="t.requiredFactionPlaceholder"
                                    type="text"
                                    class="rune-native-input"
                                />
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </div>

            <div class="code-section">
                <v-card flat class="section-card">
                    <v-card-text class="pa-4">
                        <div class="section-heading section-heading--split">
                            <span>{{
                                shapeOnly ? t.shapeData : t.codeOutput
                            }}</span>
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
                                    <v-btn value="json" size="small">
                                        {{ t.json }}
                                    </v-btn>
                                    <v-btn value="kjs" size="small">
                                        {{ t.kubejs }}
                                    </v-btn>
                                </v-btn-toggle>
                                <v-btn
                                    v-if="!shapeOnly"
                                    @click="copyCodeToClipboard()"
                                    variant="text"
                                    class="copy-output-btn toolbar-action"
                                >
                                    <v-icon start>mdi-content-copy</v-icon>
                                    {{ t.copyCode }}
                                    {{
                                        outputFormat === "json"
                                            ? t.json
                                            : t.kubejs
                                    }}
                                </v-btn>
                            </div>
                        </div>

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
                                        @click="copyToClipboard(block.content)"
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
                    </v-card-text>
                </v-card>
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
    import type {
        RuneConfig,
        RuneValues,
        OutputFormat,
    } from "../../../../utils/runescribing";

    const { t } = useSafeI18n("rune-controls", {
        clearGrid: "Clear Grid",
        fillGrid: "Fill Grid",
        copy: "Copy",
        shapeData: "Shape Data",
        horizontal: "Horizontal",
        vertical: "Vertical",
        decimal: "Decimal",
        binary: "Binary",
        recipeConfiguration: "Recipe Configuration",
        outputItem: "Output Item",
        outputItemPlaceholder: "e.g. minecraft:acacia_boat",
        tier: "Tier",
        requiredFaction: "Required Faction",
        requiredFactionPlaceholder: "e.g. mna:none",
        codeOutput: "Code Output",
        copyCode: "Copy",
        fullRecipe: "Full Recipe",
        onlyShape: "Only Shape",
        json: "JSON",
        kubejs: "KubeJS",
    });

    const { isDark } = useData();

    const props = defineProps<{
        config: RuneConfig;
        values: RuneValues;
        outputFormat: OutputFormat;
        shapeOnly: boolean;
    }>();

    const emit = defineEmits<{
        "clear-grid": [];
        "fill-grid": [];
        "update:config": [config: RuneConfig];
        "update:output-format": [format: OutputFormat];
        "update:shape-only": [value: boolean];
    }>();

    const highlighter = ref<HighlighterCore | null>(null);
    const highlightedOutput = ref("");

    const hDecimal = computed(() => props.values.hValue.toString());
    const vDecimal = computed(() => props.values.vValue.toString());
    const hBinary = computed(() => props.values.hValue.toString(2));
    const vBinary = computed(() => props.values.vValue.toString(2));
    const shapeBlocks = computed(() => [
        {
            label: "h",
            content: hDecimal.value,
        },
        {
            label: "v",
            content: vDecimal.value,
        },
    ]);

    const jsonCode = computed(() => {
        return `{
    "type": "mna:runescribing",
    "tier": ${props.config.tier},
    "mutex_h": ${props.values.hValue},
    "mutex_v": ${props.values.vValue},
    "output": "${props.config.output}",
    "required_faction": "${props.config.requiredFaction}"
}`;
    });

    const kjsCode = computed(() => {
        return `event.recipes.mna.runescribing(${props.config.output}, ${props.values.hValue}, ${props.values.vValue}, ${props.config.tier}, "${props.config.requiredFaction}")`;
    });

    const outputContent = computed(() =>
        props.outputFormat === "json" ? jsonCode.value : kjsCode.value
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
                outputContent.value || " ",
                {
                    lang: props.outputFormat === "json" ? "json" : "javascript",
                    theme: isDark.value ? "github-dark" : "github-light",
                }
            );
        } catch (error) {
            console.error("Failed to highlight rune preview:", error);
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
            console.error("Failed to create rune preview highlighter:", error);
        }
    });

    watch(
        [outputContent, () => props.outputFormat, () => props.shapeOnly, isDark],
        () => {
            void renderHighlightedOutput();
        },
        { immediate: true }
    );

    function updateTextConfig(key: keyof RuneConfig, value: string) {
        const newConfig = { ...props.config, [key]: value };
        emit("update:config", newConfig);
    }

    function updateNumericConfig(key: keyof RuneConfig, rawValue: string) {
        const parsedValue = Number.parseInt(rawValue, 10);
        const nextValue = Number.isFinite(parsedValue)
            ? parsedValue
            : props.config[key];
        const newConfig = { ...props.config, [key]: nextValue };
        emit("update:config", newConfig);
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text).catch((err) => {
            console.error("Could not copy text: ", err);
        });
    }

    function copyCodeToClipboard() {
        const textToCopy =
            props.outputFormat === "json" ? jsonCode.value : kjsCode.value;

        navigator.clipboard.writeText(textToCopy).catch((err) => {
            console.error("Could not copy text: ", err);
        });
    }
</script>

<style scoped>
    .rune-controls {
        background: transparent;
    }

    .buttons__row {
        margin: 0;
    }

    .action-btn {
        min-height: 44px;
        border-color: color-mix(in srgb, var(--rune-border-strong) 92%, transparent) !important;
        background: color-mix(in srgb, var(--vp-c-bg) 94%, var(--rune-surface-muted) 6%) !important;
        color: var(--vp-c-text-1) !important;
        font-weight: 600;
    }

    .section-card,
    .value-card {
        border: 1px solid var(--rune-border);
        border-radius: 12px !important;
        background: color-mix(in srgb, var(--rune-surface) 88%, var(--vp-c-bg) 12%);
    }

    .section-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid color-mix(in srgb, var(--rune-border) 86%, transparent);
        color: var(--vp-c-text-1);
        font-size: 1.02rem;
        font-weight: 600;
        line-height: 1.35;
    }

    .section-heading--split {
        flex-wrap: wrap;
    }

    .value-stack {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .value-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px;
        border: 1px solid color-mix(in srgb, var(--rune-border) 86%, transparent);
        border-radius: 10px;
        background: color-mix(in srgb, var(--vp-c-bg) 92%, var(--rune-surface-muted) 8%);
    }

    .value-row--stacked {
        display: block;
    }

    .value-copy {
        min-width: 0;
        flex: 1;
    }

    .value-label {
        color: var(--vp-c-text-2);
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
    }

    .value-chip {
        display: block;
        width: 100%;
        margin-top: 6px;
        padding: 8px 10px;
        border: 1px solid color-mix(in srgb, var(--rune-border) 88%, transparent);
        border-radius: 8px;
        background: var(--vp-c-bg);
        color: var(--vp-c-text-1);
        font-size: 0.95rem;
        font-weight: 600;
        line-height: 1.45;
        overflow-wrap: anywhere;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    }

    .value-chip--wide {
        margin-top: 8px;
    }

    .icon-action-btn {
        margin-top: 18px;
        color: var(--vp-c-text-2) !important;
    }

    .config-fields {
        gap: 14px;
    }

    .config-field {
        display: flex;
        flex-direction: column;
        gap: 8px;
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
        border: 1px solid color-mix(in srgb, var(--rune-border) 84%, transparent);
        border-radius: 10px;
        background: var(--rune-control-bg);
        gap: 2px;
    }

    .format-toggle :deep(.v-btn) {
        min-width: 78px;
        border-radius: 8px !important;
        text-transform: none;
        color: var(--vp-c-text-2);
    }

    .format-toggle :deep(.v-btn--active) {
        background: color-mix(in srgb, var(--rune-accent) 14%, var(--vp-c-bg) 86%);
        color: var(--rune-accent);
    }

    .preview-code,
    .code-fallback,
    .shape-block__body {
        display: block;
        min-height: 260px;
        margin: 0;
        border: 1px solid color-mix(in srgb, var(--rune-border) 84%, transparent);
        border-radius: 10px;
        background: var(--rune-code-bg);
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
        min-height: 260px;
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

    .shape-blocks {
        display: grid;
        grid-template-columns: repeat(1, minmax(0, 1fr));
        gap: 12px;
    }

    .shape-block {
        border: 1px solid color-mix(in srgb, var(--rune-border) 84%, transparent);
        border-radius: 10px;
        background: color-mix(in srgb, var(--rune-surface) 88%, var(--vp-c-bg) 12%);
        overflow: hidden;
    }

    .shape-block__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px;
        border-bottom: 1px solid color-mix(in srgb, var(--rune-border) 84%, transparent);
        background: color-mix(in srgb, var(--vp-c-bg) 92%, var(--rune-surface-muted) 8%);
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

    .copy-output-btn {
        color: var(--vp-c-text-1) !important;
    }

    @media (max-width: 900px) {
        .value-row {
            flex-direction: column;
        }

        .icon-action-btn {
            margin-top: 0;
            align-self: flex-end;
        }
    }
</style>
