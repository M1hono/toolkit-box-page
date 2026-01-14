<template>
    <v-card flat>
        <v-card-text class="pa-6">
            <div class="canvas-wrapper d-flex justify-center">
                <canvas
                    ref="canvas"
                    class="editor-canvas"
                    width="450"
                    height="450"
                    @click="handleClick"
                    @mousemove="handleMouseMove"
                ></canvas>
            </div>

            <div class="canvas-controls mt-4">
                <v-alert
                    type="info"
                    variant="tonal"
                    class="mb-4"
                    :text="t.instructions"
                ></v-alert>

                <div class="sensitivity-control">
                    <v-row align="center">
                        <v-col cols="6">
                            <span class="text-body-2">
                                {{ t.clickTolerance }}: {{ clickTolerance }}
                            </span>
                        </v-col>
                        <v-col cols="6">
                            <v-slider
                                v-model="clickTolerance"
                                :min="5"
                                :max="20"
                                :step="1"
                                @input="redrawGrid"
                                thumb-label
                                density="compact"
                            ></v-slider>
                        </v-col>
                    </v-row>
                </div>

                <div v-if="showDebug" class="debug-info mt-4">
                    <v-sheet class="pa-3" rounded>
                        <pre class="text-caption">{{ debugText }}</pre>
                    </v-sheet>
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { ref, onMounted, computed, watch } from "vue";
    import { useSafeI18n } from "../../../../utils/i18n/locale";
    import type {
        CanvasState,
        CanvasConstants,
        LineHighlight,
        RuneValues,
    } from "../../../../utils/runescribing";

    const { t } = useSafeI18n("rune-canvas", {
        instructions: "Click on the lines to toggle them on/off.",
        clickTolerance: "Click Tolerance",
    });

    const props = defineProps<{
        canvasState: CanvasState;
        constants: CanvasConstants;
        values: RuneValues;
    }>();

    const emit = defineEmits<{
        "update:canvas-state": [state: CanvasState];
        "update:values": [values: RuneValues];
    }>();

    const canvas = ref<HTMLCanvasElement | null>(null);
    const ctx = ref<CanvasRenderingContext2D | null>(null);
    const showDebug = ref(false);
    const clickTolerance = ref(12);

    const debugText = computed(() => {
        return `Horizontal Lines: ${JSON.stringify(props.canvasState.hLines)}
Vertical Lines: ${JSON.stringify(props.canvasState.vLines)}
Current Highlight: ${JSON.stringify(props.canvasState.currentHighlight)}
Horizontal Value: ${props.values.hValue}
Vertical Value: ${props.values.vValue}`;
    });

    onMounted(() => {
        if (canvas.value) {
            ctx.value = canvas.value.getContext("2d");
            redrawGrid();
        }

        window.addEventListener("resize", redrawGrid);
    });

    watch(() => props.canvasState, redrawGrid, { deep: true });
    watch(clickTolerance, redrawGrid);

    function redrawGrid() {
        if (!ctx.value) return;

        const { canvasWidth, canvasHeight, rows, cols, cellWidth, cellHeight } =
            props.constants;

        ctx.value.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.value.strokeStyle = "#444444";
        ctx.value.lineWidth = 1;

        // Draw vertical grid lines
        for (let i = 0; i <= cols; i++) {
            const x = i * cellWidth;
            ctx.value.beginPath();
            ctx.value.moveTo(x, 0);
            ctx.value.lineTo(x, canvasHeight);
            ctx.value.stroke();
        }

        // Draw horizontal grid lines
        for (let i = 0; i <= rows; i++) {
            const y = i * cellHeight;
            ctx.value.beginPath();
            ctx.value.moveTo(0, y);
            ctx.value.lineTo(canvasWidth, y);
            ctx.value.stroke();
        }

        // Draw horizontal lines
        for (let r = 0; r <= rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (props.canvasState.hLines[r][c] === true) {
                    drawHorizontalLine(r, c, "#00AA00", 3);
                } else if (props.canvasState.hLines[r][c] === false) {
                    drawHorizontalLine(r, c, "#555555", 1);
                }
            }
        }

        // Draw vertical lines
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c <= cols; c++) {
                if (props.canvasState.vLines[r][c] === true) {
                    drawVerticalLine(r, c, "#00AA00", 3);
                } else if (props.canvasState.vLines[r][c] === false) {
                    drawVerticalLine(r, c, "#555555", 1);
                }
            }
        }

        // Draw highlighted line
        if (props.canvasState.currentHighlight) {
            const highlight = props.canvasState.currentHighlight;
            if (highlight.type === "h") {
                drawHorizontalLine(highlight.row, highlight.col, "#FFAA00", 3);
            } else {
                drawVerticalLine(highlight.row, highlight.col, "#FFAA00", 3);
            }
        }
    }

    function drawHorizontalLine(
        row: number,
        col: number,
        color: string,
        width: number
    ) {
        if (!ctx.value) return;

        let finalColor = color;
        if (color === "#FFAA00") {
            finalColor =
                getComputedStyle(document.documentElement)
                    .getPropertyValue("--highlight-color")
                    .trim() || "#FFAA00";
        }

        const { cellWidth, cellHeight } = props.constants;
        ctx.value.strokeStyle = finalColor;
        ctx.value.lineWidth = width;
        const x1 = col * cellWidth;
        const x2 = (col + 1) * cellWidth;
        const y = row * cellHeight;
        ctx.value.beginPath();
        ctx.value.moveTo(x1, y);
        ctx.value.lineTo(x2, y);
        ctx.value.stroke();
    }

    function drawVerticalLine(
        row: number,
        col: number,
        color: string,
        width: number
    ) {
        if (!ctx.value) return;

        let finalColor = color;
        if (color === "#FFAA00") {
            finalColor =
                getComputedStyle(document.documentElement)
                    .getPropertyValue("--highlight-color")
                    .trim() || "#FFAA00";
        }

        const { cellWidth, cellHeight } = props.constants;
        ctx.value.strokeStyle = finalColor;
        ctx.value.lineWidth = width;
        const x = col * cellWidth;
        const y1 = row * cellHeight;
        const y2 = (row + 1) * cellHeight;
        ctx.value.beginPath();
        ctx.value.moveTo(x, y1);
        ctx.value.lineTo(x, y2);
        ctx.value.stroke();
    }

    function handleClick(event: MouseEvent) {
        if (!canvas.value) return;

        const rect = canvas.value.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const hitLine = findClosestLine(x, y);
        if (!hitLine) return;

        const newState = { ...props.canvasState };

        if (hitLine.type === "h") {
            const { row, col } = hitLine;
            if (newState.hLines[row][col] !== null) {
                newState.hLines[row][col] = !newState.hLines[row][col];
            }
        } else {
            const { row, col } = hitLine;
            if (newState.vLines[row][col] !== null) {
                newState.vLines[row][col] = !newState.vLines[row][col];
            }
        }

        emit("update:canvas-state", newState);

        const newValues = calculateValues(newState);
        emit("update:values", newValues);
    }

    function handleMouseMove(event: MouseEvent) {
        if (!canvas.value) return;

        const rect = canvas.value.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const hitLine = findClosestLine(x, y);

        if (
            !hitLine ||
            (props.canvasState.currentHighlight &&
                hitLine.type === props.canvasState.currentHighlight.type &&
                hitLine.row === props.canvasState.currentHighlight.row &&
                hitLine.col === props.canvasState.currentHighlight.col)
        ) {
            return;
        }

        const newState = { ...props.canvasState, currentHighlight: hitLine };
        emit("update:canvas-state", newState);
    }

    function findClosestLine(x: number, y: number): LineHighlight | null {
        if (!canvas.value) return null;

        let closestLine: LineHighlight | null = null;
        let minDistance = clickTolerance.value;

        const canvasRect = canvas.value.getBoundingClientRect();
        const scaleX = canvas.value.width / canvasRect.width;
        const scaleY = canvas.value.height / canvasRect.height;

        const scaledX = x * scaleX;
        const scaledY = y * scaleY;

        const { rows, cols, cellWidth, cellHeight } = props.constants;

        // Check horizontal lines
        for (let r = 0; r <= rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (props.canvasState.hLines[r][c] === null) continue;

                const lineY = r * cellHeight;
                const lineX1 = c * cellWidth;
                const lineX2 = (c + 1) * cellWidth;

                if (scaledX >= lineX1 && scaledX <= lineX2) {
                    const distance = Math.abs(scaledY - lineY);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestLine = { type: "h", row: r, col: c };
                    }
                }
            }
        }

        // Check vertical lines
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c <= cols; c++) {
                if (props.canvasState.vLines[r][c] === null) continue;

                const lineX = c * cellWidth;
                const lineY1 = r * cellHeight;
                const lineY2 = (r + 1) * cellHeight;

                if (scaledY >= lineY1 && scaledY <= lineY2) {
                    const distance = Math.abs(scaledX - lineX);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestLine = { type: "v", row: r, col: c };
                    }
                }
            }
        }

        return closestLine;
    }

    function calculateValues(state: CanvasState): RuneValues {
        const { rows, cols } = props.constants;

        // Calculate horizontal value
        let hValue = 0n;
        let bitPosition = 0n;
        for (let r = 1; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (state.hLines[r][c] === true) {
                    hValue |= 1n << bitPosition;
                }
                bitPosition += 1n;
            }
        }

        // Calculate vertical value
        let vValue = 0n;
        bitPosition = 0n;
        for (let r = 0; r < rows; r++) {
            for (let c = 1; c < cols; c++) {
                if (state.vLines[r][c] === true) {
                    vValue |= 1n << bitPosition;
                }
                bitPosition += 1n;
            }
        }

        return { hValue, vValue };
    }

    function clearGrid() {
        const { rows, cols } = props.constants;
        const newState = { ...props.canvasState };

        for (let r = 0; r <= rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (newState.hLines[r][c] !== null) {
                    newState.hLines[r][c] = false;
                }
            }
        }

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c <= cols; c++) {
                if (newState.vLines[r][c] !== null) {
                    newState.vLines[r][c] = false;
                }
            }
        }

        emit("update:canvas-state", newState);

        const newValues = calculateValues(newState);
        emit("update:values", newValues);
    }

    function fillGrid() {
        const { rows, cols } = props.constants;
        const newState = { ...props.canvasState };

        for (let r = 0; r <= rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (newState.hLines[r][c] !== null) {
                    newState.hLines[r][c] = true;
                }
            }
        }

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c <= cols; c++) {
                if (newState.vLines[r][c] !== null) {
                    newState.vLines[r][c] = true;
                }
            }
        }

        emit("update:canvas-state", newState);

        const newValues = calculateValues(newState);
        emit("update:values", newValues);
    }

    defineExpose({
        clearGrid,
        fillGrid,
    });
</script>

<style scoped>
    .editor-canvas {
        background-color: #ffffff;
        border-radius: 12px;
        cursor: pointer;
        border: 2px solid #e0e0e0;
        box-shadow: none;
    }

    .canvas-wrapper {
        background-color: #f5f5f5;
        padding: 20px;
        border-radius: 12px;
        border: 1px solid #e0e0e0;
    }

    :root.dark .canvas-wrapper {
        background-color: #2d3748;
    }

    :root.dark .editor-canvas {
        background-color: #1a1a1a;
        border-color: #4a5568;
    }
</style>
