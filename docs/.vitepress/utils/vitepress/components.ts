import type { App } from "vue";
import {
    comment,
    ArticleMetadata,
    Linkcard,
    ResponsibleEditor,
    MdDialog,
    MdMultiPageDialog,
    CustomAlert,
    ChatPanel,
    ChatMessage,
    Bills,
    MarkMapView,
    VChart,
    ShaderEffectBlock,
} from "@utils/vitepress/componentRegistry/contentRegistry";
import {
    YoutubeVideo,
    BilibiliVideo,
    PdfViewer,
} from "@utils/vitepress/componentRegistry/mediaRegistry";
import {
    MnaGuidebookGenerator,
    RunescribingEditor,
    RitualGenerator,
} from "../../theme/components/AvalonWard";
import Arknights from "../../theme/components/Chara/Arknights/Arknights.vue";
import ArknightsStoryTracker from "../../theme/components/Chara/Arknights/ArknightsStoryTracker.vue";
import Fgo from "../../theme/components/Chara/Fgo/Fgo.vue";
import CardGenerator from "../../theme/components/CardGenerator/CardGenerator.vue";
import { JsonTranslator } from "../../theme/components/mc";
import {
    Buttons,
    Carousels,
    Steps,
    Animation,
    Preview,
    NotFound,
} from "@utils/vitepress/componentRegistry/uiRegistry";
import MagicMoveContainer from "@components/ui/MagicMoveContainer.vue";
import { defineAsyncComponent } from "vue";
import { LiteTree } from "@lite-tree/vue";
import { TagsPage } from "@utils/vitepress/componentRegistry/contentRegistry";

const CommitsCounter = defineAsyncComponent(
    () => import("@components/content/CommitsCounter.vue"),
);
const Contributors = defineAsyncComponent(
    () => import("@components/content/Contributors.vue"),
);

const components = {
    MdCarousel: Carousels,
    VPSteps: Steps,
    YoutubeVideo,
    BilibiliVideo,
    ArticleMetadata,
    Linkcard,
    commitsCounter: CommitsCounter,
    PdfViewer,
    LiteTree,
    MagicMoveContainer,
    Contributors,
    Buttons,
    comment,
    ResponsibleEditor,
    Animation,
    Preview,
    NotFound,
    MdDialog,
    MdMultiPageDialog,
    CustomAlert,
    TagsPage,
    ChatPanel,
    ChatMessage,
    Bills,
    MarkMapView,
    VChart,
    ShaderEffectBlock,
    MnaGuidebookGenerator,
    Arknights,
    ArknightsStoryTracker,
    RunescribingEditor,
    RitualGenerator,
    JsonTranslator,
    Fgo,
    CardGenerator,
};

console.log("Registered components:", Object.keys(components));

/**
 * Registers global components and aliases for VitePress.
 */
export const registerComponents = (app: App) => {
    Object.entries(components).forEach(([name, component]) => {
        if (component) {
            app.component(name, component);
        }
    });
};
