/**
 * @fileoverview Dual-Source Data Loader
 * @description Loads data from R2 (primary) with GitHub fallback
 */

const R2_DATA_BASE = 'https://arkimage.top/data';
const GITHUB_DATA_BASE = 'https://raw.githubusercontent.com/M1hono/toolkit-box-page/main/docs/src/public/data';

export interface LoadOptions {
    useR2First?: boolean;
    timeout?: number;
    retries?: number;
}

/**
 * Load JSON data with R2-first strategy
 * @param path - Relative path (e.g., 'en_us/arknights/names.json')
 * @param options - Loading options
 * @returns Parsed JSON data
 */
export async function loadDataWithFallback<T = any>(
    path: string,
    options: LoadOptions = {}
): Promise<T | null> {
    const { useR2First = true, timeout = 10000, retries = 1 } = options;

    const sources = useR2First
        ? [`${R2_DATA_BASE}/${path}`, `${GITHUB_DATA_BASE}/${path}`]
        : [`${GITHUB_DATA_BASE}/${path}`, `${R2_DATA_BASE}/${path}`];

    for (const url of sources) {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(url, {
                    signal: controller.signal,
                    cache: 'no-cache',
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                // Silent fail, try next source
                if (attempt === retries) {
                    console.warn(`Failed to load from ${url}:`, error);
                }
            }
        }
    }

    console.error(`Failed to load data from all sources: ${path}`);
    return null;
}

/**
 * Get data URL with source priority
 * @param path - Relative data path
 * @param useR2First - Whether to prioritize R2
 * @returns Primary URL
 */
export function getDataUrl(path: string, useR2First: boolean = true): string {
    return useR2First
        ? `${R2_DATA_BASE}/${path}`
        : `${GITHUB_DATA_BASE}/${path}`;
}

/**
 * Composable for dual-source data loading
 */
export function useDualSourceLoader() {
    return {
        loadDataWithFallback,
        getDataUrl,
        R2_DATA_BASE,
        GITHUB_DATA_BASE,
    };
}
