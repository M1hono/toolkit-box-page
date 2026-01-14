/**
 * @fileoverview FGO Selection Composable
 * @description Handles canvas selection with drag and resize functionality
 */

import { ref, computed } from 'vue';
import type { Point, SelectionRect } from '../types';

const EDGE_THRESHOLD = 10;

export function useFgoSelection() {
    const selectionStart = ref<Point>({ x: 0, y: 0 });
    const selectionEnd = ref<Point>({ x: 256, y: 256 });
    const isSelecting = ref(false);
    const isResizing = ref(false);
    const resizeDirection = ref("");
    const currentAspectRatio = ref("custom");

    const selection = computed<SelectionRect>(() => ({
        x: Math.min(selectionStart.value.x, selectionEnd.value.x),
        y: Math.min(selectionStart.value.y, selectionEnd.value.y),
        width: Math.abs(selectionEnd.value.x - selectionStart.value.x),
        height: Math.abs(selectionEnd.value.y - selectionStart.value.y)
    }));

    function getResizeDirection(x: number, y: number): string {
        const sel = selection.value;
        const left = sel.x;
        const right = sel.x + sel.width;
        const top = sel.y;
        const bottom = sel.y + sel.height;

        if (Math.abs(x - left) <= EDGE_THRESHOLD && Math.abs(y - top) <= EDGE_THRESHOLD) return "nw";
        if (Math.abs(x - right) <= EDGE_THRESHOLD && Math.abs(y - top) <= EDGE_THRESHOLD) return "ne";
        if (Math.abs(x - left) <= EDGE_THRESHOLD && Math.abs(y - bottom) <= EDGE_THRESHOLD) return "sw";
        if (Math.abs(x - right) <= EDGE_THRESHOLD && Math.abs(y - bottom) <= EDGE_THRESHOLD) return "se";
        if (Math.abs(x - left) <= EDGE_THRESHOLD && y >= top && y <= bottom) return "w";
        if (Math.abs(x - right) <= EDGE_THRESHOLD && y >= top && y <= bottom) return "e";
        if (Math.abs(y - top) <= EDGE_THRESHOLD && x >= left && x <= right) return "n";
        if (Math.abs(y - bottom) <= EDGE_THRESHOLD && x >= left && x <= right) return "s";

        return "";
    }

    function startSelection(x: number, y: number) {
        const direction = getResizeDirection(x, y);

        if (direction) {
            isResizing.value = true;
            resizeDirection.value = direction;
        } else {
            isSelecting.value = true;
            selectionStart.value = { x, y };
            selectionEnd.value = { x, y };
        }
    }

    function updateSelection(x: number, y: number) {
        if (isResizing.value) {
            resizeSelection(x, y);
        } else if (isSelecting.value) {
            selectionEnd.value = { x, y };
        }

        if (currentAspectRatio.value !== "custom") {
            applyAspectRatio();
        }
    }

    function resizeSelection(x: number, y: number) {
        const currentSel = selection.value;
        let newSel = { ...currentSel };

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

        if (newSel.width < 10) newSel.width = 10;
        if (newSel.height < 10) newSel.height = 10;

        selectionStart.value = { x: newSel.x, y: newSel.y };
        selectionEnd.value = {
            x: newSel.x + newSel.width,
            y: newSel.y + newSel.height
        };
    }

    function endSelection() {
        isSelecting.value = false;
        isResizing.value = false;
        resizeDirection.value = "";
    }

    function applyAspectRatio() {
        if (currentAspectRatio.value === "custom") return;

        const [width, height] = currentAspectRatio.value.split(":").map(Number);
        const aspectRatio = width / height;
        const currentWidth = Math.abs(selectionEnd.value.x - selectionStart.value.x);
        const currentHeight = Math.abs(selectionEnd.value.y - selectionStart.value.y);

        if (currentWidth / currentHeight > aspectRatio) {
            const newWidth = currentHeight * aspectRatio;
            selectionEnd.value.x =
                selectionStart.value.x +
                (selectionEnd.value.x > selectionStart.value.x ? newWidth : -newWidth);
        } else {
            const newHeight = currentWidth / aspectRatio;
            selectionEnd.value.y =
                selectionStart.value.y +
                (selectionEnd.value.y > selectionStart.value.y ? newHeight : -newHeight);
        }
    }

    function setAspectRatio(ratio: string) {
        currentAspectRatio.value = ratio;
        if (ratio !== "custom") {
            applyAspectRatio();
        }
    }

    return {
        selectionStart,
        selectionEnd,
        selection,
        isSelecting,
        isResizing,
        resizeDirection,
        currentAspectRatio,
        getResizeDirection,
        startSelection,
        updateSelection,
        endSelection,
        setAspectRatio
    };
}
