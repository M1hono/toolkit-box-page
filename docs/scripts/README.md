# Scripts Directory

Multi-language data processing system for Arknights and FGO character data.

## Architecture Overview

### Configuration Layer
- **`project-config.cjs`** - Central configuration for languages, games, and data paths
- **`r2-config.cjs`** - Cloudflare R2 storage configuration (uses environment variables)

### Shared Utilities
- **`shared/network-utils.cjs`** - HTTP request utilities
- **`shared/file-utils.cjs`** - File system operations and directory management

## Arknights System

### Main Entry Points
- **`arknights/main-fetcher.cjs`** - Primary orchestrator for data acquisition
- **`arknights/syncStoryData.cjs`** - Story data synchronization manager
- **`arknights/updateNamesOnly.cjs`** - Updates names and generates indices without full rescan
- **`arknights/cleanupData.cjs`** - Normalizes all character IDs to lowercase

### API Layer
- **`arknights/api/arknights-client.cjs`** - Game data repository client
- **`arknights/api/characters-api.cjs`** - Character data management (now includes storys.json and search_index.json)
- **`arknights/api/scan-stats-api.cjs`** - Scan state tracking

### Core Processing
- **`arknights/core/story-downloader.cjs`** - Story file acquisition
- **`arknights/core/story-parser.cjs`** - Character data extraction from stories
- **`arknights/core/variant-generator.cjs`** - Character variant discovery
- **`arknights/core/data-consolidator.cjs`** - Multi-language data consolidation

### Worker Threads
- **`arknights/workers/story-parser-worker.cjs`** - Parallel story parsing
- **`arknights/workers/image-check-worker.cjs`** - Parallel image variant verification

## FGO System

### Main Entry Points
- **`fgo/main-fetcher.cjs`** - Primary orchestrator for servant data

### API Layer
- **`fgo/api/atlas-academy.cjs`** - Atlas Academy API client

### Core Processing
- **`fgo/core/servant-processor.cjs`** - Servant data processing and search index generation

## Data Structure

### Multi-Language Organization
```
docs/src/public/data/
├── global/
│   ├── arknights/
│   │   ├── characters.json       # Global character attributes
│   │   ├── scan_stats.json       # Scan state tracking
│   │   └── story_files.json      # Legacy: Global story mapping
│   └── fgo/
│       └── metadata.json         # Global FGO metadata
├── zh_cn/
│   ├── arknights/
│   │   ├── names.json            # Chinese character names
│   │   ├── storys.json           # Chinese story file mappings (NEW)
│   │   ├── search_index.json     # Name→ID search index (NEW)
│   │   └── story/                # Chinese story files (gitignored)
│   └── fgo/
│       ├── servants.json         # Chinese servant data
│       ├── search_index.json     # Chinese search index
│       ├── nameMapping.json      # JP→CN name mapping
│       ├── translations.json     # Translation data
│       └── no_translation.json   # Untranslated entries
├── en_us/
│   ├── arknights/
│   │   ├── names.json            # English character names
│   │   ├── storys.json           # English story file mappings (NEW)
│   │   ├── search_index.json     # Name→ID search index (NEW)
│   │   └── story/                # English story files (gitignored)
│   └── fgo/
│       ├── servants.json         # English servant data
│       └── search_index.json     # English search index
└── ja_jp/
    ├── arknights/
    │   ├── names.json            # Japanese character names
    │   ├── storys.json           # Japanese story file mappings (NEW)
    │   ├── search_index.json     # Name→ID search index (NEW)
    │   └── story/                # Japanese story files (gitignored)
    └── fgo/
        ├── servants.json         # Japanese servant data
        └── search_index.json     # Japanese search index
```

## Usage Examples

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

## Environment Configuration

Required environment variables:
```bash
export R2_ACCOUNT_ID="your_r2_account_id"
export R2_ACCESS_KEY_ID="your_r2_access_key_id" 
export R2_SECRET_ACCESS_KEY="your_r2_secret_access_key"
```

## Key Features

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

## Processing Workflow

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

## Code Standards

- **JSDoc Documentation**: English-only comprehensive documentation
- **No Inline Comments**: Clean, self-documenting code
- **File Size Limit**: Maximum 400 lines per script
- **Path Safety**: Robust path handling with `path.resolve(__dirname, ...)`
- **Error Handling**: Comprehensive error handling and logging
- **Modularity**: Single responsibility principle with clear API boundaries

## Performance Metrics

| Operation | Throughput | Concurrency |
|-----------|------------|-------------|
| Story File Parsing | ~100 files/min | 4-8 workers |
| Image Variant Check | ~50 chars/min | 6 workers |
| Data Consolidation | ~1000 chars/sec | Single-threaded |
| File Downloads | ~200 files/min | 10 concurrent |

## Frontend API Utilities

Located in `docs/.vitepress/utils/chara/arknights/core/`, these composables provide access to the generated data files:

### useArknightsData

Comprehensive data access composable for character information and story mappings:

```typescript
import { useArknightsData } from '@/utils/chara/arknights';

const {
  loadLanguageData,
  getCharacterIdByName,
  getCharacterById,
  getStoriesForCharacter,
  getStoryReadersForCharacter,
  searchCharacters,
  stats
} = useArknightsData();

// Load data for a language
await loadLanguageData('en_us');

// Search by name using search_index.json
const charId = getCharacterIdByName('Bounty Hunter'); 
// Returns: 'avg_npc_009' (single ID)
// OR: ['avg_181_flower_1', 'avg_1022_flwr2_1'] (multiple IDs if duplicate name)

// Get all IDs for a name (always returns array)
const allIds = getAllCharacterIdsByName('莱娜');
// Returns: ['avg_181_flower_1', 'avg_1022_flwr2_1']

// Get full character info
const character = getCharacterById('avg_npc_009');

// Get stories where character appears
const stories = getStoriesForCharacter('avg_npc_009');
// Returns: ['activities/a001/level_a001_01_beg.txt', ...]

// Get story reader URLs
const readers = getStoryReadersForCharacter('avg_npc_009');
// Returns: [{ path: '...', urls: { textReader: '...', akgcc: '...' } }]
```

### useArknightsStoryReader

Converts internal story paths to external reader URLs:

```typescript
import { useArknightsStoryReader } from '@/utils/chara/arknights';

const { getStoryReaderUrls } = useArknightsStoryReader();

const urls = getStoryReaderUrls('activities/a001/level_a001_01_beg.txt', 'en_us');
// Returns:
// {
//   textReader: 'https://050644zf.github.io/ArknightsStoryTextReader/#/en_US/content?f=...',
//   akgcc: 'https://akgcc.github.io/story/#side&a001&0'
// }
```

### Data Files Generated

- **`storys.json`**: Character ID → Story file paths (language-specific)
  ```json
  {
    "avg_npc_009": ["activities/a001/level_a001_01_beg.txt", ...]
  }
  ```
  
- **`search_index.json`**: Character name → Character ID(s) (language-specific)
  ```json
  {
    "Bounty Hunter": "avg_npc_009",
    "莱娜": ["avg_181_flower_1", "avg_1022_flwr2_1"]
  }
  ```
  *Note: Returns string for unique names, array for duplicate names*
  
- **`names.json`**: Character ID → Names data (language-specific)
- **`characters.json`**: Character ID → Metadata (global)

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