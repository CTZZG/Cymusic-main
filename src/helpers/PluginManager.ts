import * as FileSystem from 'expo-file-system';
import { IPluginDefine, IUserVariable } from '@/types/plugin'; // Assuming IPluginDefine is correctly typed
import PersistStatus from '@/store/PersistStatus'; // For storing userVariables

// Define the structure for stored plugin user configurations
export interface PluginUserConfig { // Exporting for potential use in UI
    userVariables?: Record<string, string>;
    isEnabled?: boolean;
}

// Define the structure for a plugin instance managed by the PluginManager
// Exporting for potential use in UI, e.g., PluginManagementScreen
export interface ManagedPlugin extends IPluginDefine {
    id: string; // A unique identifier for the plugin instance
    filePath: string;
    userConfig: PluginUserConfig;
    // The actual evaluated module exports from the plugin script
    instance?: IPluginDefine; // This holds the live instance of the plugin
}

const PLUGINS_DIRECTORY = FileSystem.documentDirectory + 'plugins/';
const PLUGIN_CONFIG_PREFIX = 'plugin_config_';

class PluginManager {
    private plugins: Map<string, ManagedPlugin> = new Map();

    constructor() {
        this.loadPlugins(); // Ensure plugins are loaded on initialization
    }

    private async ensurePluginsDirectory(): Promise<void> {
        const dirInfo = await FileSystem.getInfoAsync(PLUGINS_DIRECTORY);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(PLUGINS_DIRECTORY, { intermediates: true });
            console.log("Plugins directory created at:", PLUGINS_DIRECTORY);
        }
    }

    private async loadPluginConfig(pluginId: string): Promise<PluginUserConfig> {
        try {
            const configString = await PersistStatus.get(`${PLUGIN_CONFIG_PREFIX}${pluginId}`);
            if (configString) {
                return JSON.parse(configString); // Assuming config is stored as JSON string
            }
        } catch (e) {
            console.error(`Error parsing config for plugin ${pluginId}:`, e);
            // Fallback to default or delete corrupted config
            await PersistStatus.remove(`${PLUGIN_CONFIG_PREFIX}${pluginId}`);
        }
        return { userVariables: {}, isEnabled: true }; // Default config
    }

    private async savePluginConfig(pluginId: string, config: PluginUserConfig): Promise<void> {
        await PersistStatus.set(`${PLUGIN_CONFIG_PREFIX}${pluginId}`, JSON.stringify(config));
    }

    // Modified loadPlugins to use eval placeholder and handle instance creation
    public async loadPlugins(): Promise<void> {
        await this.ensurePluginsDirectory();
        this.plugins.clear(); // Clear existing plugins before loading
        try {
            const pluginFiles = await FileSystem.readDirectoryAsync(PLUGINS_DIRECTORY);
            for (const fileName of pluginFiles) {
                if (fileName.endsWith('.js')) {
                    const filePath = `${PLUGINS_DIRECTORY}${fileName}`;
                    try {
                        const scriptContent = await FileSystem.readAsStringAsync(filePath);
                        
                        // --- Simplified evaluation placeholder ---
                        const module: { exports: Partial<IPluginDefine> } = { exports: {} };
                        // const exports = module.exports; // 'exports' is not directly used by 'eval' in this manner
                        // In a direct eval, the script should assign to module.exports or a similar structure
                        // For example, the script itself could be: `module.exports = { platform: "myPlatform", ... };`
                        eval(scriptContent); // This is generally unsafe and should be sandboxed.
                        const pluginModule = module.exports as IPluginDefine;
                        // --- End simplified evaluation ---

                        if (!pluginModule.platform) {
                            console.warn(`Plugin at ${filePath} is missing 'platform' identifier. Skipping.`);
                            continue;
                        }

                        const pluginId = pluginModule.platform;
                        const userConfig = await this.loadPluginConfig(pluginId);

                        this.plugins.set(pluginId, {
                            ...pluginModule,
                            id: pluginId,
                            filePath,
                            userConfig,
                            instance: pluginModule, // Store the evaluated instance
                        });
                        console.log(`Loaded plugin: ${pluginModule.platform} from ${filePath}`);
                    } catch (e) {
                        console.error(`Error loading or evaluating plugin ${fileName}:`, e);
                    }
                }
            }
        } catch (e) {
            console.error("Error reading plugins directory:", e);
        }
    }

    public getEnvForPlugin(pluginId: string) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin with id ${pluginId} not found.`);
        }
        return {
            getUserVariables: (): Record<string, string> => {
                return plugin.userConfig.userVariables || {};
            },
        };
    }

    public getActivePlugins(): ManagedPlugin[] {
        return Array.from(this.plugins.values()).filter(p => p.userConfig.isEnabled !== false && p.instance);
    }

    public getPlugin(platform: string): ManagedPlugin | undefined {
        return this.plugins.get(platform);
    }

    // Method to get all loaded plugin definitions (for listing in UI)
    public getAllPluginDefinitions(): ManagedPlugin[] {
        return Array.from(this.plugins.values());
    }

    // Method to set a plugin's enabled status
    public async setPluginEnabled(pluginId: string, isEnabled: boolean): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (plugin) {
            plugin.userConfig.isEnabled = isEnabled;
            await this.savePluginConfig(pluginId, plugin.userConfig);
            console.log(`Plugin ${pluginId} ${isEnabled ? 'enabled' : 'disabled'}`);
            // Consider re-evaluating or re-instantiating if disabling means freeing resources,
            // or if enabling requires re-initialization beyond just setting a flag.
            // For now, it just updates the config and in-memory state.
        } else {
            console.error(`Attempted to set enabled status for unknown plugin: ${pluginId}`);
        }
    }

    // Method to set a user variable for a plugin
    public async setPluginUserVariable(pluginId: string, key: string, value: string): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (plugin) {
            if (!plugin.userConfig.userVariables) {
                plugin.userConfig.userVariables = {};
            }
            plugin.userConfig.userVariables[key] = value;
            await this.savePluginConfig(pluginId, plugin.userConfig);
            console.log(`User variable ${key} set for plugin ${pluginId}`);
        } else {
            console.error(`Attempted to set user variable for unknown plugin: ${pluginId}`);
        }
    }
    
    // Method to add/update a plugin from a script
    public async addPluginFromScript(scriptContent: string, filePathHint?: string): Promise<ManagedPlugin | null> {
        try {
            // --- Simplified evaluation placeholder ---
            const module: { exports: Partial<IPluginDefine> } = { exports: {} };
            // eval itself does not use 'exports' binding like this. Script must assign to module.exports
            eval(scriptContent); 
            const pluginModule = module.exports as IPluginDefine;
            // --- End simplified evaluation ---

            if (!pluginModule.platform) {
                console.error('Plugin script is missing "platform" identifier.');
                throw new Error('Plugin script is missing "platform" identifier.');
            }

            const pluginId = pluginModule.platform;

            await this.ensurePluginsDirectory();
            // Use filePathHint if provided and valid, otherwise generate based on platform and timestamp
            const fileName = filePathHint ? filePathHint.split('/').pop() || `${pluginId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.js`
                                      : `${pluginId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.js`;
            const actualFilePath = `${PLUGINS_DIRECTORY}${fileName}`;
            
            await FileSystem.writeAsStringAsync(actualFilePath, scriptContent);

            // Load or create new config. If updating, this preserves existing userVariables and isEnabled status.
            const userConfig = await this.loadPluginConfig(pluginId); 
            // If it's a truly new plugin (no prior config), isEnabled will default to true via loadPluginConfig.
            // If the plugin defines new userVariables, they won't automatically merge here unless userConfig is empty.
            // For simplicity, we're not merging variable definitions from pluginModule into userConfig here.

            const managedPlugin: ManagedPlugin = {
                ...pluginModule,
                id: pluginId,
                filePath: actualFilePath,
                userConfig, // Retain existing config (isEnabled, userVariables)
                instance: pluginModule, // The newly evaluated instance
            };

            this.plugins.set(pluginId, managedPlugin);
            // Save config (might be redundant if loadPluginConfig returned an existing one that didn't change,
            // but good to ensure consistency if a new plugin now has a config entry)
            await this.savePluginConfig(pluginId, userConfig); 

            console.log(`Plugin ${pluginId} added/updated from script and saved to ${actualFilePath}.`);
            return managedPlugin;
        } catch (e) {
            console.error('Error adding plugin from script:', e);
            // Consider removing the saved script file if evaluation or setup fails post-save
            // if (actualFilePath) await FileSystem.deleteAsync(actualFilePath, { idempotent: true });
            throw e; 
        }
    }

    public async removePlugin(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (plugin) {
            try {
                await FileSystem.deleteAsync(plugin.filePath, { idempotent: true });
                await PersistStatus.remove(`${PLUGIN_CONFIG_PREFIX}${pluginId}`);
                this.plugins.delete(pluginId);
                console.log(`Plugin ${pluginId} removed successfully.`);
            } catch (error) {
                console.error(`Error removing plugin ${pluginId}:`, error);
                throw error; // Propagate error to UI if needed
            }
        } else {
            console.warn(`Attempted to remove unknown plugin: ${pluginId}`);
            // Optionally throw error if strictness is required: throw new Error(`Plugin ${pluginId} not found.`);
        }
    }
}

const pluginManager = new PluginManager();
export default pluginManager;
