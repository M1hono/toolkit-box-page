# Scripts Directory

Multi-language data processing system for Arknights and FGO character data.

## 🏗️ Architecture Overview

### Configuration Layer
- **`project-config.cjs`** - Central configuration for languages, games, and data paths
- **`r2-config.cjs`** - Cloudflare R2 storage configuration (uses environment variables)

### Shared Utilities
- **`shared/network-utils.cjs`** - HTTP request utilities
- **`shared/file-utils.cjs`** - File system operations and directory management

## 🏹 Arknights System

### Main Entry Points
- **`arknights/main-fetcher.cjs`** - Primary orchestrator for data acquisition
- **`arknights/story-syncer.cjs`** - Story data synchronization manager

### API Layer
- **`arknights/api/arknights-client.cjs`** - Game data repository client
- **`arknights/api/characters-api.cjs`** - Character data management
- **`arknights/api/scan-stats-api.cjs`** - Scan state tracking

### Core Processing
- **`arknights/core/story-downloader.cjs`** - Story file acquisition
- **`arknights/core/story-parser.cjs`** - Character data extraction from stories
- **`arknights/core/variant-generator.cjs`** - Character variant discovery
- **`arknights/core/data-consolidator.cjs`** - Multi-language data consolidation

### Worker Threads
- **`arknights/workers/story-parser-worker.cjs`** - Parallel story parsing
- **`arknights/workers/image-check-worker.cjs`** - Parallel image variant verification

## ⚔️ FGO System

### Main Entry Points
- **`fgo/main-fetcher.cjs`** - Primary orchestrator for servant data

### API Layer
- **`fgo/api/atlas-academy.cjs`** - Atlas Academy API client

### Core Processing
- **`fgo/core/servant-processor.cjs`** - Servant data processing and search index generation

## 📁 Data Structure

### Multi-Language Organization
```
docs/src/public/data/
├── global/
│   ├── arknights/
│   │   ├── characters.json       # Global character attributes
│   │   ├── scan_stats.json       # Scan state tracking
│   │   └── story_files.json      # Story file mapping
│   └── fgo/
│       └── metadata.json         # Global FGO metadata
├── zh_cn/
│   ├── arknights/
│   │   ├── names.json            # Chinese character names
│   │   └── story/                # Chinese story files
│   └── fgo/
│       ├── servants.json         # Chinese servant data
│       ├── search_index.json     # Chinese search index
│       ├── nameMapping.json      # JP→CN name mapping
│       ├── translations.json     # Translation data
│       └── no_translation.json   # Untranslated entries
└── en_us/
    ├── arknights/
    │   ├── names.json            # English character names
    │   └── story/                # English story files
    └── fgo/
        ├── servants.json         # English servant data
        └── search_index.json     # English search index
```

## 🚀 Usage Examples

### Arknights Data Fetching
```bash
# Full data synchronization for all supported languages
node arknights/main-fetcher.cjs

# Story data synchronization only
node arknights/story-syncer.cjs
```

### FGO Data Fetching
```bash
# Fetch and process FGO servant data
node fgo/main-fetcher.cjs
```

## 🔧 Environment Configuration

Required environment variables:
```bash
export R2_ACCOUNT_ID="your_r2_account_id"
export R2_ACCESS_KEY_ID="your_r2_access_key_id" 
export R2_SECRET_ACCESS_KEY="your_r2_secret_access_key"
```

## 🎯 Key Features

### Multi-Language Support
- **Arknights**: Chinese (zh_CN) and English (en_US) support
- **FGO**: Chinese (zh_CN), English (en_US), and Japanese (ja_JP) support
- Automatic language path resolution via `PROJECT_CONFIG`

### Data Consolidation Strategy
- **Global Data**: Shared character attributes, scan states, story mappings
- **Language-Specific Data**: Names, translations, localized content
- **Master Source**: Chinese data used as authoritative source for Arknights global data

### Performance Optimization
- Worker thread parallelization for CPU-intensive tasks
- Batch processing with configurable concurrency limits
- Smart variant detection with binary search algorithms
- Incremental updates based on scan state tracking

### Security
- Environment variable-based credential management
- Secure R2 integration for image storage
- No hardcoded sensitive information

## 📊 Processing Workflow

### Arknights Pipeline
1. **Discovery**: Identify available story files from game data repositories
2. **Download**: Batch download story files with retry logic
3. **Parse**: Extract character data using worker threads
4. **Variants**: Verify character image variants via HTTP checks
5. **Consolidate**: Merge data across languages using Chinese as master source
6. **Output**: Generate language-specific and global data files

### FGO Pipeline
1. **Fetch**: Retrieve servant data from Atlas Academy API
2. **Process**: Extract image data and generate search indexes
3. **Translate**: Apply Chinese name mappings to Japanese data
4. **Output**: Generate language-specific servant databases

## 🛠️ Code Standards

- **JSDoc Documentation**: English-only comprehensive documentation
- **No Inline Comments**: Clean, self-documenting code
- **File Size Limit**: Maximum 400 lines per script
- **Path Safety**: Robust path handling with `path.resolve(__dirname, ...)`
- **Error Handling**: Comprehensive error handling and logging
- **Modularity**: Single responsibility principle with clear API boundaries

## 📈 Performance Metrics

| Operation | Throughput | Concurrency |
|-----------|------------|-------------|
| Story File Parsing | ~100 files/min | 4-8 workers |
| Image Variant Check | ~50 chars/min | 6 workers |
| Data Consolidation | ~1000 chars/sec | Single-threaded |
| File Downloads | ~200 files/min | 10 concurrent |

## 🔍 Troubleshooting

### Common Issues
1. **Network Timeouts**: Adjust timeout values in network-utils.cjs
2. **Memory Usage**: Reduce worker count or batch sizes
3. **Path Errors**: Ensure proper working directory and absolute paths
4. **Missing Environment**: Verify R2 credentials are set

### Debug Mode
Enable detailed logging by setting environment variable:
```bash
export DEBUG=1
```