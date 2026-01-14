<!--
/**
 * @fileoverview Ritual Manaweave Editor Component
 * @component RitualManaweaveEditor
 * @description Manages manaweave patterns for the ritual
 */
-->

<template>
    <v-card flat>
        <v-card-title class="text-h6">{{ t.manaweavePatterns }}</v-card-title>
        <v-card-text>
            <v-btn
                @click="handleAddPattern"
                color="primary"
                variant="outlined"
                block
                class="mb-4"
            >
                <v-icon start>mdi-plus</v-icon>
                {{ t.addPattern }}
            </v-btn>

            <div
                v-if="patterns.length === 0"
                class="text-center text-grey pa-4"
            >
                {{ t.noPatterns }}
            </div>
            <v-list v-else dense>
                <v-list-item
                    v-for="(pattern, index) in patterns"
                    :key="'manaweave-' + index"
                    class="px-0"
                >
                    <template #prepend>
                        <v-chip size="small" class="mr-2">{{
                            index + 1
                        }}</v-chip>
                    </template>
                    <v-list-item-title>{{ pattern }}</v-list-item-title>
                    <template #append>
                        <v-btn
                            @click="handleRemovePattern(index)"
                            color="error"
                            icon="mdi-delete"
                            size="small"
                            variant="text"
                        ></v-btn>
                    </template>
                </v-list-item>
            </v-list>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../../utils/i18n/locale";

    const { t } = useSafeI18n("ritual-manaweave-editor", {
        manaweavePatterns: "Manaweave Patterns",
        addPattern: "Add Pattern",
        noPatterns: "No manaweave patterns defined.",
    });

    const props = defineProps<{
        patterns: string[];
    }>();

    const emit = defineEmits<{
        "update:patterns": [patterns: string[]];
    }>();

    /**
     * Handles adding a new manaweave pattern
     */
    const handleAddPattern = () => {
        const pattern = prompt("Enter manaweave pattern:");
        if (pattern) {
            const newPatterns = [...props.patterns, pattern];
            emit("update:patterns", newPatterns);
        }
    };

    /**
     * Handles removing a manaweave pattern
     * @param index - Index of pattern to remove
     */
    const handleRemovePattern = (index: number) => {
        const newPatterns = props.patterns.filter((_, i) => i !== index);
        emit("update:patterns", newPatterns);
    };
</script>

<style scoped>
    .v-card {
        border: 1px solid #bdbdbd;
        box-shadow: none !important;
    }

    .v-card,
    .v-btn,
    .v-chip,
    .v-list-item {
        border-radius: 12px !important;
    }

    .v-list-item {
        margin-bottom: 4px;
        border: 1px solid #e0e0e0;
    }
</style>
