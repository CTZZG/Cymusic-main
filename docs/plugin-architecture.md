# Cymusic Plugin Architecture

## Overview

Cymusic will be transformed into a core shell + plugin architecture system, where:

1. **Core Shell**: Handles UI, playback management, and system features
2. **Plugins**: Provide music data/playback functionality

## Plugin System Design

### Plugin Definition

A plugin is a CommonJS module that exports specific functions and properties according to the plugin protocol. Each plugin represents a music source or service.

### Plugin Interface

```typescript
interface IPluginInstance {
  // Plugin metadata
  platform: string;                 // Plugin name/platform
  version: string;                  // Plugin version
  author?: string;                  // Plugin author
  srcUrl?: string;                  // URL for plugin updates
  primaryKey?: string[];            // Primary keys for identifying media items
  cacheControl?: 'cache' | 'no-cache' | 'no-store'; // Cache strategy
  supportedSearchType?: ICommon.SupportMediaType[]; // Supported search types
  
  // Core functionality
  search?: <T extends ICommon.SupportMediaType>(
    query: string,
    page: number,
    type: T,
  ) => Promise<IPlugin.ISearchResult<T>>;
  
  getMediaSource?: (
    musicItem: IMusic.IMusicItemBase,
    quality: IMusic.IQualityKey,
  ) => Promise<IPlugin.IMediaSourceResult | null>;
  
  // Additional functionality
  getMusicInfo?: (
    musicBase: ICommon.IMediaBase,
  ) => Promise<Partial<IMusic.IMusicItem> | null>;
  
  getLyric?: (
    musicItem: IMusic.IMusicItemBase,
  ) => Promise<ILyric.ILyricSource | null>;
  
  getAlbumInfo?: (
    albumItem: IAlbum.IAlbumItemBase,
    page: number,
  ) => Promise<IPlugin.IAlbumInfoResult | null>;
  
  getMusicSheetInfo?: (
    sheetItem: IMusic.IMusicSheetItem,
    page: number,
  ) => Promise<IPlugin.ISheetInfoResult | null>;
  
  getArtistWorks?: <T extends IArtist.ArtistMediaType>(
    artistItem: IArtist.IArtistItem,
    page: number,
    type: T,
  ) => Promise<IPlugin.ISearchResult<T>>;
  
  importMusicSheet?: (
    urlLike: string,
  ) => Promise<IMusic.IMusicItem[] | null>;
  
  importMusicItem?: (
    urlLike: string,
  ) => Promise<IMusic.IMusicItem | null>;
  
  getTopLists?: () => Promise<IMusic.IMusicSheetGroupItem[]>;
  
  getTopListDetail?: (
    topListItem: IMusic.IMusicSheetItemBase,
    page: number,
  ) => Promise<IPlugin.ITopListInfoResult>;
  
  getRecommendSheetTags?: () => Promise<IPlugin.IGetRecommendSheetTagsResult>;
  
  getRecommendSheetsByTag?: (
    tag: ICommon.IUnique,
    page?: number,
  ) => Promise<ICommon.PaginationResponse<IMusic.IMusicSheetItemBase>>;
}
```

### Plugin Manager

The Plugin Manager is responsible for:

1. Loading plugins
2. Managing plugin lifecycle
3. Providing an interface for the core app to interact with plugins

```typescript
interface IPluginManager {
  // Plugin management
  loadPlugin(pluginPath: string): Promise<IPluginInstance>;
  unloadPlugin(pluginId: string): void;
  getPlugin(pluginId: string): IPluginInstance | null;
  getAllPlugins(): IPluginInstance[];
  
  // Plugin operations
  search<T extends ICommon.SupportMediaType>(
    query: string,
    page: number,
    type: T,
    pluginIds?: string[]
  ): Promise<Record<string, IPlugin.ISearchResult<T>>>;
  
  getMediaSource(
    musicItem: IMusic.IMusicItem,
    quality: IMusic.IQualityKey
  ): Promise<IPlugin.IMediaSourceResult | null>;
  
  // Other operations corresponding to plugin methods
}
```

## Plugin Loading and Execution

1. Plugins are stored as JS files in a designated directory
2. The Plugin Manager scans this directory on app startup
3. Each plugin is loaded and validated
4. The core app interacts with plugins through the Plugin Manager

## Plugin Storage

Plugins will be stored in:
- Android: `Android/data/com.cymusic/files/plugins/`
- iOS: App's document directory under `plugins/`

## Plugin Installation

Users can install plugins by:
1. Importing a local JS file
2. Providing a URL to a remote JS file
3. Selecting from a plugin repository

## Plugin Security

Since plugins run in the same context as the app, security considerations include:
1. Warning users about the risks of installing untrusted plugins
2. Implementing basic validation of plugin structure
3. Providing a way to disable or uninstall problematic plugins

## Core-Plugin Communication

The core app will communicate with plugins through the Plugin Manager, which will:
1. Route requests to appropriate plugins
2. Handle errors and timeouts
3. Manage caching according to plugin specifications
4. Aggregate results from multiple plugins when needed
