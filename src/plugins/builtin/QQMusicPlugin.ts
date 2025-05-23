/**
 * QQ Music Plugin for Cymusic
 * Provides music data from QQ Music
 */

import axios from 'axios';
import { ICommon } from '../../types/common';
import { ILyric } from '../../types/lyric';
import { IMusic } from '../../types/music';
import { IPlugin } from '../../types/plugin';
import { BasePlugin } from '../core/BasePlugin';

/**
 * QQ Music Plugin
 * Provides music data from QQ Music
 */
export class QQMusicPlugin extends BasePlugin {
  platform = 'qq';
  version = '1.0.0';
  author = 'Cymusic';
  supportedSearchType: ICommon.SupportMediaType[] = ['music', 'album', 'artist', 'sheet'];

  /**
   * Search for media items
   * @param query Search query
   * @param page Page number (1-based)
   * @param type Type of media to search for
   */
  async search<T extends ICommon.SupportMediaType>(
    query: string,
    page: number,
    type: T,
  ): Promise<IPlugin.ISearchResult<T>> {
    // Convert type to QQ Music search type
    let searchType = 0; // Default to song search
    if (type === 'album') {
      searchType = 2;
    } else if (type === 'artist') {
      searchType = 1;
    } else if (type === 'sheet') {
      searchType = 3;
    }

    try {
      const response = await axios.post('https://u.y.qq.com/cgi-bin/musicu.fcg', {
        comm: {
          ct: 24,
          cv: 0,
        },
        req: {
          method: 'DoSearchForQQMusicDesktop',
          module: 'music.search.SearchCgiService',
          param: {
            query,
            page_num: page - 1, // QQ Music uses 0-based page index
            num_per_page: 20,
            search_type: searchType,
          },
        },
      }, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://y.qq.com/',
          'Content-Type': 'application/json',
        },
      });

      const data = response.data?.req?.data;

      if (!data) {
        return {
          isEnd: true,
          data: [],
        };
      }

      if (type === 'music') {
        return this.parseSongSearchResult(data);
      } else if (type === 'album') {
        return this.parseAlbumSearchResult(data);
      } else if (type === 'artist') {
        return this.parseArtistSearchResult(data);
      } else if (type === 'sheet') {
        return this.parseSheetSearchResult(data);
      }

      return {
        isEnd: true,
        data: [],
      };
    } catch (error) {
      console.error('QQ Music search error:', error);
      return {
        isEnd: true,
        data: [],
      };
    }
  }

  /**
   * Parse song search result
   * @param data Search result data
   * @returns Parsed search result
   */
  private parseSongSearchResult(data: any): IPlugin.ISearchResult<'music'> {
    const songs = data.body.song.list || [];
    const total = data.body.song.totalnum || 0;
    const isEnd = songs.length === 0 || songs.length >= total;

    const parsedSongs = songs.map((song: any) => {
      const singers = song.singer || [];
      const singerNames = singers.map((singer: any) => singer.name).join(', ');

      return {
        id: song.mid,
        platform: this.platform,
        title: song.name,
        artist: singerNames,
        album: song.album?.name || '',
        duration: song.interval,
        artwork: `https://y.qq.com/music/photo_new/T002R300x300M000${song.album?.mid}.jpg`,
      } as IMusic.IMusicItem;
    });

    return {
      isEnd,
      data: parsedSongs,
    };
  }

  /**
   * Parse album search result
   * @param data Search result data
   * @returns Parsed search result
   */
  private parseAlbumSearchResult(data: any): IPlugin.ISearchResult<'album'> {
    const albums = data.body.album.list || [];
    const total = data.body.album.totalnum || 0;
    const isEnd = albums.length === 0 || albums.length >= total;

    const parsedAlbums = albums.map((album: any) => {
      const singers = album.singer || [];
      const singerNames = singers.map((singer: any) => singer.name).join(', ');

      return {
        id: album.mid,
        platform: this.platform,
        title: album.name,
        artist: singerNames,
        artwork: `https://y.qq.com/music/photo_new/T002R300x300M000${album.mid}.jpg`,
        description: album.desc || '',
      };
    });

    return {
      isEnd,
      data: parsedAlbums,
    };
  }

  /**
   * Parse artist search result
   * @param data Search result data
   * @returns Parsed search result
   */
  private parseArtistSearchResult(data: any): IPlugin.ISearchResult<'artist'> {
    const artists = data.body.singer.list || [];
    const total = data.body.singer.totalnum || 0;
    const isEnd = artists.length === 0 || artists.length >= total;

    const parsedArtists = artists.map((artist: any) => {
      return {
        id: artist.mid,
        platform: this.platform,
        name: artist.name,
        avatar: `https://y.qq.com/music/photo_new/T001R300x300M000${artist.mid}.jpg`,
        description: artist.desc || '',
      };
    });

    return {
      isEnd,
      data: parsedArtists,
    };
  }

  /**
   * Parse sheet search result
   * @param data Search result data
   * @returns Parsed search result
   */
  private parseSheetSearchResult(data: any): IPlugin.ISearchResult<'sheet'> {
    const sheets = data.body.songlist.list || [];
    const total = data.body.songlist.totalnum || 0;
    const isEnd = sheets.length === 0 || sheets.length >= total;

    const parsedSheets = sheets.map((sheet: any) => {
      return {
        id: sheet.dissid,
        platform: this.platform,
        title: sheet.dissname,
        artwork: sheet.imgurl,
        description: sheet.introduction || '',
      };
    });

    return {
      isEnd,
      data: parsedSheets,
    };
  }

  /**
   * Get the media source URL for a music item
   * @param musicItem Music item to get source for
   * @param quality Desired quality
   */
  async getMediaSource(
    musicItem: IMusic.IMusicItemBase,
    quality: IMusic.IQualityKey,
  ): Promise<IPlugin.IMediaSourceResult | null> {
    try {
      // Get the GUID for the request
      const guid = Math.floor(Math.random() * 10000000000);

      // Get the vkey for the song
      const response = await axios.get('https://u.y.qq.com/cgi-bin/musicu.fcg', {
        params: {
          format: 'json',
          data: JSON.stringify({
            req: {
              module: 'CDN.SrfCdnDispatchServer',
              method: 'GetCdnDispatch',
              param: { guid: guid.toString(), calltype: 0, userip: '' },
            },
            req_0: {
              module: 'vkey.GetVkeyServer',
              method: 'CgiGetVkey',
              param: {
                guid: guid.toString(),
                songmid: [musicItem.id],
                songtype: [0],
                uin: '0',
                loginflag: 1,
                platform: '20',
              },
            },
            comm: { uin: 0, format: 'json', ct: 24, cv: 0 },
          }),
        },
      });

      const data = response.data;
      const purl = data.req_0.data.midurlinfo[0].purl;

      if (!purl) {
        return null;
      }

      const url = `${data.req_0.data.sip[0]}${purl}`;

      return {
        url,
      };
    } catch (error) {
      console.error('QQ Music getMediaSource error:', error);
      return null;
    }
  }

  /**
   * Get lyrics for a music item
   * @param musicItem Music item to get lyrics for
   */
  async getLyric(
    musicItem: IMusic.IMusicItemBase,
  ): Promise<ILyric.ILyricSource | null> {
    try {
      const response = await axios.get('https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg', {
        params: {
          songmid: musicItem.id,
          format: 'json',
          nobase64: 1,
          g_tk: 5381,
          loginUin: 0,
          hostUin: 0,
        },
        headers: {
          Referer: 'https://y.qq.com/portal/player.html',
        },
      });

      const data = response.data;

      if (data.lyric) {
        return {
          rawLrc: data.lyric,
        };
      }

      return null;
    } catch (error) {
      console.error('QQ Music getLyric error:', error);
      return null;
    }
  }
}

// Export an instance of the plugin
export default new QQMusicPlugin();
