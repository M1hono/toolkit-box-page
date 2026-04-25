/**
 * @fileoverview Type definitions for MNA Guidebook Generator components
 * @description Centralized type definitions for MNA guidebook functionality
 */

export interface Entry {
    id: string;
    name: string;
    category: string;
    index: number;
    tier: number;
    required_advancement: string;
    sections: Section[];
    related_recipes: RelatedRecipe[];
}

export interface TextSegment {
    text: string;
    color?: string;
    italic?: boolean;
    bold?: boolean;
    underlined?: boolean;
    strikethrough?: boolean;
    obfuscated?: boolean;
}

export interface TextLink {
    type: "entry" | "recipe";
    path: string;
}

export interface RelatedRecipe {
    type: string;
    location?: string;
    locations?: string[];
}

export interface Section {
    type: SectionType;
    // Title section fields
    value?: string;
    // Text section fields
    link?: TextLink;
    json?: TextSegment[];
    // Image section fields
    location?: string;
    width?: number;
    height?: number;
    // Recipe section fields
    recipeType?: string;
    // Item section fields
    locations?: string[];
    scale?: number;
    items_per_row?: number;
    // Common fields
    newPage?: boolean;
}

export interface EntryCollection {
    [key: string]: Entry;
}

export interface GeneratorConfig {
    modId: string;
    language: string;
    isPackAddition: boolean;
    sourceLanguage: string;
    guidebookVersion: string;
}

export interface GeneratorState {
    entries: EntryCollection;
    sourceEntries: EntryCollection;
    customCategories: string[];
    currentEntryId: string;
    showTranslation: boolean;
    showUntranslatedOnly: boolean;
    entryFilter: string;
    statusMessage: string;
    hasError: boolean;
}

export type SectionType =
    | "title"
    | "text"
    | "image"
    | "recipe"
    | "item";
