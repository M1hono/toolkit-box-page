/**
 * @fileoverview FGO Selection Composable
 * @description Handles canvas selection with drag and resize functionality
 */

import { ref, computed } from "vue";
import type { Point, SelectionRect } from "../types";

const EDGE_THRESHOLD = 10;

export function useFgoSelection() {
    const selectionStart = ref<Point>({ x: 0, y: 0 });
    const selectionEnd = ref<Point>({ x: 256, y: 256 });
    const isSelecting = ref(false);
    const isResizing = ref(false);
    const resizeDirection = ref("");
    const currentAspectRatio = ref("custom");
    const tempSelection = ref<SelectionRect>({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    });

    const selection = computed<SelectionRect>(() => ({
        x: Math.min(selectionStart.value.x, selectionEnd.value.x),
        y: Math.min(selectionStart.value.y, selectionEnd.value.y),
        width: Math.abs(selectionEnd.value.x - selectionStart.value.x),
        height: Math.abs(selectionEnd.value.y - selectionStart.value.y),
    }));

    function getResizeDirection(
        x: number,
        y: number,
        sel?: SelectionRect
    ): string {
        const s = sel || selection.value;
        const left = s.x;
        const right = s.x + s.width;
        const top = s.y;
        const bottom = s.y + s.height;

        if (
            Math.abs(x - left) <= EDGE_THRESHOLD &&
            Math.abs(y - top) <= EDGE_THRESHOLD
        )
            return "nw";
        if (
            Math.abs(x - right) <= EDGE_THRESHOLD &&
            Math.abs(y - top) <= EDGE_THRESHOLD
        )
            return "ne";
        if (
            Math.abs(x - left) <= EDGE_THRESHOLD &&
            Math.abs(y - bottom) <= EDGE_THRESHOLD
        )
            return "sw";
        if (
            Math.abs(x - right) <= EDGE_THRESHOLD &&
            Math.abs(y - bottom) <= EDGE_THRESHOLD
        )
            return "se";
        if (Math.abs(x - left) <= EDGE_THRESHOLD && y >= top && y <= bottom)
            return "w";
        if (Math.abs(x - right) <= EDGE_THRESHOLD && y >= top && y <= bottom)
            return "e";
        if (Math.abs(y - top) <= EDGE_THRESHOLD && x >= left && x <= right)
            return "n";
        if (Math.abs(y - bottom) <= EDGE_THRESHOLD && x >= left && x <= right)
            return "s";

        return "";
    }

    function getCursorForDirection(direction: string): string {
        const cursorMap: Record<string, string> = {
            nw: "nw-resize",
            ne: "ne-resize",
            sw: "sw-resize",
            se: "se-resize",
            n: "n-resize",
            s: "s-resize",
            w: "w-resize",
            e: "e-resize",
            "": "crosshair",
        };
        return cursorMap[direction] || "crosshair";
    }

    function startSelection(
        x: number,
        y: number,
        currentSelection?: SelectionRect
    ) {
        const sel = currentSelection || selection.value;
        const direction = getResizeDirection(x, y, sel);

        if (direction) {
            isResizing.value = true;
            resizeDirection.value = direction;
            tempSelection.value = { ...sel };
        } else {
            isSelecting.value = true;
            selectionStart.value = { x, y };
            selectionEnd.value = { x, y };
            tempSelection.value = { x, y, width: 0, height: 0 };
        }
    }

    function updateSelection(x: number, y: number) {
        if (isSelecting.value) {
            const startX = Math.min(selectionStart.value.x, x);
            const startY = Math.min(selectionStart.value.y, y);
            const width = Math.abs(x - selectionStart.value.x);
            const height = Math.abs(y - selectionStart.value.y);

            let newSel = { x: startX, y: startY, width, height };
            if (currentAspectRatio.value !== "custom") {
                newSel = applyAspectRatioToSelection(newSel);
            }
            tempSelection.value = newSel;
            selectionEnd.value = { x, y };
        } else if (isResizing.value) {
            resizeSelection(x, y);
        }
    }

    function resizeSelection(x: number, y: number) {
        let newSel = { ...tempSelection.value };

        switch (resizeDirection.value) {
            case "nw":
                newSel.width += newSel.x - x;
                newSel.height += newSel.y - y;
                newSel.x = x;
                newSel.y = y;
                break;
            case "ne":
                newSel.width = x - newSel.x;
                newSel.height += newSel.y - y;
                newSel.y = y;
                break;
            case "sw":
                newSel.width += newSel.x - x;
                newSel.height = y - newSel.y;
                newSel.x = x;
                break;
            case "se":
                newSel.width = x - newSel.x;
                newSel.height = y - newSel.y;
                break;
            case "n":
                newSel.height += newSel.y - y;
                newSel.y = y;
                break;
            case "s":
                newSel.height = y - newSel.y;
                break;
            case "w":
                newSel.width += newSel.x - x;
                newSel.x = x;
                break;
            case "e":
                newSel.width = x - newSel.x;
                break;
        }

        newSel.width = Math.max(10, newSel.width);
        newSel.height = Math.max(10, newSel.height);

        if (currentAspectRatio.value !== "custom") {
            newSel = applyAspectRatioToSelection(newSel);
        }
        tempSelection.value = newSel;
    }

    function endSelection(): SelectionRect | null {
        if (
            (isSelecting.value || isResizing.value) &&
            tempSelection.value.width > 10 &&
            tempSelection.value.height > 10
        ) {
            const result = { ...tempSelection.value };
            selectionStart.value = { x: result.x, y: result.y };
            selectionEnd.value = {
                x: result.x + result.width,
                y: result.y + result.height,
            };
            isSelecting.value = false;
            isResizing.value = false;
            resizeDirection.value = "";
            return result;
        }
        isSelecting.value = false;
        isResizing.value = false;
        resizeDirection.value = "";
        return null;
    }

    function applyAspectRatioToSelection(sel: SelectionRect): SelectionRect {
        if (currentAspectRatio.value === "custom") return sel;

        const ratios: Record<string, number> = {
            "1:1": 1,
            "4:3": 4 / 3,
            "3:2": 3 / 2,
            "16:9": 16 / 9,
            "21:9": 21 / 9,
            "3:4": 3 / 4,
            "2:3": 2 / 3,
            "9:16": 9 / 16,
        };

        const targetRatio = ratios[currentAspectRatio.value];
        if (!targetRatio) return sel;

        const result = { ...sel };
        const currentRatio = sel.width / sel.height;

        if (currentRatio > targetRatio) {
            result.width = sel.height * targetRatio;
        } else {
            result.height = sel.width / targetRatio;
        }

        return result;
    }

    function setAspectRatio(ratio: string) {
        currentAspectRatio.value = ratio;
        if (
            ratio !== "custom" &&
            selection.value.width > 0 &&
            selection.value.height > 0
        ) {
            const newSel = applyAspectRatioToSelection(selection.value);
            selectionStart.value = { x: newSel.x, y: newSel.y };
            selectionEnd.value = {
                x: newSel.x + newSel.width,
                y: newSel.y + newSel.height,
            };
        }
    }

    return {
        selectionStart,
        selectionEnd,
        selection,
        tempSelection,
        isSelecting,
        isResizing,
        resizeDirection,
        currentAspectRatio,
        getResizeDirection,
        getCursorForDirection,
        startSelection,
        updateSelection,
        endSelection,
        setAspectRatio,
    };
}
