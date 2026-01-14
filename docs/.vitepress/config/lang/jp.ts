import type { DefaultTheme } from 'vitepress';
import { getProjectInfo, getLanguageByCode, getLangCodeFromLink, getSearchLocaleKey, isFeatureEnabled } from '../project-config';
import { getSidebarSync } from '../../utils/sidebar';

const projectInfo = getProjectInfo();
const langConfig = getLanguageByCode('ja')!;

export const ja = <DefaultTheme.Config>{
    label: langConfig.displayName,
    lang: langConfig.giscusLang,
    link: langConfig.link,
    title: 'M1hono ToolBox',
    description: 'ゲームリソース処理ツールキット - 複数のゲームリソース抽出、処理、翻訳ツールを統合',
    themeConfig: {
        nav: [
            {
                text: "ホーム",
                link: "/",
            },
            {
                text: "ゲームツール",
                items: [
                    { text: "FGO 抽出ツール", link: "/ja-JP/Fgo/CharaFinder" },
                    { text: "アークナイツツール", link: "/ja-JP/Arknights/CharaFinder" }
                ]
            },
            {
                text: "Minecraft ツール",
                items: [
                    { text: "JSON 翻訳ツール", link: "/ja-JP/Mc/JsonTranslator" },
                    { text: "ガイドブック生成器", link: "/ja-JP/Mna/GuideBookGeneraor" },
                    { text: "儀式生成器", link: "/ja-JP/Mna/RitualGenerator" },
                    { text: "ルーン編集器", link: "/ja-JP/Mna/RunescribingEditor" }
                ]
            }
        ],
        sidebar: getSidebarSync(getLangCodeFromLink(langConfig.link!)),
        outline: {
            level: "deep",
            label: "ページナビゲーション",
        },
        docFooter: {
            prev: "前のページ",
            next: "次のページ",
        },
        lastUpdated: {
            text: "最終更新日時",
            formatOptions: {
                dateStyle: "short",
                timeStyle: "medium",
            },
        },
        editLink: isFeatureEnabled('editLink') && projectInfo.editLink ? {
            pattern: projectInfo.editLink.pattern,
            text: projectInfo.editLink.text || "GitHub でこのページを編集"
        } : undefined,
        langMenuLabel: "言語を切り替え",
        returnToTopLabel: "トップに戻る",
        sidebarMenuLabel: "メニュー",
        darkModeSwitchLabel: "テーマ",
        lightModeSwitchTitle: "ライトモードに切り替え",
        darkModeSwitchTitle: "ダークモードに切り替え",
    },
};

export const search: DefaultTheme.AlgoliaSearchOptions["locales"] = {
    [getSearchLocaleKey(langConfig.code)]: {
        placeholder: "ドキュメントを検索",
        translations: {
            button: {
                buttonText: "ドキュメントを検索",
                buttonAriaLabel: "ドキュメントを検索",
            },
            modal: {
                searchBox: {
                    resetButtonTitle: "クエリ条件をクリア",
                    resetButtonAriaLabel: "クエリ条件をクリア",
                    cancelButtonText: "キャンセル",
                    cancelButtonAriaLabel: "キャンセル",
                },
                startScreen: {
                    recentSearchesTitle: "最近の検索",
                    noRecentSearchesText: "最近の検索がありません",
                    saveRecentSearchButtonTitle: "最近の検索に保存",
                    removeRecentSearchButtonTitle: "最近の検索から削除",
                    favoriteSearchesTitle: "お気に入り",
                    removeFavoriteSearchButtonTitle: "お気に入りから削除",
                },
                errorScreen: {
                    titleText: "結果を取得できません",
                    helpText: "ネットワーク接続を確認してください",
                },
                footer: {
                    selectText: "選択",
                    navigateText: "切り替え",
                    closeText: "閉じる",
                    searchByText: "検索提供者",
                },
                noResultsScreen: {
                    noResultsText: "関連する結果が見つかりません",
                    suggestedQueryText: "検索を試してください",
                    reportMissingResultsText: "このクエリに結果があると思いますか？",
                    reportMissingResultsLinkText: "フィードバックを送信",
                },
            },
        },
    },
};
