/**
 * Plugin system exports for Cymusic
 */

// Core plugin system
export { BasePlugin } from './core/BasePlugin';
export { PluginErrorReason, PluginLoader, PluginState } from './core/PluginLoader';
export { PluginManager } from './core/PluginManager';
export { PluginRegistry } from './core/PluginRegistry';

// Plugin interfaces
export { IPluginInterface } from './core/interfaces/IPluginInterface';

// Built-in plugins
export { LocalFilesPlugin } from './builtin/LocalFilesPlugin';
export { QQMusicPlugin } from './builtin/QQMusicPlugin';
export { SampleMusicPlugin } from './builtin/SampleMusicPlugin';

// Singleton instance for easy access
import { PluginManager } from './core/PluginManager';
export const pluginManager = PluginManager.getInstance();
