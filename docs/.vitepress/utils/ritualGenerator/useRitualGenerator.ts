/**
 * @fileoverview Main composable for Ritual Generator state and logic
 * @description Manages ritual patterns, validation, and code generation
 */

import { reactive, computed, nextTick } from "vue";
import type {
    RitualState,
    RitualPattern,
    RitualKeyConfig,
    ShowKeysOverlay,
} from "../types";

/**
 * Main composable for Ritual Generator functionality
 * @returns Object containing state, computed values, and methods
 */
export function useRitualGenerator() {
    const state = reactive<RitualState>({
        gridSize: 3,
        maxGridSize: 11,
        locked: false,
        activeLayer: "pattern",
        pattern: [],
        displayPattern: [],
        reagents: [],
        keys: {},
        parameters: {
            tier: 1,
            innerColor: "0xffffff",
            outerColor: "0x00ff00",
            beamColor: "0xffffff",
            connectBeam: true,
            displayIndexes: true,
            kittable: true,
            createsItem: "",
        },
        manaweavePatterns: [],
        command: "",
        runeAssignments: {},
        outputFormat: "json",
        isValid: false,
    });

    const showKeysOverlay = reactive<ShowKeysOverlay>({
        pattern: true,
        displayPattern: false,
        reagents: true,
    });

    const runeLetters = [
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
    ];

    const gridContainerStyle = computed(() => {
        const minSize = 30;
        const maxSize = 60;
        const cellSize = Math.min(
            Math.max(minSize, 600 / state.gridSize),
            maxSize
        );
        const totalSize = state.gridSize * cellSize;

        return {
            width: `${totalSize}px`,
            height: `${totalSize}px`,
            minWidth: `${state.gridSize * minSize}px`,
        };
    });

    const jsonPreview = computed(() => {
        if (!state.locked) return "";
        return generateJson();
    });

    const kjsCode = computed(() => {
        if (!state.locked) return "";
        return generateKjsCode();
    });

    /**
     * Initializes grid arrays based on current grid size
     */
    const initializeGrids = () => {
        state.pattern = Array(state.gridSize)
            .fill(null)
            .map(() => Array(state.gridSize).fill(0));

        state.displayPattern = Array(state.gridSize)
            .fill(null)
            .map(() => Array(state.gridSize).fill(0));

        state.reagents = Array(state.gridSize)
            .fill(null)
            .map(() => Array(state.gridSize).fill(" "));

        if (typeof document !== "undefined") {
            document.documentElement.style.setProperty(
                "--grid-size",
                state.gridSize.toString()
            );
        }

        state.keys = {};
        generateRandomRunes();
    };

    /**
     * Generates random rune assignments for active pattern cells
     */
    const generateRandomRunes = () => {
        const newAssignments: { [key: string]: number } = {};
        for (let i = 0; i < state.gridSize; i++) {
            for (let j = 0; j < state.gridSize; j++) {
                if (state.pattern[i][j] !== 0) {
                    newAssignments[`${i}-${j}`] = Math.floor(
                        Math.random() * runeLetters.length
                    );
                }
            }
        }
        state.runeAssignments = newAssignments;
    };

    /**
     * Validates the current ritual configuration
     */
    const validateForm = () => {
        let valid = true;

        let hasNonZero = false;
        for (let i = 0; i < state.gridSize; i++) {
            for (let j = 0; j < state.gridSize; j++) {
                if (state.pattern[i][j] !== 0) {
                    hasNonZero = true;
                    break;
                }
            }
            if (hasNonZero) break;
        }
        if (!hasNonZero) valid = false;

        for (const key in state.keys) {
            if (!state.keys[key].item) {
                valid = false;
                break;
            }
        }

        state.isValid = valid;
    };

    /**
     * Generates JSON output for the ritual
     * @returns Formatted JSON string
     */
    const generateJson = (): string => {
        const json: any = {
            type: "mna:ritual",
            tier: state.parameters.tier,
        };

        const formattedPattern = [];
        for (let i = 0; i < state.gridSize; i++) {
            formattedPattern.push(state.pattern[i].join(", "));
        }
        json.pattern = formattedPattern;

        if (!isDisplayPatternSameAsPattern()) {
            const formattedDisplayPattern = [];
            for (let i = 0; i < state.gridSize; i++) {
                formattedDisplayPattern.push(
                    state.displayPattern[i].join(", ")
                );
            }
            json.displayPattern = formattedDisplayPattern;
        }

        const reagentStrings = state.reagents.map((row) => row.join(""));
        json.reagents = reagentStrings;

        const formattedKeys: { [key: string]: any } = {};
        Object.keys(state.keys).forEach((key) => {
            if (state.keys[key].item) {
                const keyObj: any = { item: state.keys[key].item };
                if (state.keys[key].optional) keyObj.optional = true;
                if (!state.keys[key].consume) keyObj.consume = false;
                if (state.keys[key].is_dynamic) keyObj.is_dynamic = true;
                if (state.keys[key].dynamic_source)
                    keyObj.dynamic_source = true;
                if (state.keys[key].manual_return) keyObj.manual_return = true;
                formattedKeys[key] = keyObj;
            }
        });
        json.keys = formattedKeys;

        const params: any = {};
        if (state.parameters.innerColor !== "0xffffff")
            params.innerColor = state.parameters.innerColor;
        if (state.parameters.outerColor !== "0x00ff00")
            params.outerColor = state.parameters.outerColor;
        if (state.parameters.beamColor !== "0xffffff")
            params.beamColor = state.parameters.beamColor;
        if (!state.parameters.connectBeam) params.connectBeam = false;
        if (!state.parameters.displayIndexes) params.displayIndexes = false;
        if (!state.parameters.kittable) params.kittable = false;

        if (Object.keys(params).length > 0) {
            json.parameters = params;
        }

        if (state.manaweavePatterns.length > 0) {
            json.manaweave = state.manaweavePatterns;
        }

        if (state.command) {
            json.command = state.command;
        }

        return customStringify(json);
    };

    /**
     * Generates KubeJS code for the ritual
     * @returns KubeJS code string
     */
    const generateKjsCode = (): string => {
        let hasValidPattern = false;
        for (let i = 0; i < state.gridSize && !hasValidPattern; i++) {
            for (let j = 0; j < state.gridSize; j++) {
                if (state.pattern[i][j] !== 0) {
                    hasValidPattern = true;
                    break;
                }
            }
        }

        if (!hasValidPattern) {
            return "// Invalid pattern: At least one non-zero value is required";
        }

        let code = "event.recipes.mna.ritual(\n";

        code += "    [";
        for (let i = 0; i < state.gridSize; i++) {
            if (i === 0) {
                code += "[" + state.pattern[i].join(", ") + "]";
            } else {
                code += ",\n        [" + state.pattern[i].join(", ") + "]";
            }
        }
        code += "],";

        code += "\n    [";
        const reagentStrings = state.reagents.map((row) => row.join(""));
        for (let i = 0; i < reagentStrings.length; i++) {
            if (i === 0) {
                code += '"' + reagentStrings[i] + '"';
            } else {
                code += ',\n        "' + reagentStrings[i] + '"';
            }
        }
        code += "],";

        code += "\n    {";
        Object.keys(state.keys).forEach((key, index, array) => {
            code += ` ${key} : {`;
            code += `\n        item : "${state.keys[key].item}"`;
            if (state.keys[key].optional) code += ",\n        optional : true";
            if (!state.keys[key].consume) code += ",\n        consume : false";
            if (state.keys[key].is_dynamic)
                code += ",\n        is_dynamic : true";
            if (state.keys[key].dynamic_source)
                code += ",\n        dynamic_source : true";
            if (state.keys[key].manual_return)
                code += ",\n        manual_return : true";
            code += "\n    }";
            if (index < array.length - 1) code += ",";
        });
        code += " }";

        if (!isDisplayPatternSameAsPattern()) {
            code += ",\n    [";
            for (let i = 0; i < state.gridSize; i++) {
                if (i === 0) {
                    code += "[" + state.displayPattern[i].join(", ") + "]";
                } else {
                    code +=
                        ",\n        [" +
                        state.displayPattern[i].join(", ") +
                        "]";
                }
            }
            code += "]";
        }

        code += `,\n    ${state.parameters.tier}`;
        code += ',\n    "mna:none"';
        code += `,\n    ${state.parameters.createsItem}`;

        if (state.manaweavePatterns.length > 0) {
            code += ",\n    [\n";
            state.manaweavePatterns.forEach((pattern, index) => {
                code += `        "${pattern}"`;
                if (index < state.manaweavePatterns.length - 1) {
                    code += ",\n";
                }
            });
            code += "\n    ]";
        } else {
            code += ",\n    []";
        }

        code += `,\n    "${state.parameters.innerColor}"`;
        code += `,\n    "${state.parameters.outerColor}"`;
        code += `,\n    "${state.parameters.beamColor}"`;
        code += `,\n    ${state.parameters.connectBeam}`;
        code += `,\n    ${state.parameters.displayIndexes}`;
        code += `,\n    ${state.parameters.kittable}`;

        if (state.command) {
            code += `,\n    "${state.command}"`;
        }

        code += "\n)";

        return code;
    };

    /**
     * Checks if display pattern is same as main pattern
     * @returns Boolean indicating if patterns match
     */
    const isDisplayPatternSameAsPattern = (): boolean => {
        for (let i = 0; i < state.gridSize; i++) {
            for (let j = 0; j < state.gridSize; j++) {
                if (state.pattern[i][j] !== state.displayPattern[i][j]) {
                    return false;
                }
            }
        }
        return true;
    };

    /**
     * Custom JSON stringifier with formatted arrays
     * @param obj - Object to stringify
     * @returns Formatted JSON string
     */
    const customStringify = (obj: any): string => {
        const formatJson = (obj: any, indent = 0): string => {
            const indentStr = " ".repeat(indent);

            if (Array.isArray(obj)) {
                if (typeof obj[0] === "string" && obj[0].includes(",")) {
                    let result = "[\n";
                    obj.forEach((row, index) => {
                        result += `${indentStr}  [${row}]${
                            index < obj.length - 1 ? "," : ""
                        }\n`;
                    });
                    result += `${indentStr}]`;
                    return result;
                } else {
                    return JSON.stringify(obj, null, 2)
                        .split("\n")
                        .map((line) => indentStr + line)
                        .join("\n");
                }
            } else if (typeof obj === "object" && obj !== null) {
                let result = "{\n";
                const keys = Object.keys(obj);
                keys.forEach((key, index) => {
                    const value = obj[key];
                    result += `${indentStr}  "${key}": `;

                    if (key === "pattern" || key === "displayPattern") {
                        result += formatJson(value, indent + 2);
                    } else if (typeof value === "object" && value !== null) {
                        result += formatJson(value, indent + 2);
                    } else {
                        result += JSON.stringify(value);
                    }

                    if (index < keys.length - 1) {
                        result += ",";
                    }
                    result += "\n";
                });
                result += `${indentStr}}`;
                return result;
            } else {
                return JSON.stringify(obj);
            }
        };

        return formatJson(obj);
    };

    return {
        state,
        showKeysOverlay,
        runeLetters,
        gridContainerStyle,
        jsonPreview,
        kjsCode,
        initializeGrids,
        generateRandomRunes,
        validateForm,
        generateJson,
        generateKjsCode,
        isDisplayPatternSameAsPattern,
        customStringify,
    };
}
