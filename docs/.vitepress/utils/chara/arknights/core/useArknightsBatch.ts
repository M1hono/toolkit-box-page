/**
 * @fileoverview Arknights Batch Composable
 * @description Logic for batch downloading and ZIP generation
 */

import { ref } from 'vue';
import JSZip from 'jszip';
import type { UnifiedCharacterData } from '../types';

export function useArknightsBatch() {
    const isBatchProcessing = ref(false);

    async function downloadAsZip(character: UnifiedCharacterData, variants: string[], getUrl: (v: string) => string) {
        try {
            isBatchProcessing.value = true;
            const zip = new JSZip();
            const folder = zip.folder(`${character.displayName}_variants`)!;

            for (const variant of variants) {
                const url = getUrl(variant);
                const response = await fetch(url);
                const blob = await response.blob();
                folder.file(`${variant}.png`, blob);
            }

            const content = await zip.generateAsync({ type: "blob" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = `${character.displayName}_variants.zip`;
            link.click();
        } catch (error) {
            console.error('❌ Batch download failed:', error);
        } finally {
            isBatchProcessing.value = false;
        }
    }

    return {
        isBatchProcessing,
        downloadAsZip
    };
}
