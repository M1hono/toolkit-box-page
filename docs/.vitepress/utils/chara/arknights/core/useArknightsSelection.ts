/**
 * @fileoverview Arknights Selection Composable
 * @description Handles canvas selection with draggable edges and corners with aspect ratio constraints
 */

import { ref } from 'vue';
import type { SelectionRect } from '../types';

const EDGE_THRESHOLD = 10;

export function useArknightsSelection() {
    const isSelecting = ref(false);
    const isResizing = ref(false);
    const resizeDirection = ref("");
    const selectionStart = ref({ x: 0, y: 0 });
    const tempSelection = ref<SelectionRect>({ x: 0, y: 0, width: 0, height: 0 });

    function getResizeDirection(x: number, y: number, selection: SelectionRect): string {
        const left = selection.x;
        const right = selection.x + selection.width;
        const top = selection.y;
        const bottom = selection.y + selection.height;

        if (Math.abs(x - left) <= EDGE_THRESHOLD && Math.abs(y - top) <= EDGE_THRESHOLD) return 'nw';
        if (Math.abs(x - right) <= EDGE_THRESHOLD && Math.abs(y - top) <= EDGE_THRESHOLD) return 'ne';
        if (Math.abs(x - left) <= EDGE_THRESHOLD && Math.abs(y - bottom) <= EDGE_THRESHOLD) return 'sw';
        if (Math.abs(x - right) <= EDGE_THRESHOLD && Math.abs(y - bottom) <= EDGE_THRESHOLD) return 'se';
        if (Math.abs(x - left) <= EDGE_THRESHOLD && y >= top && y <= bottom) return 'w';
        if (Math.abs(x - right) <= EDGE_THRESHOLD && y >= top && y <= bottom) return 'e';
        if (Math.abs(y - top) <= EDGE_THRESHOLD && x >= left && x <= right) return 'n';
        if (Math.abs(y - bottom) <= EDGE_THRESHOLD && x >= left && x <= right) return 's';
        return '';
    }

    function getCursorForDirection(direction: string): string {
        const cursorMap: Record<string, string> = {
            'nw': 'nw-resize', 'ne': 'ne-resize', 'sw': 'sw-resize', 'se': 'se-resize',
            'n': 'n-resize', 's': 's-resize', 'w': 'w-resize', 'e': 'e-resize', '': 'crosshair'
        };
        return cursorMap[direction] || 'crosshair';
    }

    function applyAspectRatio(selection: SelectionRect, aspectRatio: string): SelectionRect {
        if (aspectRatio === 'free') return selection;
        
        const ratios: Record<string, number> = {
            '1:1': 1, '4:3': 4/3, '16:9': 16/9, '3:4': 3/4, '9:16': 9/16
        };
        
        const targetRatio = ratios[aspectRatio];
        if (!targetRatio) return selection;
        
        const currentRatio = selection.width / selection.height;
        const result = { ...selection };
        
        if (currentRatio > targetRatio) {
            result.width = selection.height * targetRatio;
        } else {
            result.height = selection.width / targetRatio;
        }
        
        return result;
    }

    function startInteraction(x: number, y: number, currentSelection: SelectionRect) {
        const direction = getResizeDirection(x, y, currentSelection);
        
        if (direction) {
            isResizing.value = true;
            resizeDirection.value = direction;
            tempSelection.value = { ...currentSelection };
        } else {
            isSelecting.value = true;
            selectionStart.value = { x, y };
            tempSelection.value = { x, y, width: 0, height: 0 };
        }
    }

    function updateInteraction(x: number, y: number, aspectRatio: string) {
        if (isSelecting.value) {
            const startX = Math.min(selectionStart.value.x, x);
            const startY = Math.min(selectionStart.value.y, y);
            const width = Math.abs(x - selectionStart.value.x);
            const height = Math.abs(y - selectionStart.value.y);

            let newSel = { x: startX, y: startY, width, height };
            newSel = applyAspectRatio(newSel, aspectRatio);
            tempSelection.value = newSel;
        } else if (isResizing.value) {
            resizeCurrentSelection(x, y, aspectRatio);
        }
    }

    function resizeCurrentSelection(x: number, y: number, aspectRatio: string) {
        let newSel = { ...tempSelection.value };

        switch (resizeDirection.value) {
            case 'nw':
                newSel.width += newSel.x - x;
                newSel.height += newSel.y - y;
                newSel.x = x;
                newSel.y = y;
                break;
            case 'ne':
                newSel.width = x - newSel.x;
                newSel.height += newSel.y - y;
                newSel.y = y;
                break;
            case 'sw':
                newSel.width += newSel.x - x;
                newSel.height = y - newSel.y;
                newSel.x = x;
                break;
            case 'se':
                newSel.width = x - newSel.x;
                newSel.height = y - newSel.y;
                break;
            case 'n':
                newSel.height += newSel.y - y;
                newSel.y = y;
                break;
            case 's':
                newSel.height = y - newSel.y;
                break;
            case 'w':
                newSel.width += newSel.x - x;
                newSel.x = x;
                break;
            case 'e':
                newSel.width = x - newSel.x;
                break;
        }

        newSel.width = Math.max(10, newSel.width);
        newSel.height = Math.max(10, newSel.height);
        
        newSel = applyAspectRatio(newSel, aspectRatio);
        tempSelection.value = newSel;
    }

    function endInteraction(): SelectionRect | null {
        if ((isSelecting.value || isResizing.value) && tempSelection.value.width > 10 && tempSelection.value.height > 10) {
            const result = { ...tempSelection.value };
            isSelecting.value = false;
            isResizing.value = false;
            resizeDirection.value = '';
            return result;
        }
        isSelecting.value = false;
        isResizing.value = false;
        resizeDirection.value = '';
        return null;
    }

    return {
        isSelecting,
        isResizing,
        tempSelection,
        getResizeDirection,
        getCursorForDirection,
        startInteraction,
        updateInteraction,
        endInteraction
    };
}
