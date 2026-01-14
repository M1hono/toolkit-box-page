/**
 * @fileoverview Runescribing composable for canvas interaction logic
 * @description Manages canvas drawing, line detection, and value calculation
 */

import { ref, computed, watch, nextTick } from "vue";
import type {
    CanvasState,
    CanvasConstants,
    RuneValues,
    LineHighlight,
} from "./types";

/**
 * Composable for runescribing canvas functionality
 * @param constants - Canvas dimension constants
 * @returns Object containing canvas state and methods
 */
export function useRunescribing(constants: CanvasConstants) {
    const canvasState = ref<CanvasState>({
        hLines: [],
        vLines: [],
        currentHighlight: null,
    });

    const values = ref<RuneValues>({ hValue: 0n, vValue: 0n });

    /**
     * Initializes canvas line arrays
     */
    const initializeCanvas = () => {
        const { rows, cols } = constants;

        canvasState.value.hLines = Array(rows + 1)
            .fill(null)
            .map(() => Array(cols).fill(false));

        canvasState.value.vLines = Array(rows)
            .fill(null)
            .map(() => Array(cols + 1).fill(false));

        for (let i = 0; i < cols; i++) {
            canvasState.value.hLines[0][i] = null;
            canvasState.value.hLines[rows][i] = null;
        }

        for (let i = 0; i < rows; i++) {
            canvasState.value.vLines[i][0] = null;
            canvasState.value.vLines[i][cols] = null;
        }
    };

    /**
     * Calculates rune values from current line states
     */
    const calculateValues = () => {
        const { rows, cols } = constants;

        let hValue = 0n;
        let bitPosition = 0n;
        for (let r = 1; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (canvasState.value.hLines[r][c] === true) {
                    hValue |= 1n << bitPosition;
                }
                bitPosition += 1n;
            }
        }

        let vValue = 0n;
        bitPosition = 0n;
        for (let r = 0; r < rows; r++) {
            for (let c = 1; c < cols; c++) {
                if (canvasState.value.vLines[r][c] === true) {
                    vValue |= 1n << bitPosition;
                }
                bitPosition += 1n;
            }
        }

        values.value = { hValue, vValue };
    };

    const hDecimal = computed(() => values.value.hValue.toString());
    const vDecimal = computed(() => values.value.vValue.toString());
    const hBinary = computed(() => values.value.hValue.toString(2));
    const vBinary = computed(() => values.value.vValue.toString(2));

    watch(canvasState, calculateValues, { deep: true });

    return {
        canvasState,
        values,
        hDecimal,
        vDecimal,
        hBinary,
        vBinary,
        initializeCanvas,
        calculateValues,
    };
}
