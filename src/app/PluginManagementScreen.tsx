// src/app/PluginManagementScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Button, TextInput, Alert, TouchableOpacity, Platform } from 'react-native';
import pluginManager from '@/helpers/PluginManager'; // Assuming PluginManager exports an instance
import { ManagedPlugin, IUserVariable, PluginUserConfig } from '@/helpers/PluginManager'; // Import ManagedPlugin if exported, or define locally for structure
import { defaultStyles } from '@/styles';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router'; // For navigation to a variable config screen
import i18n from '@/utils/i18n'; // Import i18n instance

interface LocalManagedPluginDisplay {
    id: string;
    platform: string;
    version?: string;
    author?: string;
    description?: string;
    userConfig: PluginUserConfig; 
    userVariablesDefine?: IUserVariable[];
}


const PluginManagementScreen = () => {
    const [plugins, setPlugins] = useState<LocalManagedPluginDisplay[]>([]);
    const [scriptInput, setScriptInput] = useState('');
    // New state variables for single music item import
    const [musicItemUrl, setMusicItemUrl] = useState('');
    const [selectedPluginForSingleImport, setSelectedPluginForSingleImport] = useState<string | null>(null);
    const [singleImportPlugins, setSingleImportPlugins] = useState<ManagedPlugin[]>([]);


    const mapPluginToDisplay = (p: ManagedPlugin): LocalManagedPluginDisplay => ({
        id: p.id,
        platform: p.platform,
        version: p.version,
        author: p.author,
        description: p.description, 
        userConfig: { 
            isEnabled: p.userConfig.isEnabled !== false, 
            userVariables: p.userConfig.userVariables || {},
        },
        userVariablesDefine: p.userVariables || [], 
    });

    const loadPluginsFromManager = useCallback(() => {
        const allPlugins = pluginManager.getAllPluginDefinitions();
        setPlugins(allPlugins.map(mapPluginToDisplay));

        // Filter plugins that support importMusicItem
        const importCapablePlugins = allPlugins.filter(
            p => p.instance?.importMusicItem && p.userConfig.isEnabled !== false
        );
        setSingleImportPlugins(importCapablePlugins);

    }, []);

    useEffect(() => {
        loadPluginsFromManager();
    }, [loadPluginsFromManager]);

    const handleToggleSwitch = async (pluginId: string, isEnabled: boolean) => {
        try {
            await pluginManager.setPluginEnabled(pluginId, isEnabled);
            loadPluginsFromManager(); 
        } catch (e: any) {
            Alert.alert(i18n.t('common.error'), i18n.t('pluginManagement.errorFailedUpdateStatus', { message: e.message }));
        }
    };

    const handleAddPluginFromScript = async () => {
        if (!scriptInput.trim()) {
            Alert.alert(i18n.t('common.error'), i18n.t('pluginManagement.errorScriptEmpty'));
            return;
        }
        try {
            await pluginManager.addPluginFromScript(scriptInput);
            setScriptInput('');
            loadPluginsFromManager(); 
            Alert.alert(i18n.t('common.success'), i18n.t('pluginManagement.successPluginAddedFromScript'));
        } catch (e: any) {
            Alert.alert(i18n.t('pluginManagement.errorAddingPlugin'), e.message || i18n.t('common.unknownError'));
        }
    };
    
    const handlePickAndAddPluginFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: Platform.OS === 'ios' ? 'public.javascript' : 'application/javascript', 
                copyToCacheDirectory: false, 
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                 const asset = result.assets[0];
                 const scriptContent = await FileSystem.readAsStringAsync(asset.uri);
                 await pluginManager.addPluginFromScript(scriptContent, asset.name);
                 loadPluginsFromManager();
                 Alert.alert(i18n.t('common.success'), i18n.t('pluginManagement.successPluginAddedFromFile', { fileName: asset.name }));
            }
        } catch (e: any) {
            Alert.alert(i18n.t('pluginManagement.errorPickingFile'), e.message || i18n.t('common.unknownError'));
        }
    };

    const handleRemovePlugin = async (pluginId: string) => {
        Alert.alert(
            i18n.t('pluginManagement.confirmRemoveTitle'),
            i18n.t('pluginManagement.confirmRemoveMessage'),
            [
                { text: i18n.t('pluginManagement.cancelButton'), style: "cancel" },
                {
                    text: i18n.t('pluginManagement.removeButton'),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await pluginManager.removePlugin(pluginId);
                            loadPluginsFromManager();
                            Alert.alert(i18n.t('common.success'), i18n.t('pluginManagement.successPluginRemoved'));
                        } catch (e: any) {
                            Alert.alert(i18n.t('pluginManagement.errorRemovingPlugin'), e.message || i18n.t('common.unknownError'));
                        }
                    },
                },
            ]
        );
    };
    
    const navigateToConfigureVariables = (plugin: LocalManagedPluginDisplay) => {
        if (plugin.id) {
            router.push({
                pathname: '/PluginVariableConfigScreen', 
                params: { pluginId: plugin.id },
            });
        } else {
            Alert.alert(i18n.t('common.error'), i18n.t('pluginManagement.errorPluginIdMissing'));
        }
    };

    const handleImportSingleMusicItem = async () => {
        if (!selectedPluginForSingleImport) {
            Alert.alert(i18n.t('common.error'), i18n.t('pluginManagement.errorSelectPlugin'));
            return;
        }
        if (!musicItemUrl.trim()) {
            Alert.alert(i18n.t('common.error'), i18n.t('pluginManagement.errorEnterUrl'));
            return;
        }
        try {
            // Assuming importMusicItemFromPlugin is available and correctly imported
            // This function is defined in pluginDataFetchers.ts but not directly used here yet.
            // For now, let's assume it exists or this is a placeholder for its direct call.
            // const importedItem = await pluginManager.importMusicItem(selectedPluginForSingleImport, musicItemUrl); // Placeholder
            
            // For this example, we'll simulate calling a direct plugin method if available,
            // or more ideally, use a helper like `importMusicItemFromPlugin`
            const pluginInstance = pluginManager.getPlugin(selectedPluginForSingleImport)?.instance;
            if (pluginInstance && pluginInstance.importMusicItem) {
                const importedItem = await pluginInstance.importMusicItem(musicItemUrl);
                if (importedItem) {
                    Alert.alert(i18n.t('common.success'), i18n.t('pluginManagement.successTrackImported', { title: importedItem.title }));
                    setMusicItemUrl(''); // Clear input
                    // Potentially add to a playlist or queue
                } else {
                     Alert.alert(i18n.t('common.error'), i18n.t('pluginManagement.importFailedCheckUrl'));
                }
            } else {
                 Alert.alert(i18n.t('common.error'), i18n.t('pluginManagement.importFailedCheckUrl'));
            }
        } catch (e: any) {
            Alert.alert(i18n.t('common.error'), i18n.t('pluginManagement.importFailedError', { message: e.message || i18n.t('common.unknownError') }));
        }
    };


    return (
        <ScrollView style={styles.container} testID="plugin-management-screen">
            <Text style={styles.header}>{i18n.t('pluginManagement.title')}</Text>

            {/* Import Single Music Item Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{i18n.t('pluginManagement.importSingleItemTitle')}</Text>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>{i18n.t('pluginManagement.selectPluginSource')}</Text>
                    <View style={styles.pluginSelectorRow}>
                        {singleImportPlugins.length > 0 ? singleImportPlugins.map(p => (
                            <TouchableOpacity
                                key={p.id}
                                style={[
                                    styles.pluginButtonSmall,
                                    selectedPluginForSingleImport === p.id && styles.pluginButtonSmallSelected
                                ]}
                                onPress={() => setSelectedPluginForSingleImport(p.id)}
                            >
                                <Text style={styles.pluginButtonSmallText}>{p.platform}</Text>
                            </TouchableOpacity>
                        )) : <Text style={styles.emptyText}>{i18n.t('pluginManagement.noPluginsSupportSingleImport')}</Text>}
                    </View>
                </View>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>{i18n.t('pluginManagement.musicItemUrlPlaceholder')}:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={i18n.t('pluginManagement.musicItemUrlPlaceholder')}
                        value={musicItemUrl}
                        onChangeText={setMusicItemUrl}
                        testID="music-item-url-input"
                    />
                </View>
                <Button title={i18n.t('pluginManagement.importButton')} onPress={handleImportSingleMusicItem} disabled={!selectedPluginForSingleImport || !musicItemUrl} />
            </View>


            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{i18n.t('pluginManagement.addNewPlugin')}</Text>
                <View style={styles.addPluginContainer}>
                    <Button title={i18n.t('pluginManagement.loadFromFile')} onPress={handlePickAndAddPluginFile} />
                    <Text style={styles.orText}>{i18n.t('pluginManagement.orSeparator')}</Text>
                    <TextInput
                        style={styles.scriptInput}
                        placeholder={i18n.t('pluginManagement.pasteScriptPlaceholder')}
                        value={scriptInput}
                        onChangeText={setScriptInput}
                        multiline
                        numberOfLines={4}
                        testID="script-input"
                    />
                    <Button title={i18n.t('pluginManagement.addFromScript')} onPress={handleAddPluginFromScript} />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{i18n.t('pluginManagement.installedPlugins')}</Text>
                {plugins.length === 0 && <Text>{i18n.t('pluginManagement.noPluginsInstalled')}</Text>}
                {plugins.map((plugin) => (
                    <View key={plugin.id} style={styles.pluginItem} testID={`plugin-item-${plugin.id}`}>
                        <View style={styles.pluginInfo}>
                            <Text style={styles.pluginName}>{plugin.platform} (v{plugin.version || i18n.t('pluginManagement.versionNA')})</Text>
                            {plugin.author && <Text style={styles.pluginAuthor}>{i18n.t('pluginManagement.byAuthor', { author: plugin.author })}</Text>}
                            {plugin.description && <Text style={styles.pluginDescription}>{plugin.description}</Text>}
                        </View>
                        <View style={styles.pluginActions}>
                            <Switch
                                value={plugin.userConfig.isEnabled}
                                onValueChange={(value) => handleToggleSwitch(plugin.id, value)}
                                testID={`plugin-toggle-${plugin.id}`}
                            />
                            {(plugin.userVariablesDefine && plugin.userVariablesDefine.length > 0) && (
                                <TouchableOpacity onPress={() => navigateToConfigureVariables(plugin)} style={styles.actionButton} testID={`configure-plugin-${plugin.id}`}>
                                    <Text style={styles.actionButtonText}>{i18n.t('pluginManagement.configure')}</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={() => handleRemovePlugin(plugin.id)} style={[styles.actionButton, styles.removeButton]} testID={`remove-plugin-${plugin.id}`}>
                                <Text style={styles.actionButtonText}>{i18n.t('pluginManagement.remove')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: defaultStyles.container?.backgroundColor || '#f0f0f0',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: defaultStyles.text?.color,
    },
    section: {
        marginBottom: 20,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        color: defaultStyles.text?.color,
    },
    addPluginContainer: {
        gap: 10,
    },
    scriptInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        minHeight: 80,
        textAlignVertical: 'top',
        borderRadius: 4,
        backgroundColor: '#f9f9f9',
        color: defaultStyles.text?.color, 
    },
    input: { // General input style for music item URL
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 4,
        backgroundColor: '#f9f9f9',
        color: defaultStyles.text?.color,
        fontSize: 14,
    },
    orText: {
        textAlign: 'center',
        marginVertical: 5,
        color: '#666',
        fontWeight: 'bold',
    },
    pluginItem: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pluginInfo: {
        flex: 1,
        marginRight: 10, 
    },
    pluginName: {
        fontSize: 16,
        fontWeight: '500',
        color: defaultStyles.text?.color,
    },
    pluginAuthor: {
        fontSize: 12,
        color: '#555',
    },
    pluginDescription: {
        fontSize: 13,
        color: '#777',
        marginTop: 4,
    },
    pluginActions: {
        flexDirection: 'column', 
        alignItems: 'flex-end', 
        gap: 8, 
    },
    actionButton: {
        paddingHorizontal: 10,
        paddingVertical: 6, 
        borderRadius: 4,
        backgroundColor: '#007bff', 
        minWidth: 80, 
        alignItems: 'center', 
    },
    actionButtonText: {
        color: 'white',
        fontWeight: '500', 
    },
    removeButton: {
        backgroundColor: '#dc3545', 
    },
    // Styles for "Import Single Music Item"
    formGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        color: defaultStyles.text?.color || '#333',
    },
    pluginSelectorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap', // Allow buttons to wrap
        alignItems: 'center',
        marginBottom: 10,
    },
    pluginButtonSmall: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ddd',
        marginRight: 8,
        marginBottom: 8, // For wrapping
    },
    pluginButtonSmallSelected: {
        backgroundColor: '#007bff',
        borderColor: '#0056b3',
    },
    pluginButtonSmallText: { // Ensure text is visible on selection
        color: '#000', // Default text color
    },
    emptyText: {
        color: '#666',
        fontStyle: 'italic',
    }
});

export default PluginManagementScreen;
