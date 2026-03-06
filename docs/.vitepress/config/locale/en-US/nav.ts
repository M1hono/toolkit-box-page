/**
 * English (en-US) navigation configuration.
 */

import type { NavItem } from "../../../utils/config/navTypes";

const enNav: NavItem[] = [
    {
        text: "Index",
        link: "/",
    },
    {
        text: "FGO",
        dropdown: {
            layout: "columns",
            panels: [
                {
                    groups: [
                        {
                            label: "Tools",
                            items: [
                                {
                                    text: "Servant Portrait Extractor",
                                    link: "/Fgo/CharaFinder",
                                },
                                {
                                    text: "Card Generator",
                                    link: "/Fgo/CardGenerator",
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    },
    {
        text: "Arknights",
        dropdown: {
            layout: "columns",
            panels: [
                {
                    groups: [
                        {
                            label: "Tools",
                            items: [
                                {
                                    text: "Operator Portrait Extractor",
                                    link: "/Arknights/CharaFinder",
                                },
                                {
                                    text: "Story Tracker",
                                    link: "/Arknights/StoryTracker",
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    },
    {
        text: "Minecraft",
        dropdown: {
            layout: "columns",
            panels: [
                {
                    groups: [
                        {
                            label: "Tools",
                            items: [
                                {
                                    text: "Locale JSON Editor",
                                    link: "/Mc/JsonTranslator",
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    },
    {
        text: "Manaweave",
        dropdown: {
            layout: "columns",
            panels: [
                {
                    groups: [
                        {
                            label: "Tools",
                            items: [
                                {
                                    text: "Guidebook Editor",
                                    link: "/Mna/GuideBookGeneraor",
                                },
                                {
                                    text: "Ritual Recipe Editor",
                                    link: "/Mna/RitualGenerator",
                                },
                                {
                                    text: "Runescribing Recipe Editor",
                                    link: "/Mna/RunescribingEditor",
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    },
    {
        text: "Resources",
        dropdown: {
            layout: "columns",
            panels: [
                {
                    groups: [
                        {
                            label: "Resources",
                            items: [
                                {
                                    text: "Repository",
                                    href: "https://github.com/M1hono/toolkit-box-page/",
                                },
                                {
                                    text: "Live Site",
                                    href: "https://tool.mihono.cn/",
                                },
                                {
                                    text: "Discord",
                                    href: "https://discord.gg/uPJHxU46td",
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    },
];

export default enNav;
