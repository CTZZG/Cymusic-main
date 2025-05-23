/**
 * Local Files Plugin for Cymusic
 * Handles local music files on the device
 */

/// <reference path="../../types/music.d.ts" />
/// <reference path="../../types/common.d.ts" />
/// <reference path="../../types/plugin.d.ts" />

// External dependencies
import CryptoJs from 'crypto-js';
import { nanoid } from 'nanoid';
import { exists, stat } from 'react-native-fs';

// Internal imports
import { BasePlugin } from '../core/BasePlugin';

// Constants and helpers
const internalSerializeKey = Symbol('internalSerialize');

// Helper functions
const getLocalPath = (item: any): string | null => {
  return item.$?.localPath || item.url || null;
};

const getFileName = (path: string): string => {
  const parts = path.split('/');
  return parts[parts.length - 1] || path;
};

const addFileScheme = (path: string): string => {
  return path.startsWith('file://') ? path : `file://${path}`;
};

// Media extra functions
const getMediaExtraProperty = (item: any, property: string): any => {
  return item.$?.[property] || null;
};

const patchMediaExtra = (item: any, patch: Record<string, any>): void => {
  if (!item.$) {
    item.$ = {};
  }
  Object.assign(item.$, patch);
};

// Mock Mp3Util for now - this would be replaced with actual implementation
const Mp3Util = {
  getMediaCoverImg: async (_path: string) => '',
  getBasicMeta: async (_path: string) => ({
    title: '',
    artist: '',
    duration: '0',
    album: '',
  }),
};

/**
 * Local Files Plugin
 * Handles local music files on the device
 */
export class LocalFilesPlugin extends BasePlugin {
  platform = 'local';
  version = '1.0.0';
  author = 'Cymusic';
  primaryKey = ['id'];

  /**
   * Get additional information for a music item
   * @param musicBase Basic music item information
   */
  async getMusicInfo(
    musicBase: ICommon.IMediaBase,
  ): Promise<Partial<IMusic.IMusicItem> | null> {
    const localPath = getLocalPath(musicBase);
    if (localPath) {
      const coverImg = await Mp3Util.getMediaCoverImg(localPath);
      return {
        artwork: coverImg,
      };
    }
    return null;
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
    // Check if the file exists locally
    const localPathInMediaExtra = getMediaExtraProperty(musicItem, 'localPath');
    const localPath = getLocalPath(musicItem);

    if (localPath && (await exists(localPath))) {
      if (localPathInMediaExtra !== localPath) {
        // Update the local path in media extra if it's different
        patchMediaExtra(musicItem, {
          localPath
        });
      }
      return {
        url: addFileScheme(localPath),
      };
    } else if (localPathInMediaExtra) {
      // Clear the local path if the file doesn't exist
      patchMediaExtra(musicItem, {
        localPath: undefined,
      });
    }

    // For local plugin, only return the 128k quality (basic quality)
    if (quality === '128k') {
      return {
        url: addFileScheme(musicItem.$?.localPath || musicItem.url),
      };
    }

    return null;
  }

  /**
   * Import a single music item from a local file path
   * @param urlLike Local file path
   */
  async importMusicItem(urlLike: string): Promise<IMusic.IMusicItem | null> {
    let meta: any = {};
    let id: string;

    try {
      // Get metadata from the file
      meta = await Mp3Util.getBasicMeta(urlLike);
      const fileStat = await stat(urlLike);
      id = CryptoJs.MD5(fileStat.originalFilepath).toString(
        CryptoJs.enc.Hex,
      ) || nanoid();
    } catch {
      id = nanoid();
    }

    return {
      id: id,
      platform: this.platform,
      title: meta?.title ?? getFileName(urlLike),
      artist: meta?.artist ?? 'Unknown Artist',
      duration: parseInt(meta?.duration ?? '0', 10) / 1000,
      album: meta?.album ?? 'Unknown Album',
      artwork: '',
      [internalSerializeKey]: {
        localPath: urlLike,
      },
      url: urlLike
    };
  }
}

// Export an instance of the plugin
export default new LocalFilesPlugin();

