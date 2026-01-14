/**
 * @fileoverview Type definitions for Runescribing Editor components
 * @description Centralized type definitions for runescribing functionality
 */

export interface RuneConfig {
    output: string;
    tier: number;
    requiredFaction: string;
}

export interface RuneValues {
    hValue: bigint;
    vValue: bigint;
}

export interface CanvasState {
    hLines: (boolean | null)[][];
    vLines: (boolean | null)[][];
    currentHighlight: LineHighlight | null;
}

export interface LineHighlight {
    type: 'h' | 'v';
    row: number;
    col: number;
}

export interface CanvasConstants {
    rows: number;
    cols: number;
    canvasWidth: number;
    canvasHeight: number;
    cellWidth: number;
    cellHeight: number;
}

export type OutputFormat = 'json' | 'kjs';