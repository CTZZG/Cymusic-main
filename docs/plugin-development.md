# Cymusic Plugin Development Guide

## Introduction

Cymusic uses a plugin system to provide music data and playback functionality. This guide explains how to create plugins for Cymusic.

## Plugin Structure

A Cymusic plugin is a JavaScript file that exports an object implementing the `IPluginInterface` interface. The plugin can be written in JavaScript or TypeScript (and then compiled to JavaScript).

### Basic Plugin Structure

```javascript
/**
 * Example Plugin for Cymusic
 */

// Plugin definition
const plugin = {
  // Required metadata
  platform: 'example',
  version: '1.0.0',
  author: 'Your Name',
  
  // Optional metadata
  srcUrl: 'https://example.com/plugin.js',
  primaryKey: ['id'],
  supportedSearchType: ['music', 'album', 'artist', 'sheet'],
  
  // Core functionality
  async search(query, page, type) {
    // Implementation
    return {
      isEnd: true,
      data: []
    };
  },
  
  async getMediaSource(musicItem, quality) {
    // Implementation
    return {
      url: 'https://example.com/song.mp3'
    };
  },
  
  // Additional functionality
  async getLyric(musicItem) {
    // Implementation
    return {
      rawLrc: '[00:00.00] Example lyrics'
    };
  }
};

// Export the plugin
export default plugin;
```

## Plugin Interface

The plugin interface defines the methods and properties that a plugin can implement:

### Required Properties

- `platform`: String - The name of the plugin/platform
- `version`: String - The plugin version (semver format)

### Optional Properties

- `author`: String - The plugin author
- `srcUrl`: String - URL for plugin updates
- `primaryKey`: String[] - Primary keys for identifying media items
- `cacheControl`: 'cache' | 'no-cache' | 'no-store' - Cache strategy
- `supportedSearchType`: String[] - Supported search types
- `defaultSearchType`: String - Default search type
- `userVariables`: Object[] - User-defined variables
- `hints`: Record<string, string[]> - Hints for UI display

### Core Methods

#### `search(query, page, type)`

Search for media items.

- `query`: String - Search query
- `page`: Number - Page number (1-based)
- `type`: String - Type of media to search for ('music', 'album', 'artist', 'sheet')
- Returns: Promise<{ isEnd: boolean, data: any[] }>

#### `getMediaSource(musicItem, quality)`

Get the media source URL for a music item.

- `musicItem`: Object - Music item to get source for
- `quality`: String - Desired quality
- Returns: Promise<{ url: string } | null>

### Additional Methods

#### `getMusicInfo(musicBase)`

Get additional information for a music item.

- `musicBase`: Object - Basic music item information
- Returns: Promise<Partial<IMusicItem> | null>

#### `getLyric(musicItem)`

Get lyrics for a music item.

- `musicItem`: Object - Music item to get lyrics for
- Returns: Promise<{ rawLrc: string } | null>

#### `getAlbumInfo(albumItem, page)`

Get album information and tracks.

- `albumItem`: Object - Album to get information for
- `page`: Number - Page number (1-based)
- Returns: Promise<{ isEnd: boolean, albumItem: Object, musicList: Object[] } | null>

#### `getMusicSheetInfo(sheetItem, page)`

Get music sheet (playlist) information and tracks.

- `sheetItem`: Object - Sheet to get information for
- `page`: Number - Page number (1-based)
- Returns: Promise<{ isEnd: boolean, musicList: Object[] } | null>

## Available Libraries

Plugins can use the following libraries:

- `crypto-js`: For cryptographic operations
- `cheerio`: For HTML parsing
- `axios`: For HTTP requests
- `dayjs`: For date manipulation

## Plugin Development Best Practices

1. **Error Handling**: Always handle errors gracefully and provide meaningful error messages.
2. **Caching**: Use appropriate caching strategies to minimize network requests.
3. **Performance**: Keep your plugin efficient to ensure good user experience.
4. **Versioning**: Use semantic versioning for your plugin.
5. **Documentation**: Document your plugin's functionality and any special requirements.

## Example Plugin

Here's a complete example of a simple plugin that provides music from a fictional API:

```javascript
/**
 * Example Music Plugin for Cymusic
 */

import axios from 'axios';

const API_BASE = 'https://example-music-api.com/api';

const plugin = {
  platform: 'example',
  version: '1.0.0',
  author: 'Your Name',
  srcUrl: 'https://example.com/example-plugin.js',
  primaryKey: ['id'],
  supportedSearchType: ['music', 'album', 'artist'],
  
  async search(query, page, type) {
    try {
      const response = await axios.get(`${API_BASE}/search`, {
        params: {
          q: query,
          page,
          type
        }
      });
      
      return {
        isEnd: page >= response.data.totalPages,
        data: response.data.items.map(item => ({
          id: item.id,
          platform: this.platform,
          title: item.title,
          artist: item.artist,
          album: item.album,
          artwork: item.coverUrl,
          url: item.previewUrl,
          duration: item.duration
        }))
      };
    } catch (error) {
      console.error('Search error:', error);
      return {
        isEnd: true,
        data: []
      };
    }
  },
  
  async getMediaSource(musicItem, quality) {
    try {
      const response = await axios.get(`${API_BASE}/song/${musicItem.id}`, {
        params: { quality }
      });
      
      return {
        url: response.data.url
      };
    } catch (error) {
      console.error('Get media source error:', error);
      return null;
    }
  },
  
  async getLyric(musicItem) {
    try {
      const response = await axios.get(`${API_BASE}/lyrics/${musicItem.id}`);
      
      return {
        rawLrc: response.data.lyrics
      };
    } catch (error) {
      console.error('Get lyrics error:', error);
      return null;
    }
  }
};

export default plugin;
```

## Publishing Your Plugin

To publish your plugin:

1. Host your plugin JavaScript file on a web server
2. Share the URL with Cymusic users
3. Users can install your plugin from the Plugin Manager

## Testing Your Plugin

Before publishing, test your plugin thoroughly:

1. Test all implemented methods with various inputs
2. Verify error handling works correctly
3. Check performance with large datasets
4. Test on different network conditions
