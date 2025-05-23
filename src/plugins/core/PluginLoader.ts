/**
 * Plugin Loader for Cymusic
 * Handles loading and validating plugins
 */

/// <reference path="../../types/plugin.d.ts" />

import { nanoid } from 'nanoid';
import DeviceInfo from 'react-native-device-info';
import { satisfies } from 'semver';
import { IPluginInterface } from './interfaces/IPluginInterface';

// Logger functions
const errorLog = (message: string, error?: any) => {
  console.error(`[PluginLoader] ${message}`, error);
};

/**
 * Plugin state enum
 */
export enum PluginState {
  Loading = 'loading',
  Mounted = 'mounted',
  Error = 'error',
}

/**
 * Plugin error reason enum
 */
export enum PluginErrorReason {
  CannotParse = 'cannot-parse',
  VersionNotMatch = 'version-not-match',
}

/**
 * Plugin loader class
 * Handles loading and validating plugins
 */
export class PluginLoader {
  /**
   * Load a plugin from code
   * @param pluginCode Plugin code as string
   * @param pluginPath Path to the plugin file
   * @returns Plugin instance and metadata
   */
  static loadFromCode(pluginCode: string, pluginPath: string): {
    instance: IPluginInterface;
    state: PluginState;
    errorReason?: PluginErrorReason;
    hash: string;
    name: string;
    path: string;
  } {
    let _instance: IPluginInterface;
    let state = PluginState.Mounted;
    let errorReason: PluginErrorReason | undefined;

    try {
      // Create a function from the plugin code
      const funcCode = new Function(
        'module',
        'exports',
        'require',
        pluginCode,
      );

      // Create a module object
      const _module = {
        exports: {},
      };

      // Execute the function to get the plugin instance
      funcCode(_module, _module.exports, (moduleName: string) => {
        // Simple require implementation for plugins
        // This could be expanded to support more modules
        // Using dynamic imports would be better in a real implementation
        if (moduleName === 'crypto-js') {
          // Mock implementation for crypto-js
          return {
            MD5: (_text: string) => 'md5hash',
            SHA256: (_text: string) => 'sha256hash'
          };
        } else if (moduleName === 'cheerio') {
          // Mock implementation for cheerio
          return { load: () => ({}) };
        } else if (moduleName === 'axios') {
          // Mock implementation for axios
          return { get: async () => ({ data: {} }) };
        } else if (moduleName === 'dayjs') {
          // Mock implementation for dayjs
          return () => ({ format: () => new Date().toString() });
        } else {
          throw new Error(`Module ${moduleName} not supported in plugins`);
        }
      });

      // Get the plugin instance
      // Use type assertion to handle the exports
      const exports = _module.exports as any;
      if (typeof exports === 'object') {
        if (exports.default) {
          _instance = exports.default as IPluginInterface;
        } else {
          _instance = exports as IPluginInterface;
        }
      } else {
        _instance = funcCode() as any;
      }

      // Validate the plugin
      this.validatePlugin(_instance);

      // Filter user variables
      if (Array.isArray(_instance.userVariables)) {
        _instance.userVariables = _instance.userVariables.filter(
          it => it?.key,
        );
      }
    } catch (e: any) {
      state = PluginState.Error;
      errorReason = e?.errorReason ?? PluginErrorReason.CannotParse;

      errorLog(`${pluginPath} plugin cannot be parsed`, {
        errorReason,
        message: e?.message,
        stack: e?.stack,
      });

      // Create a dummy instance for error handling
      _instance = e?.instance ?? {
        platform: '',
        version: '0.0.0',
        async getMediaSource() {
          return null;
        },
        async search() {
          return { isEnd: true, data: [] };
        },
        async getAlbumInfo() {
          return null;
        },
      };
    }

    // Generate a hash for the plugin
    const hash = nanoid();

    return {
      instance: _instance,
      state,
      errorReason,
      hash,
      name: _instance.platform,
      path: pluginPath,
    };
  }

  /**
   * Validate a plugin instance
   * @param instance Plugin instance to validate
   * @throws Error if validation fails
   */
  static validatePlugin(instance: IPluginInterface): boolean {
    // Check if the plugin is compatible with the app version
    if (
      instance.version &&
      !satisfies(DeviceInfo.getVersion(), instance.version)
    ) {
      throw {
        instance,
        state: PluginState.Error,
        errorReason: PluginErrorReason.VersionNotMatch,
      };
    }

    // Check if the plugin has a platform name
    if (!instance.platform) {
      throw new Error('Plugin must have a platform name');
    }

    return true;
  }
}
