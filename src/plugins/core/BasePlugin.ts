/**
 * Base Plugin class for Cymusic
 * Provides a foundation for creating plugins with default implementations
 */

/// <reference path="../../types/common.d.ts" />
/// <reference path="../../types/music.d.ts" />
/// <reference path="../../types/plugin.d.ts" />
/// <reference path="../../types/album.d.ts" />
/// <reference path="../../types/artist.d.ts" />
/// <reference path="../../types/lyric.d.ts" />

import { IPluginInterface } from './interfaces/IPluginInterface';

/**
 * Base class for Cymusic plugins
 * Implements the IPluginInterface with default implementations
 * Plugin developers can extend this class to create their own plugins
 */
export abstract class BasePlugin implements IPluginInterface {
  // Required metadata
  abstract platform: string;

  // Optional metadata with defaults
  version: string = '0.0.0';
  author?: string;
  srcUrl?: string;
  primaryKey: string[] = ['id'];
  cacheControl: 'cache' | 'no-cache' | 'no-store' = 'no-cache';
  supportedSearchType?: ICommon.SupportMediaType[];
  defaultSearchType?: ICommon.SupportMediaType;
  userVariables?: IPlugin.IUserVariable[];
  hints?: Record<string, string[]>;

  /**
   * Search for media items
   * @param query Search query
   * @param page Page number (1-based)
   * @param type Type of media to search for
   */
  async search<T extends ICommon.SupportMediaType>(
    _query: string,
    _page: number,
    _type: T,
  ): Promise<IPlugin.ISearchResult<T>> {
    return {
      isEnd: true,
      data: [],
    };
  }

  /**
   * Get the media source URL for a music item
   * @param musicItem Music item to get source for
   * @param quality Desired quality
   */
  async getMediaSource(
    musicItem: IMusic.IMusicItemBase,
    _quality: IMusic.IQualityKey,
  ): Promise<IPlugin.IMediaSourceResult | null> {
    // Default implementation returns the URL from the music item
    return musicItem.url ? { url: musicItem.url } : null;
  }

  /**
   * Get additional information for a music item
   * @param musicBase Basic music item information
   */
  async getMusicInfo(
    _musicBase: ICommon.IMediaBase,
  ): Promise<Partial<IMusic.IMusicItem> | null> {
    return null;
  }

  /**
   * Get lyrics for a music item
   * @param musicItem Music item to get lyrics for
   */
  async getLyric(
    _musicItem: IMusic.IMusicItemBase,
  ): Promise<ILyric.ILyricSource | null> {
    return null;
  }

  /**
   * Get album information and tracks
   * @param albumItem Album to get information for
   * @param page Page number (1-based)
   */
  async getAlbumInfo(
    _albumItem: IAlbum.IAlbumItemBase,
    _page: number,
  ): Promise<IPlugin.IAlbumInfoResult | null> {
    return null;
  }

  /**
   * Get music sheet (playlist) information and tracks
   * @param sheetItem Sheet to get information for
   * @param page Page number (1-based)
   */
  async getMusicSheetInfo(
    _sheetItem: IMusic.IMusicSheetItem,
    _page: number,
  ): Promise<IPlugin.ISheetInfoResult | null> {
    return null;
  }

  /**
   * Get works by an artist
   * @param artistItem Artist to get works for
   * @param page Page number (1-based)
   * @param type Type of works to get
   */
  async getArtistWorks<T extends IArtist.ArtistMediaType>(
    _artistItem: IArtist.IArtistItem,
    _page: number,
    _type: T,
  ): Promise<IPlugin.ISearchResult<T>> {
    return {
      isEnd: true,
      data: [],
    };
  }

  /**
   * Import a music sheet from a URL or identifier
   * @param urlLike URL or identifier string
   */
  async importMusicSheet(
    _urlLike: string,
  ): Promise<IMusic.IMusicItem[] | null> {
    return null;
  }

  /**
   * Import a single music item from a URL or identifier
   * @param urlLike URL or identifier string
   */
  async importMusicItem(
    _urlLike: string,
  ): Promise<IMusic.IMusicItem | null> {
    return null;
  }

  /**
   * Get top lists/charts
   */
  async getTopLists(): Promise<IMusic.IMusicSheetGroupItem[]> {
    return [];
  }

  /**
   * Get details for a top list/chart
   * @param topListItem Top list to get details for
   * @param page Page number (1-based)
   */
  async getTopListDetail(
    _topListItem: IMusic.IMusicSheetItemBase,
    _page: number,
  ): Promise<IPlugin.ITopListInfoResult> {
    return {
      isEnd: true,
      musicList: [],
    };
  }

  /**
   * Get recommended sheet tags/categories
   */
  async getRecommendSheetTags(): Promise<IPlugin.IGetRecommendSheetTagsResult> {
    return {
      pinned: [],
      data: [],
    };
  }

  /**
   * Get recommended sheets by tag/category
   * @param tag Tag to get sheets for
   * @param page Page number (1-based)
   */
  async getRecommendSheetsByTag(
    _tag: ICommon.IUnique,
    _page: number = 1,
  ): Promise<ICommon.PaginationResponse<IMusic.IMusicSheetItemBase>> {
    return {
      isEnd: true,
      data: [],
    };
  }
}
