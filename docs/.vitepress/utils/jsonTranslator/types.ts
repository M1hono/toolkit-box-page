/**
 * @fileoverview Type definitions for JSON Translator components
 * @description Centralized type definitions for JSON translation functionality
 */

export interface TranslationEntry {
    [key: string]: string;
}

export interface TranslationEntries {
    [key: string]: string;
}

export interface TranslatorConfig {
    sourceLanguage: string;
    targetLanguage: string;
    pageSize: number;
    untranslatedPageSize: number;
    missingKeysPageSize: number;
}

export interface TranslatorState {
    sourceEntries: TranslationEntries;
    targetEntries: TranslationEntries;
    currentKey: string;
    currentValue: string;
    originalValue: string;
    editMode: boolean;
    searchKey: string;
    showUntranslatedOnly: boolean;
    showTranslationPanel: boolean;
    statusMessage: string;
    hasError: boolean;
    isImporting: boolean;
    importProgress: number;
    jsonOutput: string;
    currentPage: number;
    untranslatedCurrentPage: number;
    missingKeysCurrentPage: number;
    showMissingKeysPanel: boolean;
    selectedMissingKeys: string[];
}

export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
}

export interface TranslationStats {
    totalEntries: number;
    translatedCount: number;
    untranslatedCount: number;
    missingKeysCount: number;
}
