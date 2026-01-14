/**
 * @fileoverview Standard Layout Composable
 * @description Provides consistent layout patterns for all components with no gaps and proper alignment
 */

import { computed, CSSProperties } from "vue";

export interface LayoutConfig {
    fullWidth: boolean;
    noGaps: boolean;
    matchHeight: boolean;
    responsive: boolean;
}

export interface PaginationConfig {
    defaultPageSize: number;
    pageSizeOptions: number[];
    maxItemsPerPage: number;
}

/**
 * Standard layout composable for consistent component layouts
 * @param config - Layout configuration options
 * @returns Layout styles and utilities
 */
export function useStandardLayout(
    config: LayoutConfig = {
        fullWidth: true,
        noGaps: true,
        matchHeight: true,
        responsive: true,
    }
) {
    /**
     * Container styles for full-width, no-gap layouts
     */
    const containerStyles = computed(
        (): CSSProperties => ({
            width: "100%",
            maxWidth: "100%",
            padding: "0 !important",
            margin: "0 !important",
            minHeight: "100vh",
        })
    );

    /**
     * Row styles for gap-free rows
     */
    const rowStyles = computed(
        (): CSSProperties => ({
            margin: "0 !important",
            width: "100%",
        })
    );

    /**
     * Column styles for consistent spacing
     */
    const colStyles = computed(
        (): CSSProperties => ({
            paddingLeft: "24px !important",
            paddingRight: "24px !important",
        })
    );

    /**
     * Panel styles for matched height containers
     */
    const panelStyles = computed(
        (): CSSProperties => ({
            height: config.matchHeight ? "100%" : "auto",
            display: "flex",
            flexDirection: "column",
        })
    );

    /**
     * Card styles for consistent component appearance
     */
    const cardStyles = computed(
        (): CSSProperties => ({
            border: "1px solid #bdbdbd",
            boxShadow: "none !important",
            borderRadius: "12px !important",
            height: "100%",
        })
    );

    /**
     * Responsive grid classes for different screen sizes
     */
    const responsiveClasses = computed(() => ({
        leftPanel: config.responsive ? "cols-12 lg-4" : "cols-4",
        rightPanel: config.responsive ? "cols-12 lg-8" : "cols-8",
        fullWidth: "cols-12",
    }));

    /**
     * Standard pagination configuration
     */
    const paginationDefaults: PaginationConfig = {
        defaultPageSize: 10,
        pageSizeOptions: [5, 10, 20, 50],
        maxItemsPerPage: 50,
    };

    /**
     * CSS class names for consistent styling
     */
    const cssClasses = {
        app: "standard-layout-app",
        container: "standard-container",
        row: "standard-row",
        col: "standard-col",
        panel: "standard-panel",
        card: "standard-card",
    };

    return {
        containerStyles,
        rowStyles,
        colStyles,
        panelStyles,
        cardStyles,
        responsiveClasses,
        paginationDefaults,
        cssClasses,
    };
}
