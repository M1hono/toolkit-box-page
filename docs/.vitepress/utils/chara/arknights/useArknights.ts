/**
 * @fileoverview Main Arknights Composable
 * @description Orchestrates all Arknights sub-composables
 */

import { onMounted, watch } from 'vue';
import { useArknightsCore } from './core/useArknightsCore';
import { useArknightsCanvas } from './core/useArknightsCanvas';
import { useArknightsList } from './core/useArknightsList';
import { useArknightsBatch } from './core/useArknightsBatch';

export function useArknights() {
    const core = useArknightsCore();
    const list = useArknightsList(core.unifiedCharacters);
    const canvas = useArknightsCanvas();
    const batch = useArknightsBatch();

    onMounted(async () => {
        await core.loadData();
    });

    // Handle language change
    watch(core.currentLangCode, async () => {
        await core.loadData();
    });

    return {
        ...core,
        ...list,
        ...canvas,
        ...batch
    };
}
