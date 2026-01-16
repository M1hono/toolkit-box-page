import type { FooterConfig } from '../../../utils/content/footer';
import { createIconConfig, createLinkConfig, createGroupConfig } from '../../../utils/content/footer';

export const footerConfig: FooterConfig = {
    beian: {
        showIcon: true,
        icp: {
            icon: createIconConfig(
                'fluent:globe-shield-48-filled',
                'rgba(20, 150, 255, 1)',
                'rgba(100, 200, 255, 1)'
            ),
            number: 'ICP登録番号 12345678',
            rel: 'noopener noreferrer',
        },
        police: {
            icon: createIconConfig(
                'fluent:shield-checkmark-48-filled',
                'rgba(50, 200, 50, 1)',
                'rgba(100, 255, 100, 1)'
            ),
            number: '公安登録番号 12345678',
            rel: 'noopener noreferrer',
        },
    },
    author: {
        icon: createIconConfig('mdi:copyright', '#999', '#ccc'),
        name: 'M1hono',
        link: 'https://github.com/M1hono',
        rel: 'noopener noreferrer',
        text: 'メンテナンス中。',
    },
    group: [
        createGroupConfig(
            '',
            [
                createLinkConfig(
                    'M1hono ツールボックスページ',
                    'https://github.com/M1hono/toolkit-box-page/',
                    'mdi:github',
                    {
                        rel: 'noopener noreferrer',
                        iconColors: { 
                            light: 'rgba(0, 0, 0, 1)',
                            dark: 'rgba(255, 255, 255, 1)'
                        },
                    }
                ),
                createLinkConfig(
                    'ArkDataからデータハンドラーロジックを学習',
                    'https://github.com/akgcc/arkdata',
                    'mdi:github',
                    {
                        rel: 'noopener noreferrer',
                        iconColors: { 
                            light: 'rgba(0, 0, 0, 1)',
                            dark: 'rgba(255, 255, 255, 1)'
                        },
                    }
                ),
                createLinkConfig(
                    'ArknightsAssetsが整理したすべてのアークナイツデータ',
                    'https://github.com/ArknightsAssets/ArknightsGamedata/',
                    'mdi:github',
                    {
                        rel: 'noopener noreferrer',
                        iconColors: { 
                            light: 'rgba(0, 0, 0, 1)',
                            dark: 'rgba(255, 255, 255, 1)'
                        },
                    }
                )
            ]
        ),
        createGroupConfig(
            '',
            [
                createLinkConfig(
                    'Fgo データプロバイダー Atlas Academy',
                    'https://apps.atlasacademy.io/db',
                    'https://avatars.githubusercontent.com/u/45353598',
                    {
                        rel: 'noopener noreferrer',
                        iconColors: { 
                            light: 'rgba(0, 0, 0, 1)',
                            dark: 'rgba(255, 255, 255, 1)'
                        },
                    }
                ),
                createLinkConfig(
                    'Atlas Academy API プロバイダー',
                    'https://api.atlasacademy.io/rapidoc',
                    'https://avatars.githubusercontent.com/u/45353598',
                    {
                        rel: 'noopener noreferrer',
                        iconColors: { 
                            light: 'rgba(0, 0, 0, 1)',
                            dark: 'rgba(255, 255, 255, 1)'
                        },
                    }
                ),
                createLinkConfig(
                    'Atlas Discord サーバー',
                    'https://discord.gg/grandorder',
                    "<svg xmlns='http://www.w3.org/2000/svg' x='0px' y='0px' width='100' height='100' viewBox='0 0 48 48'><path fill='#8c9eff' d='M40,12c0,0-4.585-3.588-10-4l-0.488,0.976C34.408,10.174,36.654,11.891,39,14c-4.045-2.065-8.039-4-15-4s-10.955,1.935-15,4c2.346-2.109,5.018-4.015,9.488-5.024L18,8c-5.681,0.537-10,4-10,4s-5.121,7.425-6,22c5.162,5.953,13,6,13,6l1.639-2.185C13.857,36.848,10.715,35.121,8,32c3.238,2.45,8.125,5,16,5s12.762-2.55,16-5c-2.715,3.121-5.857,4.848-8.639,5.815L33,40c0,0,7.838-0.047,13-6C45.121,19.425,40,12,40,12z M17.5,30c-1.933,0-3.5-1.791-3.5-4c0-2.209,1.567-4,3.5-4s3.5,1.791,3.5,4C21,28.209,19.433,30,17.5,30z M30.5,30c-1.933,0-3.5-1.791-3.5-4c0-2.209,1.567-4,3.5-4s3.5,1.791,3.5,4C34,28.209,32.433,30,30.5,30z'></path></svg>",
                    {
                        rel: 'noopener noreferrer',
                        iconColors: { 
                            light: 'rgba(0, 0, 0, 1)',
                            dark: 'rgba(255, 255, 255, 1)'
                        },
                    }
                ),
            ]
        )
    ],
};

export default footerConfig;
