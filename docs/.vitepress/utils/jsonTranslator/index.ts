/**
 * @fileoverview JSON Translator utility exports
 * @description Central exports for JSON translator types, composables, and services
 */

export type {
    TranslationEntry,
    TranslationEntries,
    TranslatorConfig,
    TranslatorState,
    PaginationInfo,
    TranslationStats,
} from "./types";

export { useJsonTranslator } from "./useJsonTranslator";
