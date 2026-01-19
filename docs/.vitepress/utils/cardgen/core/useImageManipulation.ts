/**
 * @fileoverview Advanced Image Manipulation Composable
 * @module cardgen/image-manipulation
 * @description
 * Vue composable for handling complex image manipulation on canvas including
 * drag operations, pinch-to-zoom, rotation, and multi-touch support.
 * Optimized for both desktop and mobile interactions.
 *
 * @example
 * import { useImageManipulation } from './useImageManipulation';
 *
 * const {
 *   uploadedFiles,
 *   addFile,
 *   onMouseDown,
 *   rotateImage
 * } = useImageManipulation(canvasRef);
 *
 * @author FGO Card Generator Team
 * @version 2.0.0
 */

import { ref, type Ref } from "vue";

/**
 * Image transformation state
 * @interface ImageState
 * @property {number} x - X coordinate position on canvas
 * @property {number} y - Y coordinate position on canvas
 * @property {number} width - Rendered width in pixels
 * @property {number} height - Rendered height in pixels
 * @property {number} rotation - Rotation angle in degrees
 * @property {number} scale - Scale factor (1.0 = original size)
 */
export interface ImageState {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    scale: number;
}

/**
 * Uploaded file container with metadata
 * @interface UploadedFile
 * @property {File} file - Original file object
 * @property {HTMLImageElement} image - Loaded image element
 * @property {ImageState} state - Current transformation state
 * @property {string} id - Unique identifier for the file
 */
export interface UploadedFile {
    file: File;
    image: HTMLImageElement;
    state: ImageState;
    id: string;
    isGif?: boolean;
    gifFrames?: any[];
}

/**
 * Advanced image manipulation composable
 * @param {Ref<HTMLCanvasElement | null>} canvas - Canvas element reference
 * @returns {Object} Image manipulation functions and reactive state
 * @description
 * Provides comprehensive image manipulation capabilities including:
 * - Multi-file support with unique transform states
 * - Drag and drop positioning
 * - Scroll wheel and pinch-to-zoom scaling
 * - Rotation controls
 * - Mobile-optimized touch handling
 */
export function useImageManipulation(canvas: Ref<HTMLCanvasElement | null>) {
    const uploadedFiles = ref<UploadedFile[]>([]);
    const activeFileIndex = ref<number>(-1);
    const isDragging = ref(false);
    const isResizing = ref(false);
    const dragStart = ref({ x: 0, y: 0 });
    const initialDistance = ref(0);

    /**
     * Add new file to the collection
     * @param {File} file - File object to add
     * @returns {Promise<void>} Promise that resolves when file is processed
     * @description
     * Processes uploaded file by:
     * 1. Loading image data
     * 2. Calculating optimal initial size and position
     * 3. Creating transform state object
     * 4. Setting as active file
     */
    const addFile = async (file: File): Promise<void> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const aspectRatio = img.width / img.height;
                const maxWidth = 400;
                const maxHeight = 600;

                let width = maxWidth;
                let height = maxWidth / aspectRatio;

                if (height > maxHeight) {
                    height = maxHeight;
                    width = maxHeight * aspectRatio;
                }

                const uploadedFile: UploadedFile = {
                    file,
                    image: img,
                    state: {
                        x: (500 - width) / 2,
                        y: (850 - height) / 2,
                        width,
                        height,
                        rotation: 0,
                        scale: 1,
                    },
                    id: `${file.name}_${Date.now()}`,
                };

                uploadedFiles.value.push(uploadedFile);
                activeFileIndex.value = uploadedFiles.value.length - 1;
                resolve();
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    };

    /**
     * Convert client coordinates to canvas coordinates
     * @param {number} clientX - Client X coordinate
     * @param {number} clientY - Client Y coordinate
     * @returns {Object} Canvas coordinates
     * @property {number} x - Canvas X coordinate
     * @property {number} y - Canvas Y coordinate
     */
    const getCanvasCoordinates = (clientX: number, clientY: number) => {
        if (!canvas.value) return { x: 0, y: 0 };

        const rect = canvas.value.getBoundingClientRect();
        const scaleX = 500 / rect.width;
        const scaleY = 850 / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    };

    /**
     * Check if point intersects with active image bounds
     * @param {number} x - X coordinate to test
     * @param {number} y - Y coordinate to test
     * @returns {boolean} True if point is inside active image
     */
    const isPointInImage = (x: number, y: number): boolean => {
        if (activeFileIndex.value === -1) return false;

        const file = uploadedFiles.value[activeFileIndex.value];
        if (!file) return false;

        const { state } = file;
        return (
            x >= state.x &&
            x <= state.x + state.width &&
            y >= state.y &&
            y <= state.y + state.height
        );
    };

    /**
     * Handle mouse down events for drag initiation
     * @param {MouseEvent} event - Mouse event object
     */
    const onMouseDown = (event: MouseEvent) => {
        const coords = getCanvasCoordinates(event.clientX, event.clientY);

        if (isPointInImage(coords.x, coords.y)) {
            isDragging.value = true;
            const file = uploadedFiles.value[activeFileIndex.value];
            dragStart.value = {
                x: coords.x - file.state.x,
                y: coords.y - file.state.y,
            };
        }
    };

    /**
     * Handle mouse move events for dragging
     * @param {MouseEvent} event - Mouse event object
     */
    const onMouseMove = (event: MouseEvent) => {
        if (!isDragging.value || activeFileIndex.value === -1) return;

        const coords = getCanvasCoordinates(event.clientX, event.clientY);
        const file = uploadedFiles.value[activeFileIndex.value];

        file.state.x = coords.x - dragStart.value.x;
        file.state.y = coords.y - dragStart.value.y;
    };

    /**
     * Handle mouse up events to end drag operations
     */
    const onMouseUp = () => {
        isDragging.value = false;
        isResizing.value = false;
    };

    /**
     * Handle touch start events for mobile drag and pinch
     * @param {TouchEvent} event - Touch event object
     * @description
     * Supports two interaction modes:
     * - Single touch: Initiates drag operation
     * - Two touches: Initiates pinch-to-zoom operation
     */
    const onTouchStart = (event: TouchEvent) => {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            const coords = getCanvasCoordinates(touch.clientX, touch.clientY);

            if (isPointInImage(coords.x, coords.y)) {
                isDragging.value = true;
                const file = uploadedFiles.value[activeFileIndex.value];
                dragStart.value = {
                    x: coords.x - file.state.x,
                    y: coords.y - file.state.y,
                };
            }
        } else if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
            );
            initialDistance.value = distance;
            isResizing.value = true;
        }
    };

    /**
     * Handle touch move events for mobile interactions
     * @param {TouchEvent} event - Touch event object
     * @description
     * Processes touch movements for:
     * - Single touch: Image dragging
     * - Two touches: Pinch-to-zoom scaling
     */
    const onTouchMove = (event: TouchEvent) => {
        if (activeFileIndex.value === -1) return;

        if (event.touches.length === 1 && isDragging.value) {
            const touch = event.touches[0];
            const coords = getCanvasCoordinates(touch.clientX, touch.clientY);
            const file = uploadedFiles.value[activeFileIndex.value];

            file.state.x = coords.x - dragStart.value.x;
            file.state.y = coords.y - dragStart.value.y;
        } else if (event.touches.length === 2 && isResizing.value) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
            );

            const scaleFactor = distance / initialDistance.value;
            const file = uploadedFiles.value[activeFileIndex.value];

            const newScale = Math.max(
                0.1,
                Math.min(3, file.state.scale * scaleFactor)
            );
            file.state.scale = newScale;
            file.state.width = file.image.width * newScale * 0.5;
            file.state.height = file.image.height * newScale * 0.5;

            initialDistance.value = distance;
        }
    };

    /**
     * Handle touch end events to complete touch operations
     */
    const onTouchEnd = () => {
        isDragging.value = false;
        isResizing.value = false;
    };

    /**
     * Handle mouse wheel events for zoom control
     * @param {WheelEvent} event - Wheel event object
     * @description
     * Provides scroll-to-zoom functionality with:
     * - Configurable zoom intensity
     * - Scale limits (0.1x to 3x)
     * - Center-point preservation during zoom
     */
    const onWheel = (event: WheelEvent) => {
        if (activeFileIndex.value === -1) return;

        const file = uploadedFiles.value[activeFileIndex.value];
        const zoomIntensity = 0.1;
        const direction = event.deltaY > 0 ? -1 : 1;
        const scaleFactor = 1 + direction * zoomIntensity;

        const newScale = Math.max(
            0.1,
            Math.min(3, file.state.scale * scaleFactor)
        );
        file.state.scale = newScale;
        file.state.width = file.image.width * newScale * 0.5;
        file.state.height = file.image.height * newScale * 0.5;

        const centerX = file.state.x + file.state.width / 2;
        const centerY = file.state.y + file.state.height / 2;
        file.state.x = centerX - file.state.width / 2;
        file.state.y = centerY - file.state.height / 2;
    };

    /**
     * Rotate active image by specified degrees
     * @param {number} degrees - Rotation angle in degrees (positive = clockwise)
     * @description
     * Rotates the currently active image around its center point.
     * Rotation is cumulative and wraps at 360 degrees.
     */
    const rotateImage = (degrees: number) => {
        if (activeFileIndex.value === -1) return;

        const file = uploadedFiles.value[activeFileIndex.value];
        file.state.rotation = (file.state.rotation + degrees) % 360;
    };

    /**
     * Remove file from collection
     * @param {number} index - Index of file to remove
     * @description
     * Removes file at specified index and adjusts active selection.
     * Automatically selects previous file if current active file is removed.
     */
    const removeFile = (index: number) => {
        uploadedFiles.value.splice(index, 1);
        if (activeFileIndex.value >= uploadedFiles.value.length) {
            activeFileIndex.value = uploadedFiles.value.length - 1;
        }
    };

    /**
     * Set active file for manipulation
     * @param {number} index - Index of file to make active
     * @description
     * Changes the currently active file for manipulation operations.
     * Only the active file responds to drag, zoom, and rotation controls.
     */
    const setActiveFile = (index: number) => {
        activeFileIndex.value = index;
    };

    return {
        uploadedFiles,
        activeFileIndex,
        isDragging,
        addFile,
        onMouseDown,
        onMouseMove,
        onMouseUp,
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        onWheel,
        rotateImage,
        removeFile,
        setActiveFile,
    };
}
