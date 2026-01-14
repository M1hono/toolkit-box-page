/**
 * @fileoverview Shared File System Utilities
 * @description Common functions for file and directory management
 */

const fs = require('fs');
const path = require('path');

/**
 * Ensure a directory exists, creating it recursively if necessary
 * @param {string} dirPath - Directory path
 */
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Recursively list all files in a directory with a specific extension
 * @param {string} dir - Directory to search
 * @param {string} ext - File extension (e.g., '.txt')
 * @param {string} [prefix=''] - Internal path prefix
 * @returns {string[]} - List of relative file paths
 */
function walkDir(dir, ext, prefix = '') {
    const files = [];
    try {
        const list = fs.readdirSync(dir);
        for (const file of list) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            const relativePath = prefix ? `${prefix}/${file}` : file;
            
            if (stat.isDirectory()) {
                files.push(...walkDir(fullPath, ext, relativePath));
            } else if (file.endsWith(ext)) {
                files.push(relativePath);
            }
        }
    } catch (e) {
    }
    return files;
}

/**
 * Recursively copy directory contents
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 * @param {Object} [options] - Copy options
 * @param {Function} [options.filter] - Filter function (src, dest) => boolean
 * @param {boolean} [options.overwrite=true] - Whether to overwrite existing files
 */
function copyDir(src, dest, options = {}) {
    const { filter, overwrite = true } = options;
    
    if (!fs.existsSync(src)) {
        throw new Error(`Source directory does not exist: ${src}`);
    }
    
    ensureDir(dest);
    
    const items = fs.readdirSync(src);
    
    for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        const stat = fs.statSync(srcPath);
        
        if (filter && !filter(srcPath, destPath)) {
            continue;
        }
        
        if (stat.isDirectory()) {
            copyDir(srcPath, destPath, options);
        } else {
            if (!overwrite && fs.existsSync(destPath)) {
                continue;
            }
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * Recursively delete directory and all contents
 * @param {string} dirPath - Directory path to delete
 */
function deleteDir(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
    }
}

module.exports = {
    ensureDir,
    walkDir,
    copyDir,
    deleteDir
};
