<!--
/**
 * @fileoverview Ritual Manaweave Editor Component
 * @component RitualManaweaveEditor
 * @description Manages manaweave patterns for the ritual
 */
-->

<template>
    <v-card flat class="ritual-manaweave-editor">
        <v-card-title class="text-h6">{{ t.manaweavePatterns }}</v-card-title>
        <v-card-text class="pa-5">
            <manaweave-pattern-list-editor
                :patterns="patterns"
                @update:patterns="emit('update:patterns', $event)"
            />
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import ManaweavePatternListEditor from "../ManaweavePatternEditor/ManaweavePatternListEditor.vue";

    const { t } = useSafeI18n("ritual-manaweave-editor", {
        manaweavePatterns: "Manaweave Patterns",
    });

    const props = defineProps<{
        patterns: string[];
    }>();

    const emit = defineEmits<{
        "update:patterns": [patterns: string[]];
    }>();
</script>

<style scoped></style>
