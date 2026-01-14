<!--
/**
 * @fileoverview Ritual Grid Component
 * @component RitualGrid
 * @description Displays the interactive ritual pattern grid with runes and reagents
 */
-->

<template>
    <v-card flat>
        <v-card-text class="pa-6">
            <div class="grid-wrapper">
                <div class="grid-container" :style="gridContainerStyle">
                    <div
                        v-for="(row, rowIndex) in gridSize"
                        :key="'row-' + rowIndex"
                        class="grid-row"
                    >
                        <div
                            v-for="(col, colIndex) in gridSize"
                            :key="'cell-' + rowIndex + '-' + colIndex"
                            class="grid-cell"
                            :class="getCellClasses(rowIndex, colIndex)"
                            :style="getCellStyle(rowIndex, colIndex)"
                            @click="handleCellClick(rowIndex, colIndex, $event)"
                            @contextmenu.prevent="
                                handleCellRightClick(rowIndex, colIndex, $event)
                            "
                        >
                            <template v-if="showRune(rowIndex, colIndex)">
                                <div
                                    class="rune-image"
                                    :class="{
                                        'with-reagent':
                                            getReagentValue(
                                                rowIndex,
                                                colIndex
                                            ) !== ' ',
                                    }"
                                >
                                    <img
                                        :src="
                                            getRuneImagePath(rowIndex, colIndex)
                                        "
                                        :alt="getRuneChar(rowIndex, colIndex)"
                                    />
                                </div>
                            </template>

                            <template
                                v-if="
                                    activeLayer === 'reagents' &&
                                    getReagentValue(rowIndex, colIndex) !== ' '
                                "
                            >
                                <span class="reagent-char">{{
                                    getReagentValue(rowIndex, colIndex)
                                }}</span>
                            </template>

                            <template
                                v-if="showReagentOverlay(rowIndex, colIndex)"
                            >
                                <span class="reagent-overlay">{{
                                    getReagentValue(rowIndex, colIndex)
                                }}</span>
                            </template>

                            <template v-if="activeLayer !== 'reagents'">
                                <span class="cell-value">
                                    {{
                                        activeLayer === "pattern"
                                            ? getPatternValue(
                                                  rowIndex,
                                                  colIndex
                                              )
                                            : getDisplayPatternValue(
                                                  rowIndex,
                                                  colIndex
                                              )
                                    }}
                                </span>
                            </template>
                        </div>
                    </div>
                </div>

                <div class="coordinate-indicators" v-if="locked">
                    <div class="row-indicators">
                        <div
                            v-for="i in gridSize"
                            :key="'row-' + i"
                            class="indicator"
                        >
                            {{ i - 1 }}
                        </div>
                    </div>
                    <div class="column-indicators">
                        <div
                            v-for="i in gridSize"
                            :key="'col-' + i"
                            class="indicator"
                        >
                            {{ i - 1 }}
                        </div>
                    </div>
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { computed } from "vue";
    import { withBase } from "vitepress";
    import type {
        LayerType,
        ShowKeysOverlay,
    } from "../../../../utils/ritualGenerator";

    const props = defineProps<{
        gridSize: number;
        locked: boolean;
        activeLayer: LayerType;
        pattern: number[][];
        displayPattern: number[][];
        reagents: string[][];
        runeAssignments: { [key: string]: number };
        runeLetters: string[];
        showKeysOverlay: ShowKeysOverlay;
    }>();

    const emit = defineEmits<{
        "cell-click": [row: number, col: number, event: MouseEvent];
        "cell-right-click": [row: number, col: number, event: MouseEvent];
    }>();

    const gridContainerStyle = computed(() => {
        const minSize = 30;
        const maxSize = 60;
        const cellSize = Math.min(
            Math.max(minSize, 600 / props.gridSize),
            maxSize
        );
        const totalSize = props.gridSize * cellSize;

        return {
            width: `${totalSize}px`,
            height: `${totalSize}px`,
            minWidth: `${props.gridSize * minSize}px`,
        };
    });

    /**
     * Gets pattern value for cell
     * @param row - Row index
     * @param col - Column index
     * @returns Pattern value
     */
    const getPatternValue = (row: number, col: number): number => {
        return props.pattern[row] ? props.pattern[row][col] : 0;
    };

    /**
     * Gets display pattern value for cell
     * @param row - Row index
     * @param col - Column index
     * @returns Display pattern value
     */
    const getDisplayPatternValue = (row: number, col: number): number => {
        return props.displayPattern[row] ? props.displayPattern[row][col] : 0;
    };

    /**
     * Gets reagent value for cell
     * @param row - Row index
     * @param col - Column index
     * @returns Reagent character
     */
    const getReagentValue = (row: number, col: number): string => {
        return props.reagents[row] ? props.reagents[row][col] : " ";
    };

    /**
     * Gets CSS classes for grid cell
     * @param row - Row index
     * @param col - Column index
     * @returns Object with CSS class names
     */
    const getCellClasses = (row: number, col: number) => {
        return {
            "cell-active": getCellActive(row, col),
            "cell-inactive": !getCellActive(row, col),
            "cell-special": getCellSpecial(row, col),
            "cell-with-reagent": getReagentValue(row, col) !== " ",
            "cell-center":
                row === Math.floor(props.gridSize / 2) &&
                col === Math.floor(props.gridSize / 2),
        };
    };

    /**
     * Determines if cell is active
     * @param row - Row index
     * @param col - Column index
     * @returns Whether cell is active
     */
    const getCellActive = (row: number, col: number): boolean => {
        if (props.activeLayer === "pattern") {
            return getPatternValue(row, col) !== 0;
        } else if (props.activeLayer === "displayPattern") {
            return getDisplayPatternValue(row, col) !== 0;
        } else {
            return getPatternValue(row, col) !== 0;
        }
    };

    /**
     * Determines if cell is special (value > 1)
     * @param row - Row index
     * @param col - Column index
     * @returns Whether cell is special
     */
    const getCellSpecial = (row: number, col: number): boolean => {
        if (props.activeLayer === "pattern") {
            return getPatternValue(row, col) > 1;
        } else if (props.activeLayer === "displayPattern") {
            return getDisplayPatternValue(row, col) > 1;
        }
        return false;
    };

    /**
     * Gets cell styling
     * @param row - Row index
     * @param col - Column index
     * @returns Style object
     */
    const getCellStyle = (row: number, col: number) => {
        const minSize = 30;
        const maxSize = 60;
        const cellSize = Math.min(
            Math.max(minSize, 600 / props.gridSize),
            maxSize
        );

        return {
            width: `${cellSize}px`,
            height: `${cellSize}px`,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${Math.max(8, Math.min(14, 18 - props.gridSize / 2))}px`,
        };
    };

    /**
     * Determines if reagent overlay should be shown
     * @param row - Row index
     * @param col - Column index
     * @returns Whether to show overlay
     */
    const showReagentOverlay = (row: number, col: number): boolean => {
        const showOverlay =
            (props.activeLayer === "pattern" &&
                props.showKeysOverlay.pattern) ||
            (props.activeLayer === "displayPattern" &&
                props.showKeysOverlay.displayPattern);
        const hasReagent = getReagentValue(row, col) !== " ";

        return showOverlay && hasReagent && props.activeLayer !== "reagents";
    };

    /**
     * Determines if rune should be shown
     * @param row - Row index
     * @param col - Column index
     * @returns Whether to show rune
     */
    const showRune = (row: number, col: number): boolean => {
        return (
            props.activeLayer === "pattern" &&
            getPatternValue(row, col) !== 0 &&
            props.runeAssignments[`${row}-${col}`] !== undefined
        );
    };

    /**
     * Gets rune character for cell
     * @param row - Row index
     * @param col - Column index
     * @returns Rune character
     */
    const getRuneChar = (row: number, col: number): string => {
        const runeIndex = props.runeAssignments[`${row}-${col}`];
        return props.runeLetters[runeIndex] || "a";
    };

    /**
     * Gets rune image path
     * @param row - Row index
     * @param col - Column index
     * @returns Image path
     */
    const getRuneImagePath = (row: number, col: number): string => {
        const runeChar = getRuneChar(row, col);
        const hasReagent = getReagentValue(row, col) !== " ";

        if (hasReagent) {
            return withBase(`/runes/chalk_rune_${runeChar}_active.png`);
        } else {
            return withBase(`/runes/chalk_rune_${runeChar}.png`);
        }
    };

    /**
     * Handles cell click
     * @param row - Row index
     * @param col - Column index
     * @param event - Mouse event
     */
    const handleCellClick = (row: number, col: number, event: MouseEvent) => {
        emit("cell-click", row, col, event);
    };

    /**
     * Handles cell right click
     * @param row - Row index
     * @param col - Column index
     * @param event - Mouse event
     */
    const handleCellRightClick = (
        row: number,
        col: number,
        event: MouseEvent
    ) => {
        emit("cell-right-click", row, col, event);
    };
</script>

<style scoped>
    .grid-wrapper {
        display: flex;
        justify-content: center;
        padding: 35px;
        background-color: #34495e;
        border-radius: 12px;
        position: relative;
        margin-bottom: 20px;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .grid-container {
        display: flex;
        flex-direction: column;
        margin: 0 auto;
        position: relative;
        z-index: 1;
    }

    .grid-row {
        display: flex;
    }

    .grid-cell {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-sizing: border-box;
        transition: all 0.2s ease;
        overflow: hidden;
        cursor: pointer;
        background-color: #2c3e50;
    }

    .grid-cell.cell-active {
        background-color: #f1c40f !important;
        box-shadow: 0 0 8px rgba(241, 196, 15, 0.4);
    }

    .grid-cell.cell-special {
        background-color: #2ecc71 !important;
        box-shadow: 0 0 8px rgba(46, 204, 113, 0.4);
    }

    .grid-cell.cell-center {
        border: 2px solid rgba(255, 255, 255, 0.7);
        box-shadow: 0 0 12px rgba(255, 255, 255, 0.3);
    }

    .grid-cell:hover {
        transform: scale(1.05);
        z-index: 2;
        box-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
    }

    /* Dark mode adjustments */
    :root.dark .grid-wrapper {
        background-color: #4a5568;
    }

    :root.dark .grid-cell {
        background-color: #2d3748;
        border-color: rgba(255, 255, 255, 0.2);
    }

    .cell-value {
        position: absolute;
        top: 2px;
        left: 2px;
        font-size: 0.7em;
        color: #fff;
        background-color: rgba(0, 0, 0, 0.4);
        padding: 1px 3px;
        border-radius: 3px;
        z-index: 2;
    }

    .reagent-char {
        font-size: 1.2em;
        font-weight: bold;
        color: white;
        text-shadow: 0 0 3px rgba(0, 0, 0, 0.7);
        z-index: 2;
    }

    .reagent-overlay {
        position: absolute;
        bottom: 2px;
        right: 2px;
        font-size: 0.7em;
        color: #fff;
        background-color: rgba(0, 0, 0, 0.6);
        padding: 1px 4px;
        border-radius: 3px;
        z-index: 2;
    }

    .rune-image {
        width: 92%;
        height: 92%;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1;
        transition: all 0.2s ease;
    }

    .rune-image img {
        max-width: 94%;
        max-height: 94%;
        filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.5));
        transform: scale(2.2);
    }

    .rune-image.with-reagent img {
        filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.9));
        transform: scale(2.2);
    }

    .coordinate-indicators {
        position: absolute;
        pointer-events: none;
    }

    .row-indicators {
        position: absolute;
        left: 5px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        height: 90%;
    }

    .column-indicators {
        position: absolute;
        top: 5px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        justify-content: space-around;
        width: 90%;
    }

    .indicator {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.8em;
        font-family: "Courier New", monospace;
    }
</style>
