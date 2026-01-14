/**
 * @fileoverview Type definitions for MNA Guidebook Generator components
 * @description Centralized type definitions for MNA guidebook functionality
 */

export interface Entry {
    id: string;
    name: string;
    category: string;
    icon: string;
    advancement: string;
    sections: Section[];
    sortnum?: number;
    // MNA guidebook specific fields
    index?: number;
    tier?: number;
    required_advancement?: string;
}

export interface TextSegment {
    text: string;
    color?: string;
    italic?: boolean;
    bold?: boolean;
}

export interface Section {
    type: SectionType;
    // Title section fields
    value?: string;
    // Text section fields
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
    // Legacy/optional fields
    title?: string;
    text?: string;
    anchor?: string;
    advancement?: string;
    flag?: string;
    item?: string;
    recipe?: string;
    text2?: string;
}

export interface EntryCollection {
    [key: string]: Entry | any; // Allow any for MNA format compatibility
}

export interface GeneratorConfig {
    modId: string;
    language: string;
    isPackAddition: boolean;
    sourceLanguage: string;
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
    | "item"
    | "text_left"
    | "text_right"
    | "spotlight"
    | "crafting"
    | "smelting"
    | "multiblock"
    | "link"
    | "relations"
    | "empty";
