import { defineAsyncComponent } from "vue";

const Arknights = defineAsyncComponent(
    () => import("@components/Chara/Arknights/Arknights.vue"),
);
const ArknightsStoryTracker = defineAsyncComponent(
    () => import("@components/Chara/Arknights/ArknightsStoryTracker.vue"),
);
const Fgo = defineAsyncComponent(
    () => import("@components/Chara/Fgo/Fgo.vue"),
);
const ToolkitCardGeneratorApp = defineAsyncComponent(
    () => import("@components/CardGenerator/CardGenerator.vue"),
);
const ToolkitJsonTranslatorApp = defineAsyncComponent(
    () => import("@components/mc/JsonTranslator/JsonTranslator.vue"),
);
const MnaGuidebookGenerator = defineAsyncComponent(
    () =>
        import(
            "@components/AvalonWard/MnaGuidebookGenerator/MnaGuidebookGenerator.vue"
        ),
);
const ManaweavePatternEditor = defineAsyncComponent(
    () =>
        import(
            "@components/AvalonWard/ManaweavePatternEditor/ManaweavePatternEditor.vue"
        ),
);
const RitualGenerator = defineAsyncComponent(
    () => import("@components/AvalonWard/RitualGenerator/RitualGenerator.vue"),
);
const RunescribingEditor = defineAsyncComponent(
    () =>
        import(
            "@components/AvalonWard/RunescribingEditor/RunescribingEditor.vue"
        ),
);
const PosterStudioApp = defineAsyncComponent(
    () => import("@components/Self/PosterStudio/PosterStudioApp.vue"),
);

export const components = {
    Arknights,
    ArknightsStoryTracker,
    Fgo,
    MnaGuidebookGenerator,
    ManaweavePatternEditor,
    RitualGenerator,
    RunescribingEditor,
    PosterStudioApp,
    ToolkitCardGeneratorApp,
    ToolkitGuidebookGeneratorApp: MnaGuidebookGenerator,
    ToolkitJsonTranslatorApp,
    ToolkitManaweavePatternEditorApp: ManaweavePatternEditor,
    ToolkitRitualGeneratorApp: RitualGenerator,
    ToolkitRunescribingEditorApp: RunescribingEditor,
};
