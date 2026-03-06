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
            number: 'ICP备案号 12345678',
            rel: 'noopener noreferrer',
        },
        police: {
            icon: createIconConfig(
                'fluent:shield-checkmark-48-filled',
                'rgba(50, 200, 50, 1)',
                'rgba(100, 255, 100, 1)'
            ),
            number: '公安备案号 12345678',
            rel: 'noopener noreferrer',
        },
    },
    author: {
        icon: createIconConfig('mdi:copyright', '#999', '#ccc'),
        name: 'M1hono',
        link: 'https://github.com/M1hono',
        rel: 'noopener noreferrer',
        text: '版权所有。',
    },
    group: [
        createGroupConfig(
            '资源',
            [
                createLinkConfig(
                    'GitHub 仓库',
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
                    '在线站点',
                    'https://tool.mihono.cn/',
                    'mdi:compass-outline',
                    {
                        rel: 'noopener noreferrer',
                        iconColors: { 
                            light: 'rgba(120, 108, 196, 1)',
                            dark: 'rgba(181, 170, 255, 1)'
                        },
                    }
                ),
                createLinkConfig(
                    'Discord 社区',
                    'https://discord.gg/uPJHxU46td',
                    'mdi:discord',
                    {
                        rel: 'noopener noreferrer',
                        iconColors: { 
                            light: 'rgba(88, 101, 242, 1)',
                            dark: 'rgba(161, 170, 255, 1)'
                        },
                    }
                ),
            ],
            'bx:link',
            { 
                light: 'rgba(255, 87, 51, 1)',
                dark: 'rgba(255, 130, 100, 1)'
            }
        ),
        createGroupConfig(
            '工具索引',
            [
                createLinkConfig(
                    'FGO',
                    '/zh-CN/Fgo/',
                    'mdi:sword-cross',
                    {
                        iconColors: { 
                            light: 'rgba(194, 110, 40, 1)',
                            dark: 'rgba(255, 189, 118, 1)'
                        },
                    }
                ),
                createLinkConfig(
                    '明日方舟',
                    '/zh-CN/Arknights/',
                    'mdi:shield-outline',
                    {
                        iconColors: { 
                            light: 'rgba(62, 138, 138, 1)',
                            dark: 'rgba(127, 222, 222, 1)'
                        },
                    }
                ),
                createLinkConfig(
                    'Manaweave',
                    '/zh-CN/Mna/',
                    'mdi:book-cog-outline',
                    {
                        iconColors: { 
                            light: 'rgba(120, 88, 160, 1)',
                            dark: 'rgba(198, 162, 255, 1)'
                        },
                    }
                ),
            ],
            'mdi:tools',
            { 
                light: 'rgba(150, 200, 100, 1)',
                dark: 'rgba(200, 255, 150, 1)'
            }
        ),
    ],
};

export default footerConfig; 
