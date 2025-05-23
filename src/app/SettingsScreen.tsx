// src/app/SettingsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // For icons
import { defaultStyles } from '@/styles';
import i18n from '@/utils/i18n'; // For internationalization
import { colors } from '@/constants/tokens'; // For icon color

const SettingsScreen = () => {
    const router = useRouter();

    const settingsOptions = [
        {
            id: 'plugin_management',
            titleKey: 'settings.pluginManagement', // Key for "Plugin Management"
            iconName: 'construct-outline', // Example icon
            action: () => router.push('/PluginManagementScreen'),
        },
        // Add other general settings options here as needed in the future
        // {
        //     id: 'language_settings',
        //     titleKey: 'settings.language',
        //     iconName: 'language-outline',
        //     action: () => router.push('/LanguageSettingsScreen'), // Example
        // },
        // {
        //     id: 'about_app',
        //     titleKey: 'settings.about',
        //     iconName: 'information-circle-outline',
        //     action: () => router.push('/AboutScreen'), // Example
        // },
    ];

    return (
        <ScrollView style={styles.container}>
            {/* No explicit header here, relying on Stack navigator's header.
                The title for this screen should be set in the root _layout.tsx when defining this route. */}
            {settingsOptions.map((option) => (
                <TouchableOpacity key={option.id} style={styles.optionRow} onPress={option.action}>
                    <Ionicons name={option.iconName as any} size={24} color={colors.icon || (Platform.OS === 'ios' ? colors.primary : colors.text)} style={styles.optionIcon} />
                    <Text style={styles.optionText}>{i18n.t(option.titleKey)}</Text>
                    <Ionicons name="chevron-forward-outline" size={22} color="#ccc" />
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: defaultStyles.container?.backgroundColor || '#f0f0f0',
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: '#fff', // Or defaultStyles.cardBackground
        borderBottomWidth: 1,
        borderBottomColor: '#eee', // Or defaultStyles.borderColor
    },
    optionIcon: {
        marginRight: 15,
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        color: defaultStyles.text?.color || '#000',
    },
});

export default SettingsScreen;
