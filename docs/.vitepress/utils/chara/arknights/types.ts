/**
 * @fileoverview Arknights Chara Finder Types
 * @description TypeScript definitions for Arknights character data and component state
 */

export interface CharacterData {
    charId: string;
    validVariants: string[];
    charType: 'operator' | 'npc';
    dialogCount: number;
}

export interface CharacterNames {
    speakerNames: string[];
    searchNames: string[];
    displayName: string;
}

export interface UnifiedCharacterData extends CharacterData, CharacterNames {
    // Combined properties for easy UI usage
}

export interface SelectionRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface CanvasSize {
    width: number;
    height: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface ImageConfig {
    enableR2: boolean;
    useR2Priority: boolean;
    r2PublicUrl: string;
    r2DirectUrl: string;
    sourceUrls: {
        primary: string;
        backup: string;
    };
}
