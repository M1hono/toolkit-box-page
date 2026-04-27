/**
 * 简体中文 (zh-CN) 导航配置。
 */

import type { NavItem } from "../../../utils/config/navTypes";

const zhNav: NavItem[] = [
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
                            label: "工具",
                            items: [
                                {
                                    text: "从者立绘提取",
                                    link: "/Fgo/CharaFinder",
                                },
                                {
                                    text: "FGO 卡牌生成器",
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
        text: "明日方舟",
        dropdown: {
            layout: "columns",
            panels: [
                {
                    groups: [
                        {
                            label: "工具",
                            items: [
                                {
                                    text: "干员立绘提取",
                                    link: "/Arknights/CharaFinder",
                                },
                                {
                                    text: "干员剧情追踪",
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
                            label: "工具",
                            items: [
                                {
                                    text: "语言 JSON 翻译器",
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
                            label: "工具",
                            items: [
                                {
                                    text: "指南书编辑器",
                                    link: "/Mna/GuideBookGeneraor",
                                },
                                {
                                    text: "仪式配方编辑器",
                                    link: "/Mna/RitualGenerator",
                                },
                                {
                                    text: "法力编织图样配方编辑器",
                                    link: "/Mna/ManaweavePatternEditor",
                                },
                                {
                                    text: "符文配方编辑器",
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
        text: "Self",
        link: "/Self/",
    },
    {
        text: "资源",
        dropdown: {
            layout: "columns",
            panels: [
                {
                    groups: [
                        {
                            label: "资源",
                            items: [
                                {
                                    text: "标签索引",
                                    link: "/tags",
                                },
                                {
                                    text: "GitHub 仓库",
                                    href: "https://github.com/M1hono/toolkit-box-page/",
                                },
                                {
                                    text: "在线站点",
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

export default zhNav;
