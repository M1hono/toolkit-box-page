/**
 * @fileoverview FGO Chara Finder Types
 * @description TypeScript definitions for FGO character data and component state
 */

export interface FgoCharacter {
    id: number;
    name: string;
    jpName?: string;
    imageData?: {
        charaFigures?: Record<string, any>;
        faceCoordinates?: Record<string, FaceCoordinate>;
    };
    extraAssets?: {
        charaFigure?: {
            ascension?: Record<string, string>;
            costume?: Record<string, string>;
            story?: Record<string, string>;
        };
    };
}

export interface FaceCoordinate {
    faceX: number;
    faceY: number;
}

export interface SelectionRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface ColorRGBA {
    r: number;
    g: number;
    b: number;
    a: number;
}

export interface SearchResult {
    id: number;
    name: string;
    jpName: string;
    faceId?: number;
}
