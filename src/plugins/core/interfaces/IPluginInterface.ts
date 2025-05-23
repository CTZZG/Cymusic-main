/**
 * Plugin Interface for Cymusic
 * Defines the contract between the core app and plugins
 */

/// <reference path="../../../types/common.d.ts" />
/// <reference path="../../../types/music.d.ts" />
/// <reference path="../../../types/plugin.d.ts" />
/// <reference path="../../../types/album.d.ts" />
/// <reference path="../../../types/artist.d.ts" />
/// <reference path="../../../types/lyric.d.ts" />

/**
 * Core plugin interface that all plugins must implement
 */
export interface IPluginInterface {
  // Plugin metadata
  platform: string;                 // Plugin name/platform
  version?: string;                 // Plugin version
  author?: string;                  // Plugin author
  srcUrl?: string;                  // URL for plugin updates
  primaryKey?: string[];            // Primary keys for identifying media items
  cacheControl?: 'cache' | 'no-cache' | 'no-store'; // Cache strategy
  supportedSearchType?: ICommon.SupportMediaType[]; // Supported search types
  defaultSearchType?: ICommon.SupportMediaType;     // Default search type
  userVariables?: IPlugin.IUserVariable[];          // User-defined variables
  hints?: Record<string, string[]>; // Hints for UI display

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
