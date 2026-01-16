/**
 * @fileoverview Cloudflare R2 Configuration
 * @description Configuration for Cloudflare R2 object storage using environment variables
 */

const R2_CONFIG = {
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || '',
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '',
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || '',
    R2_BUCKET_NAME: 'arknights-chara-image',
    
    R2_ENDPOINT: process.env.R2_ACCOUNT_ID 
        ? `https:
        : '',
    R2_PUBLIC_URL: 'arkimage.top',
    

    ENABLE_R2: true,
    USE_R2_FOR_DISPLAY: false,
    USE_R2_FOR_DETECTION: false,
    USE_R2_FIRST_FOR_DATA: true,
    USE_GITHUB_FIRST_FOR_ASSETS: true,
    
    ENABLE_WEBP_CONVERSION: true,
    CLEAN_CACHE_AFTER_UPLOAD: true,
    

    SOURCE_BASE_URL: 'https:
    BACKUP_SOURCE_URL: 'https:
    

    R2_DATA_BASE_URL: 'https:
    GITHUB_DATA_BASE_URL: 'https:
};

module.exports = R2_CONFIG;
