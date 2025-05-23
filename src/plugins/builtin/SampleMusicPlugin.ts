/**
 * Sample Music Plugin for Cymusic
 * Demonstrates the plugin architecture with mock data
 */

/// <reference path="../../types/music.d.ts" />
/// <reference path="../../types/plugin.d.ts" />
/// <reference path="../../types/common.d.ts" />
/// <reference path="../../types/lyric.d.ts" />

import { nanoid } from 'nanoid';
import { BasePlugin } from '../core/BasePlugin';

/**
 * Sample Music Plugin
 * Provides mock music data for demonstration purposes
 */
export class SampleMusicPlugin extends BasePlugin {
  platform = 'sample';
  version = '1.0.0';
  author = 'Cymusic';
  supportedSearchType: ICommon.SupportMediaType[] = ['music', 'album', 'artist', 'sheet'] as ICommon.SupportMediaType[];

  // Mock data for demonstration
  private mockSongs: IMusic.IMusicItem[] = [
    {
      id: '1',
      platform: 'sample',
      title: 'Sample Song 1',
      artist: 'Sample Artist',
      album: 'Sample Album',
      artwork: 'https://via.placeholder.com/300',
      url: 'https://example.com/song1.mp3',
      duration: 180,
    },
    {
      id: '2',
      platform: 'sample',
      title: 'Sample Song 2',
      artist: 'Sample Artist',
      album: 'Sample Album',
      artwork: 'https://via.placeholder.com/300',
      url: 'https://example.com/song2.mp3',
      duration: 210,
    },
    {
      id: '3',
      platform: 'sample',
      title: 'Another Song',
      artist: 'Another Artist',
      album: 'Another Album',
      artwork: 'https://via.placeholder.com/300',
      url: 'https://example.com/song3.mp3',
      duration: 240,
    },
  ];

  /**
   * Search for media items
   * @param query Search query
   * @param page Page number (1-based)
   * @param type Type of media to search for
   */
  async search<T extends ICommon.SupportMediaType>(
    query: string,
    _page: number,
    type: T,
  ): Promise<IPlugin.ISearchResult<T>> {
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (type === 'music') {
      const filteredSongs = this.mockSongs.filter(
        song =>
          song.title.toLowerCase().includes(query.toLowerCase()) ||
          song.artist.toLowerCase().includes(query.toLowerCase()) ||
          song.album.toLowerCase().includes(query.toLowerCase())
      );

      return {
        isEnd: true,
        data: filteredSongs as any,
      };
    } else if (type === 'album') {
      return {
        isEnd: true,
        data: [
          {
            id: '1',
            platform: 'sample',
            title: 'Sample Album',
            artist: 'Sample Artist',
            artwork: 'https://via.placeholder.com/300',
            description: 'A sample album for demonstration',
          }
        ] as any,
      };
    } else if (type === 'artist') {
      return {
        isEnd: true,
        data: [
          {
            id: '1',
            platform: 'sample',
            name: 'Sample Artist',
            avatar: 'https://via.placeholder.com/300',
            description: 'A sample artist for demonstration',
          }
        ] as any,
      };
    } else if (type === 'sheet') {
      return {
        isEnd: true,
        data: [
          {
            id: '1',
            platform: 'sample',
            title: 'Sample Playlist',
            artwork: 'https://via.placeholder.com/300',
            description: 'A sample playlist for demonstration',
          }
        ] as any,
      };
    }

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
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Return the URL from the music item
    return {
      url: musicItem.url || 'https://example.com/fallback.mp3',
    };
  }

  /**
   * Get lyrics for a music item
   * @param musicItem Music item to get lyrics for
   */
  async getLyric(
    _musicItem: IMusic.IMusicItemBase,
  ): Promise<ILyric.ILyricSource | null> {
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Return sample lyrics
    return {
      rawLrc: '[00:00.00] Sample Lyrics\n[00:05.00] For demonstration purposes\n[00:10.00] This is a sample plugin',
    };
  }

  /**
   * Get album information and tracks
   * @param albumItem Album to get information for
   * @param page Page number (1-based)
   */
  async getAlbumInfo(
    albumItem: any,
    _page: number,
  ): Promise<IPlugin.IAlbumInfoResult | null> {
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      isEnd: true,
      albumItem: {
        id: albumItem.id,
        platform: 'sample',
        title: albumItem.title || 'Sample Album',
        artist: albumItem.artist || 'Sample Artist',
        artwork: albumItem.artwork || 'https://via.placeholder.com/300',
        description: 'This is a sample album for demonstration purposes.',
      },
      musicList: this.mockSongs.filter(song => song.album === albumItem.title),
    };
  }

  /**
   * Import a single music item from a URL or identifier
   * @param urlLike URL or identifier string
   */
  async importMusicItem(
    urlLike: string,
  ): Promise<IMusic.IMusicItem | null> {
    // Check if the URL is in a format we can handle
    if (urlLike.includes('sample.com/song/')) {
      const id = urlLike.split('sample.com/song/')[1];

      return {
        id: id || nanoid(),
        platform: 'sample',
        title: `Imported Song ${id}`,
        artist: 'Sample Artist',
        album: 'Sample Album',
        artwork: 'https://via.placeholder.com/300',
        url: urlLike,
        duration: 180,
      };
    }

    return null;
  }
}

// Export an instance of the plugin
export default new SampleMusicPlugin();
