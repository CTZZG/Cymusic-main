// src/app/PluginVariableConfigScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import pluginManager from '@/helpers/PluginManager';
import { ManagedPlugin, IUserVariable } from '@/helpers/PluginManager'; 
import { defaultStyles } from '@/styles';
import i18n from '@/utils/i18n'; // Import i18n instance

const PluginVariableConfigScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams<{ pluginId: string }>();
    const { pluginId } = params;

    const [plugin, setPlugin] = useState<ManagedPlugin | null>(null);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (pluginId) {
            const foundPlugin = pluginManager.getPlugin(pluginId);
            if (foundPlugin) {
                setPlugin(foundPlugin);
                setFormData(foundPlugin.userConfig.userVariables || {});
            } else {
                Alert.alert(i18n.t('common.error'), i18n.t('pluginVariableConfig.errorPluginIdNotFound', { pluginId }));
            }
            setIsLoading(false);
        } else {
            Alert.alert(i18n.t('common.error'), i18n.t('pluginVariableConfig.errorNoPluginId'));
            setIsLoading(false);
        }
    }, [pluginId]);

    const handleInputChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveChanges = async () => {
        if (!plugin) return;
        setIsLoading(true);
        try {
            for (const key in formData) {
                if (formData.hasOwnProperty(key)) {
                    await pluginManager.setPluginUserVariable(plugin.id, key, formData[key]);
                }
            }
            Alert.alert(i18n.t('common.success'), i18n.t('pluginVariableConfig.successConfigSaved'));
            if (router.canGoBack()) router.back();
        } catch (error: any) {
            Alert.alert(i18n.t('common.error'), i18n.t('pluginVariableConfig.errorConfigSaveFailed', { message: error.message || i18n.t('pluginVariableConfig.unknownError') }));
        }
        setIsLoading(false);
    };

    if (isLoading) {
        return <View style={styles.centered}><Text>{i18n.t('pluginVariableConfig.loading')}</Text></View>;
    }

    if (!plugin) {
        if (router.canGoBack()) router.back(); 
        return <View style={styles.centered}><Text>{i18n.t('pluginVariableConfig.pluginNotFoundNavigatingBack')}</Text></View>;
    }

    const variableDefinitions = plugin.userVariables || []; 

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <Text style={styles.header}>{i18n.t('pluginVariableConfig.title', { platformName: plugin.platform })}</Text>
            {variableDefinitions.length === 0 ? (
                <Text style={styles.noVariablesText}>{i18n.t('pluginVariableConfig.noVariables')}</Text>
            ) : (
                variableDefinitions.map((variableDef: IUserVariable) => (
                    <View key={variableDef.key} style={styles.variableItem}>
                        <Text style={styles.variableName}>{variableDef.name || variableDef.key}</Text>
                        {variableDef.hint && <Text style={styles.variableHint}>{variableDef.hint}</Text>}
                        <TextInput
                            style={styles.input}
                            value={formData[variableDef.key] || ''}
                            onChangeText={(text) => handleInputChange(variableDef.key, text)}
                            placeholder={variableDef.hint || i18n.t('pluginVariableConfig.enterValuePlaceholder', { key: variableDef.key })}
                            testID={`input-${variableDef.key}`}
                        />
                    </View>
                ))
            )}
            {variableDefinitions.length > 0 && (
                 <Button title={i18n.t('pluginVariableConfig.saveChangesButton')} onPress={handleSaveChanges} disabled={isLoading} testID="save-changes-button" />
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: defaultStyles.container?.backgroundColor || '#f0f0f0',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        color: defaultStyles.text?.color,
        textAlign: 'center',
    },
    variableItem: {
        marginBottom: 15,
    },
    variableName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 3,
        color: defaultStyles.text?.color,
    },
    variableHint: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
        backgroundColor: '#fff', 
        fontSize: 14,
        color: defaultStyles.text?.color, 
    },
    noVariablesText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#888',
    }
});

export default PluginVariableConfigScreen;
