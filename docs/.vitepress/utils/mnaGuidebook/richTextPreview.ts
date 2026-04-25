/**
 * @fileoverview Shared rich-text preview helpers for the MNA guidebook editor
 * @description Converts MNA-style text segments into theme-aware preview HTML
 */

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

function normalizeColor(value: unknown): string {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().toLowerCase().replaceAll(" ", "_");
}

export function renderGuidebookSegments(segments: unknown): string {
    if (!Array.isArray(segments) || segments.length === 0) {
        return "";
    }

    return segments
        .map((segment) => {
            if (!segment || typeof segment !== "object") {
                return "";
            }

            const text = typeof (segment as { text?: unknown }).text === "string"
                ? (segment as { text: string }).text
                : "";

            const classes = ["mna-rich-segment"];
            const color = normalizeColor((segment as { color?: unknown }).color);

            if (color) {
                classes.push(`mna-color-${color}`);
            }
            if ((segment as { italic?: boolean }).italic) {
                classes.push("mna-rich-italic");
            }
            if ((segment as { bold?: boolean }).bold) {
                classes.push("mna-rich-bold");
            }
            if ((segment as { underlined?: boolean }).underlined) {
                classes.push("mna-rich-underlined");
            }
            if ((segment as { strikethrough?: boolean }).strikethrough) {
                classes.push("mna-rich-strikethrough");
            }
            if ((segment as { obfuscated?: boolean }).obfuscated) {
                classes.push("mna-rich-obfuscated");
            }

            return `<span class="${classes.join(" ")}">${escapeHtml(text).replaceAll("\n", "<br>")}</span>`;
        })
        .join("");
}
