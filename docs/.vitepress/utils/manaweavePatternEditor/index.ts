export type ManaweaveOutputFormat = "json" | "kjs";
export const MANAWEAVING_PATTERN_SIZE = 11;
export const DEFAULT_MANAWEAVING_TIER = 1;
export const DEFAULT_MANAWEAVING_FACTION = "mna:none";

export const normalizeManaweavePatterns = (
    patterns: readonly string[]
): string[] =>
    patterns.map((pattern) => pattern.trim()).filter((pattern) => pattern.length > 0);

export const generateManaweaveJsonPreview = (
    patterns: readonly string[]
): string => JSON.stringify(normalizeManaweavePatterns(patterns), null, 4);

export const generateManaweaveKjsPreview = (
    patterns: readonly string[]
): string => {
    const normalizedPatterns = normalizeManaweavePatterns(patterns);
    if (normalizedPatterns.length === 0) {
        return "";
    }

    const lines = ["    .manaweavePatterns("];
    normalizedPatterns.forEach((pattern, index) => {
        const suffix = index < normalizedPatterns.length - 1 ? "," : "";
        lines.push(`        ${JSON.stringify(pattern)}${suffix}`);
    });
    lines.push("    )");
    return lines.join("\n");
};

export const createManaweavingPatternGrid = (): number[][] =>
    Array.from({ length: MANAWEAVING_PATTERN_SIZE }, () =>
        Array(MANAWEAVING_PATTERN_SIZE).fill(0)
    );

export const cloneManaweavingPatternGrid = (pattern: readonly number[][]): number[][] =>
    pattern.map((row) => [...row]);

export const formatManaweavingPatternGrid = (
    pattern: readonly number[][]
): string =>
    `[\n${pattern
        .map((row) => `    [${row.join(", ")}]`)
        .join(",\n")}\n]`;

const stringifyManaweavingJson = (value: unknown, indent = 0): string => {
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

        return JSON.stringify(value, null, 2)
            .split("\n")
            .map((line) => indentStr + line)
            .join("\n");
    }

    if (typeof value === "object" && value !== null) {
        const entries = Object.entries(value as Record<string, unknown>);
        let result = "{\n";
        entries.forEach(([key, entryValue], index) => {
            result += `${indentStr}  "${key}": ${stringifyManaweavingJson(
                entryValue,
                indent + 2
            )}`;
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

export const generateManaweavingPatternJsonPreview = (
    pattern: readonly number[][],
    tier: number,
    faction: string
): string => {
    const json: Record<string, unknown> = {
        type: "mna:manaweaving-pattern",
        pattern: cloneManaweavingPatternGrid(pattern),
    };

    if (tier !== DEFAULT_MANAWEAVING_TIER) {
        json.tier = tier;
    }

    if (faction.trim() && faction.trim() !== DEFAULT_MANAWEAVING_FACTION) {
        json.requiredFaction = faction.trim();
    }

    return stringifyManaweavingJson(json);
};

export const generateManaweavingPatternKjsPreview = (
    pattern: readonly number[][],
    tier: number,
    faction: string
): string => {
    const lines = [
        "event.recipes.mna.pattern()",
        `    .pattern(${formatManaweavingPatternGrid(pattern)})`,
    ];

    if (tier !== DEFAULT_MANAWEAVING_TIER) {
        lines.push(`    .tier(${tier})`);
    }

    if (faction.trim() && faction.trim() !== DEFAULT_MANAWEAVING_FACTION) {
        lines.push(`    .faction(${JSON.stringify(faction.trim())})`);
    }

    return lines.join("\n");
};

export const generateManaweavingPatternShapePreview = (
    pattern: readonly number[][]
): string => formatManaweavingPatternGrid(pattern);
