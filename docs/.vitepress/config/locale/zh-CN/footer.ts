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
            '',
            [
                createLinkConfig(
                    'GitHub',
                    'https://github.com/M1hono/toolkit-box-page/',
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
        )
    ],
};

export default footerConfig; 