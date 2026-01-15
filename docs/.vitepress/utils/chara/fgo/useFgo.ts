/**
 * @fileoverview Main FGO Composable
 * @description Orchestrates all FGO sub-composables
 */

import { onMounted } from "vue";
import { useFgoImageLoader } from "./core/useFgoImageLoader";
import { useFgoDiffProcessor } from "./core/useFgoDiffProcessor";
import { useFgoSelection } from "./core/useFgoSelection";
import { useFgoCanvasOps } from "./core/useFgoCanvasOps";
import { useFgoFaceDetection } from "./core/useFgoFaceDetection";

export function useFgo() {
    const imageLoader = useFgoImageLoader();
    const diffProcessor = useFgoDiffProcessor();
    const selection = useFgoSelection();
    const canvasOps = useFgoCanvasOps();
    const faceDetection = useFgoFaceDetection();

    onMounted(async () => {
        await imageLoader.loadTranslations();
        await imageLoader.fetchCharacterData();
        await faceDetection.loadOpenCV();
        setTimeout(() => faceDetection.initFaceDetector(), 1000);
    });

    return {
        ...imageLoader,
        ...diffProcessor,
        ...selection,
        ...canvasOps,
        ...faceDetection,
    };
}
