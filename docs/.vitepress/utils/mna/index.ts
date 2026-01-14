/**
 * @fileoverview MNA Guidebook utilities index
 * @author Professional TS Developer
 */

export { MnaDataService } from "./dataService.js";
export { MnaFileService } from "./fileService.js";
export { MnaTranslationService } from "./translationService.js";
export * from "./types.js";

export const mnaUtils = {
    data: () => import("./dataService.js").then((m) => m.MnaDataService),
    file: () => import("./fileService.js").then((m) => m.MnaFileService),
    translation: () =>
        import("./translationService.js").then((m) => m.MnaTranslationService),
};
