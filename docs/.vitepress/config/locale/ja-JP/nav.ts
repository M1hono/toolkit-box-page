/**
 * 日本語 (ja-JP) navigation configuration.
 */

import type { NavItem } from "../../../utils/config/navTypes";

const jaNav: NavItem[] = [
    {
        text: "索引",
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
                            label: "ツール",
                            items: [
                                {
                                    text: "サーヴァント立ち絵抽出",
                                    link: "/Fgo/CharaFinder",
                                },
                                {
                                    text: "FGO カード生成",
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
        text: "アークナイツ",
        dropdown: {
            layout: "columns",
            panels: [
                {
                    groups: [
                        {
                            label: "ツール",
                            items: [
                                {
                                    text: "オペレーター立ち絵抽出",
                                    link: "/Arknights/CharaFinder",
                                },
                                {
                                    text: "ストーリートラッカー",
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
                            label: "ツール",
                            items: [
                                {
                                    text: "言語 JSON エディタ",
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
                            label: "ツール",
                            items: [
                                {
                                    text: "ガイドブック編集",
                                    link: "/Mna/GuideBookGeneraor",
                                },
                                {
                                    text: "儀式レシピ編集",
                                    link: "/Mna/RitualGenerator",
                                },
                                {
                                    text: "マナウィーブパターンレシピ編集",
                                    link: "/Mna/ManaweavePatternEditor",
                                },
                                {
                                    text: "ルーン配方編集",
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
        text: "リソース",
        dropdown: {
            layout: "columns",
            panels: [
                {
                    groups: [
                        {
                            label: "リソース",
                            items: [
                                {
                                    text: "GitHub",
                                    href: "https://github.com/M1hono/toolkit-box-page/",
                                },
                                {
                                    text: "公開サイト",
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

export default jaNav;
