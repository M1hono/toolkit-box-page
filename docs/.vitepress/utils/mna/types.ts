/**
 * @fileoverview Type definitions for MNA Guidebook Generator utilities
 * @author Professional TS Developer
 */

export interface TextSegment {
    text: string;
    color?: string;
    italic?: boolean;
    bold?: boolean;
}

export interface Section {
    type: "title" | "text" | "image" | "recipe" | "item";
    newPage?: boolean;
    value?: string;
    json?: TextSegment[];
    location?: string;
    locations?: string[];
    width?: number;
    height?: number;
    recipeType?: string;
    scale?: number;
    items_per_row?: number;
}

export interface Entry {
    index: number;
    category: string;
    tier?: number;
    sections: Section[];
}

export interface EntryCollection {
    [key: string]: Entry;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export interface ImportResult {
    success: boolean;
    data?: EntryCollection;
    message: string;
    entryCount?: number;
}

export interface MismatchEntry {
    key: string;
    type: "category" | "structure" | "content";
    targetCategory?: string;
    sourceCategory?: string;
    mismatches?: Array<{
        type: string;
        issue: string;
        index?: number;
    }>;
}

export interface TranslationStatus {
    total: number;
    translated: number;
    untranslated: number;
    orphaned: number;
    mismatched: number;
}

export interface PaginationConfig {
    page: number;
    pageSize: number;
    totalPages: number;
}

export type CategoryType = string;
export type TierType = 1 | 2 | 3 | 4 | 5;
export type SectionType = "title" | "text" | "image" | "recipe" | "item";
