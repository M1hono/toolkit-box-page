/**
 * @fileoverview MNA file operations service using existing VitePress utilities
 * @author Professional TS Developer
 */

import type {
    EntryCollection,
    ImportResult,
    ValidationResult,
    TextSegment,
    Entry,
    Section,
} from "./types.js";

export class MnaFileService {
    private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024;
    private static readonly SUPPORTED_EXTENSIONS = [".json"];

    /**
     * Validates a file before processing
     */
    static validateFile(file: File): ValidationResult {
        const errors: string[] = [];

        if (!file) {
            errors.push("No file selected");
            return { isValid: false, errors };
        }

        const extension = this.getFileExtension(file.name);
        if (!this.SUPPORTED_EXTENSIONS.includes(extension)) {
            errors.push(
                `Unsupported file type. Supported: ${this.SUPPORTED_EXTENSIONS.join(
                    ", "
                )}`
            );
        }

        if (file.size > this.MAX_FILE_SIZE) {
            errors.push(
                `File too large. Maximum size: ${this.formatFileSize(
                    this.MAX_FILE_SIZE
                )}`
            );
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Imports JSON data from file with validation and processing
     */
    static async importJsonData(file: File): Promise<ImportResult> {
        const validation = this.validateFile(file);
        if (!validation.isValid) {
            return {
                success: false,
                message: validation.errors.join(", "),
            };
        }

        try {
            const content = await this.readFileAsText(file);
            const filename = this.getFileName(file.name);

            let rawData;
            try {
                rawData = JSON.parse(content);
            } catch (parseError) {
                return {
                    success: false,
                    message:
                        "Invalid JSON format: " + (parseError as Error).message,
                };
            }

            const processedData = this.processJsonData(rawData);

            return {
                success: true,
                data: processedData,
                message: `Successfully imported ${
                    Object.keys(processedData).length
                } entries from ${filename}`,
                entryCount: Object.keys(processedData).length,
            };
        } catch (error) {
            return {
                success: false,
                message: `Import failed: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            };
        }
    }

    /**
     * Exports data as downloadable JSON file
     */
    static exportJsonData(data: EntryCollection, filename: string): void {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });

        this.downloadBlob(blob, `${filename}.json`);
    }

    /**
     * Processes imported JSON data to ensure proper structure
     */
    private static processJsonData(rawData: unknown): EntryCollection {
        const processedData: EntryCollection = {};

        if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
            throw new Error("Invalid data structure: expected an object");
        }

        Object.entries(rawData as Record<string, unknown>).forEach(
            ([key, entry]) => {
                if (!this.isValidEntryData(entry)) {
                    console.warn(`Skipping invalid entry "${key}"`);
                    return;
                }

                const processedEntry = this.processEntry(entry as any);
                if (processedEntry) {
                    processedData[key] = processedEntry;
                }
            }
        );

        return processedData;
    }

    /**
     * Processes a single entry ensuring proper structure
     */
    private static processEntry(entry: any): Entry | null {
        try {
            const processedEntry: Entry = {
                index: this.safeParseNumber(entry.index, 0),
                category: this.safeParseString(entry.category, "basics"),
                sections: [],
            };

            if (entry.tier !== undefined) {
                processedEntry.tier = this.safeParseNumber(entry.tier, 1);
            }

            if (Array.isArray(entry.sections)) {
                processedEntry.sections = entry.sections
                    .map((section: any) => this.processSection(section))
                    .filter(
                        (
                            section: any
                        ): section is NonNullable<typeof section> =>
                            section !== null
                    );
            }

            return processedEntry;
        } catch (error) {
            console.error("Error processing entry:", error);
            return null;
        }
    }

    /**
     * Processes text segments ensuring proper TextSegment structure
     */
    private static processTextSegments(json: unknown): TextSegment[] {
        if (typeof json === "string") {
            try {
                json = JSON.parse(json);
            } catch {
                return [{ text: String(json) }];
            }
        }

        if (!Array.isArray(json)) {
            return [];
        }

        return json.map((segment) => {
            if (!segment || typeof segment !== "object") {
                return { text: String(segment || "") };
            }

            return {
                text: this.safeParseString((segment as any).text, ""),
                color: (segment as any).color
                    ? String((segment as any).color)
                    : undefined,
                italic: Boolean((segment as any).italic),
                bold: Boolean((segment as any).bold),
            };
        });
    }

    /**
     * Private helper: Validates if data represents a valid entry
     */
    private static isValidEntryData(data: unknown): boolean {
        return (
            data !== null && typeof data === "object" && !Array.isArray(data)
        );
    }

    /**
     * Private helper: Processes a section ensuring proper structure
     */
    private static processSection(section: any): Section | null {
        if (!this.isValidEntryData(section) || !section.type) {
            return null;
        }

        const processedSection: Partial<Section> = {
            type: section.type,
            newPage: Boolean(section.newPage),
        };

        switch (section.type) {
            case "title":
                processedSection.value = this.safeParseString(
                    section.value,
                    ""
                );
                break;
            case "text":
                processedSection.json = this.processTextSegments(section.json);
                break;
            case "image":
                processedSection.location = this.safeParseString(
                    section.location,
                    ""
                );
                processedSection.width = this.safeParseNumber(
                    section.width,
                    128
                );
                processedSection.height = this.safeParseNumber(
                    section.height,
                    128
                );
                break;
            case "recipe":
                processedSection.location = this.safeParseString(
                    section.location,
                    ""
                );
                processedSection.recipeType = this.safeParseString(
                    section.recipeType,
                    "crafting"
                );
                break;
            case "item":
                processedSection.location = section.location
                    ? String(section.location)
                    : undefined;
                processedSection.locations = Array.isArray(section.locations)
                    ? section.locations.map(String)
                    : [];
                processedSection.scale = this.safeParseNumber(
                    section.scale,
                    1.0
                );
                processedSection.items_per_row = this.safeParseNumber(
                    section.items_per_row,
                    4
                );
                break;
        }

        return processedSection as Section;
    }

    /**
     * Private helper: Read file as text
     */
    private static readFileAsText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                if (typeof event.target?.result === "string") {
                    resolve(event.target.result);
                } else {
                    reject(new Error("Failed to read file as text"));
                }
            };

            reader.onerror = () => {
                reject(new Error("File reading failed"));
            };

            reader.readAsText(file, "UTF-8");
        });
    }

    /**
     * Private helper: Download blob as file
     */
    private static downloadBlob(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const element = document.createElement("a");

        element.href = url;
        element.download = filename;
        element.style.display = "none";

        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        URL.revokeObjectURL(url);
    }

    /**
     * Private helper: Safely parse number with fallback
     */
    private static safeParseNumber(value: unknown, fallback: number): number {
        const parsed = Number(value);
        return isNaN(parsed) ? fallback : parsed;
    }

    /**
     * Private helper: Safely parse string with fallback
     */
    private static safeParseString(value: unknown, fallback: string): string {
        return value != null ? String(value) : fallback;
    }

    /**
     * Private helper: Get file extension
     */
    private static getFileExtension(filename: string): string {
        const lastDot = filename.lastIndexOf(".");
        return lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : "";
    }

    /**
     * Private helper: Get filename without extension
     */
    private static getFileName(filename: string): string {
        return filename.replace(/\.json$/i, "");
    }

    /**
     * Private helper: Format file size for display
     */
    private static formatFileSize(bytes: number): string {
        const sizes = ["Bytes", "KB", "MB", "GB"];
        if (bytes === 0) return "0 Bytes";

        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${
            sizes[i]
        }`;
    }
}
