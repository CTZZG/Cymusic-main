/**
 * Plugin Manager for Cymusic
 * Main interface for the core app to interact with plugins
 */

/// <reference path="../../types/common.d.ts" />
/// <reference path="../../types/music.d.ts" />
/// <reference path="../../types/plugin.d.ts" />
/// <reference path="../../types/album.d.ts" />
/// <reference path="../../types/artist.d.ts" />
/// <reference path="../../types/lyric.d.ts" />

// Import the registry
import { PluginRegistry } from './PluginRegistry';

// Logger function
const errorLog = (message: string, error?: any) => {
  console.error(`[PluginManager] ${message}`, error);
};

/**
 * Plugin Manager
 * Main interface for the core app to interact with plugins
 */
export class PluginManager {
  private static instance: PluginManager;
  private registry: PluginRegistry;

  /**
   * Get the singleton instance
   */
  static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  /**
   * Private constructor
   */
  private constructor() {
    this.registry = PluginRegistry.getInstance();
  }

  /**
   * Initialize the plugin manager
   */
  async initialize(): Promise<void> {
    await this.registry.initialize();
  }

  /**
   * Install a plugin from a local file
   * @param pluginPath Path to the plugin file
   * @param notCheckVersion Whether to skip version checking
   */
  async installPluginFromLocalFile(
    _pluginPath: string,
    notCheckVersion: boolean = false,
  ): Promise<{ success: boolean; message?: string }> {
    // Note: pluginPath is not used in this implementation
    // Convert boolean to options object if needed by the registry
    return this.registry.installPluginFromLocalFile({ notCheckVersion } as any);
  }

  /**
   * Install a plugin from a URL
   * @param url URL to the plugin
   * @param notCheckVersion Whether to skip version checking
   */
  async installPluginFromUrl(
    url: string,
    notCheckVersion: boolean = false,
  ): Promise<{ success: boolean; message?: string }> {
    return this.registry.installPluginFromUrl(url, {
      notCheckVersion,
    });
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): Array<{
    name: string;
    hash: string;
    enabled: boolean;
    version?: string;
    author?: string;
  }> {
    return this.registry.getAllPlugins().map(plugin => ({
      name: plugin.name,
      hash: plugin.hash,
      enabled: plugin.meta.enabled,
      version: plugin.instance.version,
      author: plugin.instance.author,
    }));
  }

  /**
   * Set a plugin's enabled state
   * @param name Plugin name
   * @param enabled Whether the plugin is enabled
   */
  setPluginEnabled(name: string, enabled: boolean): void {
    this.registry.setPluginEnabled(name, enabled);
  }

  /**
   * Check if a plugin is enabled
   * @param name Plugin name
   */
  isPluginEnabled(name: string): boolean {
    return this.registry.isPluginEnabled(name);
  }

  /**
   * Search for media items across all enabled plugins
   * @param query Search query
   * @param page Page number (1-based)
   * @param type Type of media to search for
   * @param pluginNames Optional list of plugin names to search in
   */
  async search<T extends ICommon.SupportMediaType>(
    query: string,
    page: number,
    type: T,
    pluginNames?: string[],
  ): Promise<Record<string, IPlugin.ISearchResult<T>>> {
    const results: Record<string, IPlugin.ISearchResult<T>> = {};
    const plugins = this.registry.getAllPlugins().filter(
      plugin =>
        plugin.meta.enabled &&
        (!pluginNames || pluginNames.includes(plugin.name)) &&
        (!plugin.instance.supportedSearchType ||
         plugin.instance.supportedSearchType.includes(type))
    );

    await Promise.all(
      plugins.map(async plugin => {
        try {
          if (plugin.instance.search) {
            const result = await plugin.instance.search(query, page, type);

            // Add platform to each item
            if (result.data) {
              result.data.forEach((item: any) => {
                item.platform = plugin.name;
              });
            }

            results[plugin.name] = result;
          }
        } catch (e) {
          errorLog(`Error searching in plugin ${plugin.name}`, e);
        }
      }),
    );

    return results;
  }

  /**
   * Get media source for a music item
   * @param musicItem Music item
   * @param quality Desired quality
   */
  async getMediaSource(
    musicItem: IMusic.IMusicItemBase,
    quality: IMusic.IQualityKey = '128k', // Use 128k as default quality
  ): Promise<IPlugin.IMediaSourceResult | null> {
    const plugin = this.registry.getPluginByName(musicItem.platform);

    if (!plugin || !plugin.meta.enabled) {
      return null;
    }

    try {
      if (plugin.instance.getMediaSource) {
        return await plugin.instance.getMediaSource(musicItem, quality);
      } else if (musicItem.url) {
        return { url: musicItem.url };
      }
    } catch (e) {
      errorLog(`Error getting media source from plugin ${plugin.name}`, e);
    }

    return null;
  }

  /**
   * Get music info
   * @param musicItem Music item
   */
  async getMusicInfo(
    musicItem: ICommon.IMediaBase,
  ): Promise<Partial<IMusic.IMusicItem> | null> {
    const plugin = this.registry.getPluginByName(musicItem.platform);

    if (!plugin || !plugin.meta.enabled) {
      return null;
    }

    try {
      if (plugin.instance.getMusicInfo) {
        return await plugin.instance.getMusicInfo(musicItem);
      }
    } catch (e) {
      errorLog(`Error getting music info from plugin ${plugin.name}`, e);
    }

    return null;
  }

  /**
   * Get lyrics for a music item
   * @param musicItem Music item
   */
  async getLyric(
    musicItem: IMusic.IMusicItemBase,
  ): Promise<ILyric.ILyricSource | null> {
    const plugin = this.registry.getPluginByName(musicItem.platform);

    if (!plugin || !plugin.meta.enabled) {
      return null;
    }

    try {
      if (plugin.instance.getLyric) {
        return await plugin.instance.getLyric(musicItem);
      }
    } catch (e) {
      errorLog(`Error getting lyrics from plugin ${plugin.name}`, e);
    }

    return null;
  }

  /**
   * Get album info
   * @param albumItem Album item
   * @param page Page number (1-based)
   */
  async getAlbumInfo(
    albumItem: IAlbum.IAlbumItemBase,
    page: number,
  ): Promise<IPlugin.IAlbumInfoResult | null> {
    const plugin = this.registry.getPluginByName(albumItem.platform);

    if (!plugin || !plugin.meta.enabled) {
      return null;
    }

    try {
      if (plugin.instance.getAlbumInfo) {
        const result = await plugin.instance.getAlbumInfo(albumItem, page);

        // Add platform to each music item
        if (result?.musicList) {
          result.musicList.forEach((item: any) => {
            item.platform = plugin.name;
          });
        }

        return result;
      }
    } catch (e) {
      errorLog(`Error getting album info from plugin ${plugin.name}`, e);
    }

    return null;
  }

  /**
   * Get music sheet info
   * @param sheetItem Sheet item
   * @param page Page number (1-based)
   */
  async getMusicSheetInfo(
    sheetItem: IMusic.IMusicSheetItem,
    page: number,
  ): Promise<IPlugin.ISheetInfoResult | null> {
    const plugin = this.registry.getPluginByName(sheetItem.platform);

    if (!plugin || !plugin.meta.enabled) {
      return null;
    }

    try {
      if (plugin.instance.getMusicSheetInfo) {
        const result = await plugin.instance.getMusicSheetInfo(sheetItem, page);

        // Add platform to each music item
        if (result?.musicList) {
          result.musicList.forEach((item: any) => {
            item.platform = plugin.name;
          });
        }

        return result;
      }
    } catch (e) {
      errorLog(`Error getting music sheet info from plugin ${plugin.name}`, e);
    }

    return null;
  }
}
