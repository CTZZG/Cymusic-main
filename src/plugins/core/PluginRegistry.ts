/**
 * Plugin Registry for Cymusic
 * Manages the registration and retrieval of plugins
 */

// Use existing utilities from the app
import axios from 'axios';
import EventEmitter from 'eventemitter3';
import { nanoid } from 'nanoid';
import { ToastAndroid } from 'react-native';
import { copyFile, readDir, readFile, unlink } from 'react-native-fs';
import { compare } from 'semver';
import { logError as errorLog, logInfo as trace } from '../../helpers/logger';
import pathConst from '../../store/pathConst';
import { IPluginInterface } from './interfaces/IPluginInterface';
import { PluginLoader, PluginState } from './PluginLoader';

// Import built-in plugins
import LocalFilesPlugin from '../builtin/LocalFilesPlugin';
import QQMusicPlugin from '../builtin/QQMusicPlugin';
import SampleMusicPlugin from '../builtin/SampleMusicPlugin';

// Event emitter for plugin events
const eventEmitter = new EventEmitter();

/**
 * Plugin metadata interface
 */
interface IPluginMeta {
  enabled: boolean;
  order: number;
  userVariables: Record<string, string>;
}

/**
 * Plugin instance with metadata
 */
interface IRegisteredPlugin {
  instance: IPluginInterface;
  state: PluginState;
  hash: string;
  name: string;
  path: string;
  meta: IPluginMeta;
}

/**
 * Plugin installation config
 */
interface IInstallPluginConfig {
  notCheckVersion?: boolean;
}

/**
 * Plugin installation result
 */
interface IInstallPluginResult {
  success: boolean;
  message?: string;
  pluginName?: string;
  pluginHash?: string;
}

/**
 * Plugin Registry
 * Manages the registration and retrieval of plugins
 */
export class PluginRegistry {
  private static instance: PluginRegistry;
  private plugins: IRegisteredPlugin[] = [];
  private builtinPlugins: IRegisteredPlugin[] = [];
  private initialized = false;

  /**
   * Get the singleton instance
   */
  static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  /**
   * Private constructor
   */
  private constructor() {
    // Register built-in plugins
    this.registerBuiltinPlugin(LocalFilesPlugin);
    this.registerBuiltinPlugin(SampleMusicPlugin);
    this.registerBuiltinPlugin(QQMusicPlugin);
  }

  /**
   * Register a built-in plugin
   * @param plugin Plugin instance
   */
  private registerBuiltinPlugin(plugin: IPluginInterface): void {
    this.builtinPlugins.push({
      instance: plugin,
      state: PluginState.Mounted,
      hash: nanoid(),
      name: plugin.platform,
      path: 'builtin',
      meta: {
        enabled: true,
        order: 0,
        userVariables: {},
      },
    });
  }

  /**
   * Initialize the plugin registry
   * Load all plugins from the filesystem
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Load plugins from the filesystem
      const pluginsFileItems = await readDir(pathConst.pluginPath);

      for (let i = 0; i < pluginsFileItems.length; ++i) {
        const pluginFileItem = pluginsFileItems[i];
        trace('Initializing plugin', pluginFileItem);

        if (
          pluginFileItem.isFile() &&
          (pluginFileItem.name?.endsWith?.('.js') ||
            pluginFileItem.path?.endsWith?.('.js'))
        ) {
          const pluginCode = await readFile(pluginFileItem.path, 'utf8');
          await this.loadPlugin(pluginCode, pluginFileItem.path);
        }
      }

      this.initialized = true;
    } catch (e: any) {
      ToastAndroid.show(
        `Plugin initialization failed: ${e?.message ?? e}`,
        ToastAndroid.LONG,
      );
      errorLog('Plugin initialization failed', e?.message);
      throw e;
    }
  }

  /**
   * Load a plugin from code
   * @param pluginCode Plugin code as string
   * @param pluginPath Path to the plugin file
   */
  async loadPlugin(pluginCode: string, pluginPath: string): Promise<void> {
    const { instance, state, hash, name, path } = PluginLoader.loadFromCode(
      pluginCode,
      pluginPath,
    );

    // Check if the plugin is already loaded
    const existingPlugin = this.plugins.find(p => p.hash === hash);
    if (existingPlugin) {
      return;
    }

    // Check if a plugin with the same name is already loaded
    const existingPluginWithSameName = this.plugins.find(p => p.name === name);

    if (state === PluginState.Mounted) {
      this.plugins.push({
        instance,
        state,
        hash,
        name,
        path,
        meta: {
          enabled: true,
          order: existingPluginWithSameName ? existingPluginWithSameName.meta.order : this.plugins.length,
          userVariables: {},
        },
      });

      // Remove the old plugin if it exists
      if (existingPluginWithSameName) {
        this.plugins = this.plugins.filter(p => p.hash !== existingPluginWithSameName.hash);
        try {
          await unlink(existingPluginWithSameName.path);
        } catch {}
      }

      // Emit an event
      eventEmitter.emit('plugin-loaded', name);
    }
  }

  /**
   * Install a plugin from a local file
   * @param pluginPath Path to the plugin file
   * @param config Installation config
   */
  async installPluginFromLocalFile(
    pluginPath: string,
    config?: IInstallPluginConfig,
  ): Promise<IInstallPluginResult> {
    try {
      const pluginCode = await readFile(pluginPath, 'utf8');
      return this.installPlugin(pluginCode, pluginPath, config);
    } catch (e: any) {
      return {
        success: false,
        message: `Failed to install plugin: ${e?.message ?? e}`,
      };
    }
  }

  /**
   * Install a plugin from a URL
   * @param url URL to the plugin
   * @param config Installation config
   */
  async installPluginFromUrl(
    url: string,
    config?: IInstallPluginConfig,
  ): Promise<IInstallPluginResult> {
    try {
      const response = await axios.get(url);
      const pluginCode = response.data;
      return this.installPlugin(pluginCode, url, config);
    } catch (e: any) {
      return {
        success: false,
        message: `Failed to download plugin: ${e?.message ?? e}`,
      };
    }
  }

  /**
   * Install a plugin
   * @param pluginCode Plugin code as string
   * @param pluginPath Path to the plugin file
   * @param config Installation config
   */
  private async installPlugin(
    pluginCode: string,
    pluginPath: string,
    config?: IInstallPluginConfig,
  ): Promise<IInstallPluginResult> {
    if (!pluginCode) {
      return {
        success: false,
        message: 'Plugin code is empty',
      };
    }

    const { instance, state, hash, name } = PluginLoader.loadFromCode(
      pluginCode,
      pluginPath,
    );

    // Check if the plugin is already installed
    const existingPlugin = this.plugins.find(p => p.hash === hash);
    if (existingPlugin) {
      return {
        success: true,
        message: 'Plugin is already installed',
        pluginName: name,
        pluginHash: hash,
      };
    }

    // Check if a plugin with the same name is already installed
    const existingPluginWithSameName = this.plugins.find(p => p.name === name);
    if (existingPluginWithSameName && !config?.notCheckVersion) {
      if (
        compare(
          existingPluginWithSameName.instance.version ?? '0.0.0',
          instance.version ?? '0.0.0',
          '>',
        )
      ) {
        return {
          success: false,
          message: 'A newer version of the plugin is already installed',
          pluginName: name,
          pluginHash: hash,
        };
      }
    }

    if (state === PluginState.Mounted) {
      // Generate a unique filename
      const filename = nanoid();

      // Remove the old plugin if it exists
      if (existingPluginWithSameName) {
        this.plugins = this.plugins.filter(p => p.hash !== existingPluginWithSameName.hash);
        try {
          await unlink(existingPluginWithSameName.path);
        } catch {}
      }

      // Copy the plugin to the plugins directory
      const newPluginPath = `${pathConst.pluginPath}${filename}.js`;
      await copyFile(pluginPath, newPluginPath);

      // Add the plugin to the registry
      this.plugins.push({
        instance,
        state,
        hash,
        name,
        path: newPluginPath,
        meta: {
          enabled: true,
          order: existingPluginWithSameName ? existingPluginWithSameName.meta.order : this.plugins.length,
          userVariables: {},
        },
      });

      // Emit an event
      eventEmitter.emit('plugin-installed', name);

      return {
        success: true,
        pluginName: name,
        pluginHash: hash,
      };
    }

    return {
      success: false,
      message: 'Plugin cannot be parsed',
    };
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): IRegisteredPlugin[] {
    return [...this.builtinPlugins, ...this.plugins];
  }

  /**
   * Get a plugin by name
   * @param name Plugin name
   */
  getPluginByName(name: string): IRegisteredPlugin | undefined {
    return this.getAllPlugins().find(p => p.name === name);
  }

  /**
   * Get a plugin by hash
   * @param hash Plugin hash
   */
  getPluginByHash(hash: string): IRegisteredPlugin | undefined {
    return this.getAllPlugins().find(p => p.hash === hash);
  }

  /**
   * Set a plugin's enabled state
   * @param name Plugin name
   * @param enabled Whether the plugin is enabled
   */
  setPluginEnabled(name: string, enabled: boolean): void {
    const plugin = this.getPluginByName(name);
    if (plugin) {
      plugin.meta.enabled = enabled;
      eventEmitter.emit('plugin-enabled', name, enabled);
    }
  }

  /**
   * Check if a plugin is enabled
   * @param name Plugin name
   */
  isPluginEnabled(name: string): boolean {
    const plugin = this.getPluginByName(name);
    return plugin?.meta.enabled ?? false;
  }

  /**
   * Subscribe to plugin events
   * @param event Event name
   * @param listener Event listener
   */
  on(event: string, listener: (...args: any[]) => void): void {
    eventEmitter.on(event, listener);
  }

  /**
   * Unsubscribe from plugin events
   * @param event Event name
   * @param listener Event listener
   */
  off(event: string, listener: (...args: any[]) => void): void {
    eventEmitter.off(event, listener);
  }
}
