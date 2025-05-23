// src/app/(modals)/pluginManagementModal.tsx
import { colors, fontSize, screenPadding } from '@/constants/tokens';
import i18n from '@/utils/i18n';
import React from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 插件类型的占位符
type Plugin = { id: string; name: string; version: string; enabled: boolean };

const PluginManagementModal = () => {
	// 插件状态的占位符。将来会从 PluginManager 获取。
	const [plugins, setPlugins] = React.useState<Plugin[]>([]);

	const handleImportFromFile = () => {
		Alert.alert(i18n.t('settings.items.importPluginFromFile'), 'TODO: 实现文件导入');
	};

	const handleImportFromUrl = () => {
		Alert.alert(i18n.t('settings.items.importPluginFromUrl'), 'TODO: 实现URL导入');
	};

	const renderPluginItem = ({ item }: { item: Plugin }) => (
		<View style={styles.pluginItem}>
			<View style={styles.pluginInfo}>
				<Text style={styles.pluginName}>{item.name}</Text>
				<Text style={styles.pluginVersion}>{`v${item.version}`}</Text>
			</View>
			{/* 启用/禁用开关和其他操作的占位符 */}
			<TouchableOpacity onPress={() => Alert.alert("切换插件", item.name)}>
				<Text style={{ color: colors.primary }}>{item.enabled ? "禁用" : "启用"}</Text>
			</TouchableOpacity>
		</View>
	);

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.actionButtonsContainer}>
				<TouchableOpacity style={styles.actionButton} onPress={handleImportFromFile}>
					<Text style={styles.actionButtonText}>{i18n.t('settings.items.importPluginFromFile')}</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.actionButton} onPress={handleImportFromUrl}>
					<Text style={styles.actionButtonText}>{i18n.t('settings.items.importPluginFromUrl')}</Text>
				</TouchableOpacity>
			</View>

			<FlatList
				data={plugins}
				renderItem={renderPluginItem}
				keyExtractor={(item) => item.id}
				ListEmptyComponent={
					<View style={styles.emptyListContainer}>
						<Text style={styles.emptyListText}>{i18n.t('settings.items.noPluginsInstalled')}</Text>
					</View>
				}
				contentContainerStyle={styles.listContentContainer}
			/>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	actionButtonsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		paddingVertical: 16,
		paddingHorizontal: screenPadding.horizontal,
		borderBottomWidth: 1,
		borderBottomColor: colors.textMuted, // 或者使用一个更合适的边框颜色
	},
	actionButton: {
		backgroundColor: colors.primary,
		paddingVertical: 10,
		paddingHorizontal: 15,
		borderRadius: 8,
	},
	actionButtonText: {
		color: colors.text, // 假设按钮文本颜色与主题文本颜色一致
		fontSize: fontSize.sm,
		fontWeight: '600',
	},
	listContentContainer: {
		paddingHorizontal: screenPadding.horizontal,
		paddingTop: 16,
	},
	emptyListContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 50,
	},
	emptyListText: {
		color: colors.textMuted,
		fontSize: fontSize.base,
	},
	pluginItem: {
        backgroundColor: 'rgb(44, 44, 47)', // 与 settingsModal.tsx 中的 item 背景色一致
		padding: 16,
		borderRadius: 8,
		marginBottom: 12,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	pluginInfo: {
		flex: 1,
	},
	pluginName: {
		color: colors.text,
		fontSize: fontSize.base, // 使用预定义的字号
		fontWeight: '600',
	},
	pluginVersion: {
		color: colors.textMuted,
		fontSize: fontSize.xs, // 使用预定义的字号
		marginTop: 4,
	},
});

export default PluginManagementModal;