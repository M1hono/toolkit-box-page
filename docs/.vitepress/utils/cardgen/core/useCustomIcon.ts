/**
 * @fileoverview Custom Icon Management Composable
 * @module cardgen/custom-icon
 * @description
 * Manages custom icon state and methods (Upload, URL, SVG, Iconify)
 */

import { ref, watch } from "vue";

/**
 * Custom icon management composable
 */
export function useCustomIcon() {
    const useCustomIcon = ref(false);
    const customIconMethod = ref("upload");
    const customIconUrl = ref("");
    const customIconSvgText = ref("");
    const customIconSvgColor = ref("rgba(0, 0, 0, 1)");
    const customIconifyName = ref("");
    const customIconifyColor = ref("#000000");
    const customIconFile = ref<File | undefined>(undefined);
    const customIconSize = ref(76);
    const customIconX = ref(213);
    const customIconY = ref(753);

    const onIconMethodChange = () => {
        customIconUrl.value = "";
        customIconSvgText.value = "";
        customIconifyName.value = "";
        customIconFile.value = undefined;
    };

    const onCustomIconUpload = async (files: File[] | File | null) => {
        if (files) {
            let file: File | null = null;

            if (Array.isArray(files) && files.length > 0) {
                file = files[0];
            } else if (files instanceof File) {
                file = files;
            }

            if (file) {
                customIconFile.value = file;
            } else {
                customIconFile.value = undefined;
            }
        } else {
            customIconFile.value = undefined;
        }
    };

    watch(useCustomIcon, (newValue) => {
        if (!newValue) {
            customIconUrl.value = "";
            customIconSvgText.value = "";
            customIconSvgColor.value = "rgba(0, 0, 0, 1)";
            customIconifyName.value = "";
            customIconifyColor.value = "#000000";
            customIconFile.value = undefined;
            customIconSize.value = 76;
            customIconX.value = 213;
            customIconY.value = 753;
        }
    });

    return {
        useCustomIcon,
        customIconMethod,
        customIconUrl,
        customIconSvgText,
        customIconSvgColor,
        customIconifyName,
        customIconifyColor,
        customIconFile,
        customIconSize,
        customIconX,
        customIconY,
        onIconMethodChange,
        onCustomIconUpload,
    };
}
