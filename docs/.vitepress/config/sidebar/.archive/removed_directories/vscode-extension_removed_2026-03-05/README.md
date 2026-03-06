# Archived Directory: vscode-extension

**Archive Date**: 2026-03-05T02:02:30.487Z
**Original Location**: frontmatter/vscode-extension
**Reason**: Physical directory no longer exists in docs structure

## Contents
This archive contains both the configuration files and metadata for a directory that was removed from the physical docs structure.

- `config/` - Contains the JSON configuration files (locales.json, order.json, etc.)
- `metadata/` - Contains the metadata files tracking configuration history

## Restoration
To restore this directory:

1. **Recreate the physical directory**: 
   `mkdir -p docs/zh-CN/frontmatter/vscode-extension/`

2. **Restore configuration files**:
   `cp -r config/vscode-extension/ .vitepress/config/sidebar/zh-CN/frontmatter/vscode-extension/`

3. **Restore metadata files**:
   `cp -r metadata/vscode-extension/ .vitepress/config/sidebar/.metadata/zh-CN/frontmatter/vscode-extension/`

4. **Restart the development server**

## Archive Structure
```
vscode-extension_removed_2026-03-05/
├── README.md (this file)
├── config/vscode-extension/     # Original config files
└── metadata/vscode-extension/   # Original metadata files
```
