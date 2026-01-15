/**
 * @fileoverview Arknights Story Reader Utility
 * @description Maps internal story paths to external reader formats
 */

import type { StoryReaderUrls } from '../types';

/**
 * Normalizes language code for 050644zf reader (e.g. zh_cn -> zh_CN)
 */
function normalizeLangForTextReader(lang: string): string {
    const parts = lang.split('_');
    if (parts.length < 2) return lang;
    return `${parts[0].toLowerCase()}_${parts[1].toUpperCase()}`;
}

/**
 * Maps Arknights story type to akgcc type
 */
function mapToAkgccType(type: string): string {
    const mapping: Record<string, string> = {
        'activities': 'side',
        'main': 'main',
        'record': 'record',
        'guide': 'guide'
    };
    return mapping[type] || type;
}

/**
 * Generates external story reader URLs from an internal story path
 * @param storyPath Internal path (e.g., 'activities/act48side/level_act48side_01_beg.txt')
 * @param lang Language code (e.g., 'zh_cn')
 */
export function getStoryReaderUrls(storyPath: string, lang: string): StoryReaderUrls {
    // 1. Arknights Story Text Reader (050644zf)
    const readerLang = normalizeLangForTextReader(lang);
    const cleanPath = storyPath.replace(/\.txt$/, '');
    const textReader = `https://050644zf.github.io/ArknightsStoryTextReader/#/${readerLang}/content?f=${cleanPath}`;

    // 2. akgcc Story Reader
    // Example: https://akgcc.github.io/story/#side&act48side&0
    const parts = cleanPath.split('/');
    let akgcc = 'https://akgcc.github.io/story/';
    
    if (parts.length >= 2) {
        const type = mapToAkgccType(parts[0]);
        const actId = parts[1];
        
        // Extract sequence index from filename (e.g., '01_beg' -> index 0)
        const filename = parts[parts.length - 1];
        const sequenceMatch = filename.match(/_(\d+)(?:_|$)/);
        const index = sequenceMatch ? Math.max(0, parseInt(sequenceMatch[1], 10) - 1) : 0;
        
        akgcc = `${akgcc}#${type}&${actId}&${index}`;
    }

    return { textReader, akgcc };
}

/**
 * Composable for story reader functionality
 */
export function useArknightsStoryReader() {
    return {
        getStoryReaderUrls
    };
}
