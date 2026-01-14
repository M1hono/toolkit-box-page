<!--
/**
 * @fileoverview Ritual Command Editor Component
 * @component RitualCommandEditor
 * @description Handles command input for ritual completion
 */
-->

<template>
    <v-card flat>
        <v-card-title class="text-h6"
            >{{ t.command }} ({{ t.optional }})</v-card-title
        >
        <v-card-text>
            <v-textarea
                :model-value="command"
                @update:model-value="$emit('update:command', $event)"
                :placeholder="t.commandPlaceholder"
                variant="outlined"
                :rows="4"
                style="font-family: 'Courier New', monospace"
            ></v-textarea>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../../utils/i18n/locale";

    const { t } = useSafeI18n("ritual-command-editor", {
        command: "Command",
        optional: "Optional",
        commandPlaceholder: "Enter command to execute on ritual completion",
    });

    const props = defineProps<{
        command: string;
    }>();

    const emit = defineEmits<{
        "update:command": [command: string];
    }>();
</script>

<style scoped>
    .v-card {
        border: 1px solid #bdbdbd;
        box-shadow: none !important;
    }

    .v-card,
    .v-textarea .v-field {
        border-radius: 12px !important;
    }

    .v-textarea .v-field {
        font-family: "Courier New", monospace !important;
    }
</style>
