<!--
/**
 * @fileoverview JSON Search Bar Component
 * @component JsonSearchBar
 * @description Simple search functionality for filtering translation entries
 */
-->

<template>
    <v-card flat>
        <v-card-text class="pa-4">
            <v-text-field
                :model-value="search"
                @update:model-value="$emit('update:search', $event)"
                :label="t.searchKeys"
                :placeholder="t.searchPlaceholder"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-magnify"
                clearable
            ></v-text-field>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { useSafeI18n } from "../../../../utils/i18n/locale";

    const { t } = useSafeI18n("json-search-bar", {
        searchKeys: "Search Keys",
        searchPlaceholder: "Enter key to search...",
    });

    const props = defineProps<{
        search: string;
    }>();

    const emit = defineEmits<{
        "update:search": [value: string];
    }>();
</script>
