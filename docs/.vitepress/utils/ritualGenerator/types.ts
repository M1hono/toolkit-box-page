/**
 * @fileoverview Type definitions for Ritual Generator components
 * @description Centralized type definitions for ritual pattern generation functionality
 */

export interface RitualPattern {
    [key: number]: number[];
}

export interface RitualKeys {
    [key: string]: RitualKeyConfig;
}

export interface RitualKeyConfig {
    item: string;
    optional: boolean;
    consume: boolean;
    is_dynamic: boolean;
    dynamic_source: boolean;
    manual_return: boolean;
}

export interface RitualParameters {
    tier: number;
    innerColor: string;
    outerColor: string;
    beamColor: string;
    connectBeam: boolean;
    displayIndexes: boolean;
    kittable: boolean;
    createsItem: string;
}

export interface RitualState {
    gridSize: number;
    maxGridSize: number;
    locked: boolean;
    activeLayer: LayerType;
    pattern: number[][];
    displayPattern: number[][];
    reagents: string[][];
    keys: RitualKeys;
    parameters: RitualParameters;
    manaweavePatterns: string[];
    command: string;
    runeAssignments: { [key: string]: number };
    outputFormat: OutputFormat;
    isValid: boolean;
}

export interface ShowKeysOverlay {
    pattern: boolean;
    displayPattern: boolean;
    reagents: boolean;
}

export type LayerType = "pattern" | "displayPattern" | "reagents";
export type OutputFormat = "json" | "kjs";
