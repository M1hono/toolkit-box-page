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
        ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` 
        : '',
    R2_PUBLIC_URL: 'arkimage.top',
    
    // Data loading priorities
    ENABLE_R2: true,
    USE_R2_FOR_DISPLAY: false,
    USE_R2_FOR_DETECTION: false,
    USE_R2_FIRST_FOR_DATA: true,  // Try R2 first for JSON data
    USE_GITHUB_FIRST_FOR_ASSETS: true,  // Try GitHub first for images
    
    ENABLE_WEBP_CONVERSION: true,
    CLEAN_CACHE_AFTER_UPLOAD: true,
    
    // Asset URLs (images) - GitHub first, R2 fallback
    SOURCE_BASE_URL: 'https://raw.githubusercontent.com/akgcc/arkdata/main/assets/avg/characters/',
    BACKUP_SOURCE_URL: 'https://raw.githubusercontent.com/Aceship/Arknight-Images/main/avg/characters/',
    
    // Data URLs (JSON) - R2 first, GitHub fallback
    R2_DATA_BASE_URL: 'https://arkimage.top/data',
    GITHUB_DATA_BASE_URL: 'https://raw.githubusercontent.com/M1hono/toolkit-box-page/main/docs/src/public/data',
};

module.exports = R2_CONFIG;
