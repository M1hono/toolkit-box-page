/**
 * @fileoverview Main composable for Ritual Generator state and logic
 * @description Manages ritual patterns, validation, and code generation
 */

import { reactive, computed } from "vue";
import { normalizeManaweavePatterns } from "../manaweavePatternEditor";
import type {
    RitualState,
    RitualKeyConfig,
    ShowKeysOverlay,
} from "./types";

const DEFAULT_INNER_COLOR = "0xffd24a";
const DEFAULT_OUTER_COLOR = "0xffd24a";
const DEFAULT_BEAM_COLOR = "0xffd24a";

/**
 * Main composable for Ritual Generator functionality
 * @returns Object containing state, computed values, and methods
 */
export function useRitualGenerator() {
    const state = reactive<RitualState>({
        gridSize: 3,
        maxGridSize: 11,
        locked: false,
        shapeOnly: false,
        activeLayer: "pattern",
        pattern: [],
        displayPattern: [],
        reagents: [],
        keys: {},
        parameters: {
            tier: 1,
            innerColor: DEFAULT_INNER_COLOR,
            outerColor: DEFAULT_OUTER_COLOR,
            beamColor: DEFAULT_BEAM_COLOR,
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
        return state.shapeOnly ? generateShapeJson() : generateJson();
    });

    const kjsCode = computed(() => {
        if (!state.locked) return "";
        return state.shapeOnly ? generateShapeKjsCode() : generateKjsCode();
    });

    const patternRows = computed(() => numericGridRowStrings(state.pattern));

    const displayPatternRows = computed(() =>
        numericGridRowStrings(state.displayPattern)
    );

    const reagentRows = computed(() => reagentRowStrings());

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
        validateForm();
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
        let valid = hasNonZeroPatternCell();

        if (state.shapeOnly) {
            state.isValid = valid;
            return;
        }

        const reagentSymbols = getUsedReagentSymbols();
        if (reagentSymbols.size === 0) {
            valid = false;
        }

        for (const symbol of Array.from(reagentSymbols)) {
            const config = state.keys[symbol];
            if (!config?.item?.trim()) {
                valid = false;
                break;
            }
        }

        if (!state.parameters.createsItem.trim()) {
            valid = false;
        }

        state.isValid = valid;
    };

    /**
     * Generates JSON output for the ritual
     * @returns Formatted JSON string
     */
    const generateJson = (): string => {
        const manaweavePatterns = normalizeManaweavePatterns(
            state.manaweavePatterns
        );
        const json: Record<string, unknown> = {
            type: "mna:ritual",
            tier: state.parameters.tier,
            pattern: cloneGrid(state.pattern),
            reagents: reagentRowStrings(),
            createsItem: state.parameters.createsItem.trim(),
        };

        if (!isDisplayPatternSameAsPattern()) {
            json.displayPattern = cloneGrid(state.displayPattern);
        }

        const formattedKeys: Record<string, Record<string, unknown>> = {};
        for (const symbol of getOrderedReagentSymbols()) {
            const config = state.keys[symbol];
            if (!config?.item?.trim()) {
                continue;
            }

            const keyObject: Record<string, unknown> = {
                item: config.item.trim(),
            };
            if (config.optional) keyObject.optional = true;
            if (!config.consume) keyObject.consume = false;
            if (config.is_dynamic) keyObject.is_dynamic = true;
            if (config.dynamic_source) keyObject.dynamic_source = true;
            if (config.manual_return) keyObject.manual_return = true;
            formattedKeys[symbol] = keyObject;
        }

        if (Object.keys(formattedKeys).length > 0) {
            json.keys = formattedKeys;
        }

        const parameters: Record<string, unknown> = {};
        if (state.parameters.innerColor !== DEFAULT_INNER_COLOR) {
            parameters.innerColor = state.parameters.innerColor;
        }
        if (state.parameters.outerColor !== DEFAULT_OUTER_COLOR) {
            parameters.outerColor = state.parameters.outerColor;
        }
        if (state.parameters.beamColor !== DEFAULT_BEAM_COLOR) {
            parameters.beamColor = state.parameters.beamColor;
        }
        if (!state.parameters.connectBeam) {
            parameters.connectBeam = false;
        }
        if (!state.parameters.displayIndexes) {
            parameters.displayIndexes = false;
        }
        if (!state.parameters.kittable) {
            parameters.kittable = false;
        }

        if (Object.keys(parameters).length > 0) {
            json.parameters = parameters;
        }

        if (manaweavePatterns.length > 0) {
            json.manaweave = manaweavePatterns;
        }

        if (state.command.trim()) {
            json.command = state.command.trim();
        }

        return customStringify(json);
    };

    const generateShapeJson = (): string => {
        const json: Record<string, unknown> = {
            pattern: cloneGrid(state.pattern),
        };

        if (!isDisplayPatternSameAsPattern()) {
            json.displayPattern = cloneGrid(state.displayPattern);
        }

        const reagentRows = reagentRowStrings();
        if (reagentRows.some((row) => row.trim().length > 0)) {
            json.reagents = reagentRows;
        }

        return customStringify(json);
    };

    /**
     * Generates KubeJS code for the ritual
     * @returns KubeJS code string
     */
    const generateKjsCode = (): string => {
        const manaweavePatterns = normalizeManaweavePatterns(
            state.manaweavePatterns
        );
        if (!hasNonZeroPatternCell()) {
            return "// Invalid ritual: pattern must contain at least one non-zero cell";
        }

        const reagentSymbols = getOrderedReagentSymbols();
        if (reagentSymbols.length === 0) {
            return "// Invalid ritual: reagentRows must reference at least one reagent symbol";
        }

        if (!state.parameters.createsItem.trim()) {
            return "// Invalid ritual: outputItem is required";
        }

        const lines: string[] = [
            "event.recipes.mna.ritual()",
            `    .tier(${state.parameters.tier})`,
            ...formatStringBlock(
                "patternRows",
                numericGridRowStrings(state.pattern)
            ),
        ];

        if (!isDisplayPatternSameAsPattern()) {
            lines.push(
                ...formatStringBlock(
                    "displayPatternRows",
                    numericGridRowStrings(state.displayPattern)
                )
            );
        }

        lines.push(...formatStringBlock("reagentRows", reagentRowStrings()));

        for (const symbol of reagentSymbols) {
            const config = state.keys[symbol];
            if (!config?.item?.trim()) {
                return `// Invalid ritual: reagent '${symbol}' is missing an item or tag binding`;
            }
            lines.push(...formatReagentLines(symbol, config));
        }

        lines.push(
            `    .outputItem(${JSON.stringify(
                state.parameters.createsItem.trim()
            )})`
        );

        if (manaweavePatterns.length > 0) {
            lines.push(
                `    .manaweavePatterns(${manaweavePatterns
                    .map((pattern) => JSON.stringify(pattern))
                    .join(", ")})`
            );
        }

        if (state.parameters.innerColor !== DEFAULT_INNER_COLOR) {
            lines.push(`    .innerColor(${state.parameters.innerColor})`);
        }
        if (state.parameters.outerColor !== DEFAULT_OUTER_COLOR) {
            lines.push(`    .outerColor(${state.parameters.outerColor})`);
        }
        if (state.parameters.beamColor !== DEFAULT_BEAM_COLOR) {
            lines.push(`    .beamColor(${state.parameters.beamColor})`);
        }
        if (!state.parameters.connectBeam) {
            lines.push("    .connectBeam(false)");
        }
        if (!state.parameters.displayIndexes) {
            lines.push("    .displayIndexes(false)");
        }
        if (!state.parameters.kittable) {
            lines.push("    .kittable(false)");
        }
        if (state.command.trim()) {
            lines.push(`    .command(${JSON.stringify(state.command.trim())})`);
        }

        return lines.join("\n");
    };

    const generateShapeKjsCode = (): string => {
        const lines: string[] = ["const ritualShape = {", "    patternRows: ["];
        numericGridRowStrings(state.pattern).forEach((row, index, rows) => {
            const suffix = index < rows.length - 1 ? "," : "";
            lines.push(`        ${JSON.stringify(row)}${suffix}`);
        });
        lines.push("    ]");

        if (!isDisplayPatternSameAsPattern()) {
            lines[lines.length - 1] += ",";
            lines.push("    displayPatternRows: [");
            numericGridRowStrings(state.displayPattern).forEach(
                (row, index, rows) => {
                    const suffix = index < rows.length - 1 ? "," : "";
                    lines.push(`        ${JSON.stringify(row)}${suffix}`);
                }
            );
            lines.push("    ]");
        }

        const reagentRows = reagentRowStrings();
        if (reagentRows.some((row) => row.trim().length > 0)) {
            lines[lines.length - 1] += ",";
            lines.push("    reagentRows: [");
            reagentRows.forEach((row, index, rows) => {
                const suffix = index < rows.length - 1 ? "," : "";
                lines.push(`        ${JSON.stringify(row)}${suffix}`);
            });
            lines.push("    ]");
        }

        lines.push("};");
        return lines.join("\n");
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

    const hasNonZeroPatternCell = (): boolean => {
        for (let i = 0; i < state.gridSize; i++) {
            for (let j = 0; j < state.gridSize; j++) {
                if (state.pattern[i][j] !== 0) {
                    return true;
                }
            }
        }
        return false;
    };

    const reagentRowStrings = (): string[] =>
        state.reagents.map((row) => row.join(""));

    const numericGridRowStrings = (grid: number[][]): string[] =>
        grid.map((row) => row.join(" "));

    const getUsedReagentSymbols = (): Set<string> => {
        const symbols = new Set<string>();
        for (const row of state.reagents) {
            for (const cell of row) {
                if (cell.trim()) {
                    symbols.add(cell);
                }
            }
        }
        return symbols;
    };

    const getOrderedReagentSymbols = (): string[] =>
        Array.from(getUsedReagentSymbols()).sort();

    const cloneGrid = (grid: number[][]): number[][] =>
        grid.map((row) => [...row]);

    const formatStringBlock = (
        methodName: string,
        rows: string[]
    ): string[] => {
        const lines = [`    .${methodName}(`];
        rows.forEach((row, index) => {
            const suffix = index < rows.length - 1 ? "," : "";
            lines.push(`        ${JSON.stringify(row)}${suffix}`);
        });
        lines.push("    )");
        return lines;
    };

    const formatReagentLines = (
        symbol: string,
        config: RitualKeyConfig
    ): string[] => {
        const lines: string[] = [];
        const item = JSON.stringify(config.item.trim());
        const symbolLiteral = `'${symbol}'`;
        const specialFlags = [
            config.is_dynamic,
            config.dynamic_source,
            config.manual_return,
        ].filter(Boolean).length;

        if (specialFlags > 1) {
            lines.push(
                `    // Review reagent '${symbol}': multiple special flags were selected; keeping the first supported chain form`
            );
        }

        const hasBaseFlagMix =
            config.optional || !config.consume;
        const hasSpecialMode =
            config.dynamic_source || config.is_dynamic || config.manual_return;

        if (hasSpecialMode && hasBaseFlagMix) {
            lines.push(
                `    // Review reagent '${symbol}': optional/consume flags are not representable together with the selected special reagent helper`
            );
        }

        if (config.dynamic_source) {
            lines.push(
                `    .dynamicSourceReagent(${symbolLiteral}, ${item})`
            );
            return lines;
        }

        if (config.is_dynamic) {
            lines.push(`    .dynamicReagent(${symbolLiteral}, ${item})`);
            return lines;
        }

        if (config.manual_return) {
            lines.push(
                `    .manualReturnReagent(${symbolLiteral}, ${item})`
            );
            return lines;
        }

        if (hasBaseFlagMix) {
            lines.push(
                `    .reagent(${symbolLiteral}, ${item}, ${config.optional}, ${config.consume})`
            );
            return lines;
        }

        lines.push(`    .reagent(${symbolLiteral}, ${item})`);
        return lines;
    };

    /**
     * Custom JSON stringifier with formatted arrays
     * @param obj - Object to stringify
     * @returns Formatted JSON string
     */
    const customStringify = (obj: unknown): string => {
        const formatJson = (value: unknown, indent = 0): string => {
            const indentStr = " ".repeat(indent);

            if (Array.isArray(value)) {
                const isNumericGrid = value.every(
                    (row) =>
                        Array.isArray(row) &&
                        row.every((cell) => typeof cell === "number")
                );
                if (isNumericGrid) {
                    let result = "[\n";
                    value.forEach((row, index) => {
                        result += `${indentStr}  [${(row as number[]).join(", ")}]${
                            index < value.length - 1 ? "," : ""
                        }\n`;
                    });
                    result += `${indentStr}]`;
                    return result;
                }

                const isStringList = value.every(
                    (entry) => typeof entry === "string"
                );
                if (isStringList) {
                    let result = "[\n";
                    value.forEach((entry, index) => {
                        result += `${indentStr}  ${JSON.stringify(entry)}${
                            index < value.length - 1 ? "," : ""
                        }\n`;
                    });
                    result += `${indentStr}]`;
                    return result;
                }

                return JSON.stringify(value, null, 2)
                    .split("\n")
                    .map((line) => indentStr + line)
                    .join("\n");
            }

            if (typeof value === "object" && value !== null) {
                let result = "{\n";
                const entries = Object.entries(value as Record<string, unknown>);
                entries.forEach(([key, entryValue], index) => {
                    result += `${indentStr}  "${key}": `;
                    result += formatJson(entryValue, indent + 2);
                    if (index < entries.length - 1) {
                        result += ",";
                    }
                    result += "\n";
                });
                result += `${indentStr}}`;
                return result;
            }

            return JSON.stringify(value);
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
        patternRows,
        displayPatternRows,
        reagentRows,
        initializeGrids,
        generateRandomRunes,
        validateForm,
        generateJson,
        generateShapeJson,
        generateKjsCode,
        generateShapeKjsCode,
        isDisplayPatternSameAsPattern,
        customStringify,
    };
}
