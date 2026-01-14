<template>
    <v-card flat>
        <v-card-text class="pa-6">
            <!-- Action Buttons -->
            <div class="buttons mb-6">
                <v-row dense>
                    <v-col cols="6">
                        <v-btn
                            @click="$emit('clear-grid')"
                            block
                            variant="outlined"
                            color="error"
                            size="large"
                        >
                            {{ t.clearGrid }}
                        </v-btn>
                    </v-col>
                    <v-col cols="6">
                        <v-btn
                            @click="$emit('fill-grid')"
                            block
                            variant="outlined"
                            color="success"
                            size="large"
                        >
                            {{ t.fillGrid }}
                        </v-btn>
                    </v-col>
                </v-row>
            </div>

            <!-- Values Section -->
            <div class="values-section mb-6">
                <v-row>
                    <v-col cols="12" md="6">
                        <v-card variant="outlined" class="h-100">
                            <v-card-title class="text-h6">{{
                                t.horizontal
                            }}</v-card-title>
                            <v-card-text>
                                <v-text-field
                                    :label="t.decimal"
                                    :model-value="hDecimal"
                                    readonly
                                    variant="outlined"
                                    density="compact"
                                    class="mb-2"
                                >
                                    <template #append>
                                        <v-btn
                                            @click="copyToClipboard(hDecimal)"
                                            icon="mdi-content-copy"
                                            size="small"
                                            variant="text"
                                        ></v-btn>
                                    </template>
                                </v-text-field>
                                <v-text-field
                                    :label="t.binary"
                                    :model-value="hBinary"
                                    readonly
                                    variant="outlined"
                                    density="compact"
                                ></v-text-field>
                            </v-card-text>
                        </v-card>
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-card variant="outlined" class="h-100">
                            <v-card-title class="text-h6">{{
                                t.vertical
                            }}</v-card-title>
                            <v-card-text>
                                <v-text-field
                                    :label="t.decimal"
                                    :model-value="vDecimal"
                                    readonly
                                    variant="outlined"
                                    density="compact"
                                    class="mb-2"
                                >
                                    <template #append>
                                        <v-btn
                                            @click="copyToClipboard(vDecimal)"
                                            icon="mdi-content-copy"
                                            size="small"
                                            variant="text"
                                        ></v-btn>
                                    </template>
                                </v-text-field>
                                <v-text-field
                                    :label="t.binary"
                                    :model-value="vBinary"
                                    readonly
                                    variant="outlined"
                                    density="compact"
                                ></v-text-field>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </div>

            <!-- Recipe Configuration -->
            <div class="config-section mb-6">
                <v-card variant="outlined">
                    <v-card-title class="text-h6">{{
                        t.recipeConfiguration
                    }}</v-card-title>
                    <v-card-text>
                        <v-text-field
                            :model-value="config.output"
                            @update:model-value="updateConfig('output', $event)"
                            :label="t.outputItem"
                            :placeholder="t.outputItemPlaceholder"
                            variant="outlined"
                            density="compact"
                            class="mb-3"
                        ></v-text-field>
                        <v-text-field
                            :model-value="config.tier"
                            @update:model-value="
                                updateConfig('tier', Number($event))
                            "
                            :label="t.tier"
                            type="number"
                            min="1"
                            step="1"
                            variant="outlined"
                            density="compact"
                            class="mb-3"
                        ></v-text-field>
                        <v-text-field
                            :model-value="config.requiredFaction"
                            @update:model-value="
                                updateConfig('requiredFaction', $event)
                            "
                            :label="t.requiredFaction"
                            :placeholder="t.requiredFactionPlaceholder"
                            variant="outlined"
                            density="compact"
                        ></v-text-field>
                    </v-card-text>
                </v-card>
            </div>

            <!-- Code Output -->
            <div class="code-section">
                <v-card variant="outlined">
                    <v-card-title
                        class="d-flex justify-space-between align-center"
                    >
                        <span class="text-h6">{{ t.codeOutput }}</span>
                        <div class="format-actions">
                            <v-btn-toggle
                                :model-value="outputFormat"
                                @update:model-value="
                                    $emit('update:output-format', $event)
                                "
                                mandatory
                                variant="outlined"
                                density="compact"
                            >
                                <v-btn value="json" size="small">JSON</v-btn>
                                <v-btn value="kjs" size="small">KubeJS</v-btn>
                            </v-btn-toggle>
                        </div>
                    </v-card-title>
                    <v-card-text>
                        <v-textarea
                            :model-value="
                                outputFormat === 'json' ? javaCode : kjsCode
                            "
                            readonly
                            variant="outlined"
                            :rows="8"
                            class="code-textarea mb-3"
                            style="font-family: 'Courier New', monospace"
                        ></v-textarea>
                        <v-btn
                            @click="copyCodeToClipboard()"
                            block
                            color="primary"
                            variant="flat"
                        >
                            <v-icon start>mdi-content-copy</v-icon>
                            {{ t.copyCode }}
                            {{ outputFormat === "json" ? "JSON" : "KubeJS" }}
                        </v-btn>
                    </v-card-text>
                </v-card>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { computed } from "vue";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type {
        RuneConfig,
        RuneValues,
        OutputFormat,
    } from "../../../../utils/runescribing";

    const { t } = useSafeI18n("rune-controls", {
        clearGrid: "Clear Grid",
        fillGrid: "Fill Grid",
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
    });

    const props = defineProps<{
        config: RuneConfig;
        values: RuneValues;
        outputFormat: OutputFormat;
    }>();

    const emit = defineEmits<{
        "clear-grid": [];
        "fill-grid": [];
        "update:config": [config: RuneConfig];
        "update:output-format": [format: OutputFormat];
    }>();

    const hDecimal = computed(() => props.values.hValue.toString());
    const vDecimal = computed(() => props.values.vValue.toString());
    const hBinary = computed(() => props.values.hValue.toString(2));
    const vBinary = computed(() => props.values.vValue.toString(2));

    const javaCode = computed(() => {
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

    function updateConfig(key: keyof RuneConfig, value: string | number) {
        const newConfig = { ...props.config, [key]: value };
        emit("update:config", newConfig);
    }

    function copyToClipboard(text: string) {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                // Could add a snackbar notification here
            })
            .catch((err) => {
                console.error("Could not copy text: ", err);
            });
    }

    function copyCodeToClipboard() {
        const textToCopy =
            props.outputFormat === "json" ? javaCode.value : kjsCode.value;

        navigator.clipboard
            .writeText(textToCopy)
            .then(() => {
                // Could add a snackbar notification here
            })
            .catch((err) => {
                console.error("Could not copy text: ", err);
            });
    }
</script>
