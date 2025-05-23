import { unknownTrackImageUri } from '@/constants/images'
import { colors, screenPadding } from '@/constants/tokens'
import { logError } from '@/helpers/logger'
import myTrackPlayer from '@/helpers/trackPlayerIndex'
// Removed: import { getPlayListFromQ } from '@/helpers/userApi/getMusicSource'
import { defaultStyles } from '@/styles'
import { Ionicons } from '@expo/vector-icons'
import { useHeaderHeight } from '@react-navigation/elements'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import {
	ActivityIndicator,
	Image,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

// New imports for plugin functionality
import pluginManager from '@/helpers/PluginManager'
import { importMusicSheetFromPlugin } from '@/helpers/pluginDataFetchers'
import { IMusic, IPlugin } from '@/types' // Assuming ManagedPlugin might be part of IPlugin or defined in PluginManager.ts

// Minimal ManagedPlugin interface if not directly importable / for structural reference
interface ManagedPlugin extends IPlugin.IPluginDefine {
    id: string;
    filePath: string;
    userConfig: { userVariables?: Record<string, string>; isEnabled?: boolean };
    instance?: IPlugin.IPluginDefine;
}


const ImportPlayListModal = () => {
	const [playlistUrl, setPlaylistUrl] = useState('')
	const [playlistData, setPlaylistData] = useState<IMusic.PlayList | null>(null) // For success message
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [customName, setCustomName] = useState('')
	const [coverImage, setCoverImage] = useState<string | null>(null)

	// State for plugin selection
	const [plugins, setPlugins] = useState<ManagedPlugin[]>([]);
	const [selectedPluginPlatform, setSelectedPluginPlatform] = useState<string | null>(null);


	const nameInputRef = useRef<TextInput>(null)
	const urlInputRef = useRef<TextInput>(null)

	const headerHeight = useHeaderHeight()
	const { top } = useSafeAreaInsets()

    useEffect(() => {
        const availablePlugins = pluginManager.getActivePlugins().filter(
            p => p.instance?.importMusicSheet && p.userConfig.isEnabled !== false
        );
        setPlugins(availablePlugins);
        // Optionally select the first one by default
        // if (availablePlugins.length > 0) {
        //     setSelectedPluginPlatform(availablePlugins[0].platform);
        // }
    }, []);

	const pickImage = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 1,
		})

		if (!result.canceled) {
			setCoverImage(result.assets[0].uri)
		}
	}

	const handleCreatePlaylist = async () => {
		if (!customName.trim()) {
			setError('请输入歌单名称')
			return
		}
		setIsLoading(true)
		setError(null)
        setSuccessMessage(null);
		try {
			const newPlaylist: IMusic.PlayList = {
				id: Date.now().toString(),
				platform: 'local', // Or some identifier for user-created playlists
				artist: 'Various Artists', // Default artist
				name: customName.trim(),
				title: customName.trim(),
				songs: [],
				artwork: coverImage || unknownTrackImageUri,
				// tracks: [], // 'tracks' is not standard in IMusic.PlayList, 'songs' is used
			}
			await myTrackPlayer.addPlayLists(newPlaylist)
			router.dismiss()
		} catch (err) {
			setError('创建失败，请重试')
			logError('创建错误:', err)
		} finally {
			setIsLoading(false)
		}
	}

	const handleImport = async () => {
        if (!selectedPluginPlatform) {
            setError('Please select a source to import from.');
            setSuccessMessage(null);
            return;
        }
        if (!playlistUrl.trim()) {
            setError('Please enter the playlist URL or ID.');
            setSuccessMessage(null);
            return;
        }

		setIsLoading(true)
		setError(null)
        setSuccessMessage(null);
		try {
            const importedSongs = await importMusicSheetFromPlugin(selectedPluginPlatform, playlistUrl);

            if (importedSongs && importedSongs.length > 0) {
                const playlistName = customName.trim() || `Imported from ${selectedPluginPlatform}`;
                const newPlaylist: IMusic.PlayList = {
                    id: Date.now().toString(),
                    platform: selectedPluginPlatform, // Use the plugin's platform
                    artist: 'Various Artists', // Placeholder, could be improved
                    name: playlistName,
                    title: playlistName,
                    songs: importedSongs,
                    artwork: coverImage || importedSongs[0]?.artwork || unknownTrackImageUri,
                };
                await myTrackPlayer.addPlayLists(newPlaylist);
                setPlaylistData(newPlaylist); // For success message context
                setPlaylistUrl('');
                // setCustomName(''); // Keep custom name if user wants to import another with same name
                // setCoverImage(null); // Keep cover image if user wants to import another with same cover
                setError(null);
                setSuccessMessage(`Successfully imported ${importedSongs.length} songs into "${playlistName}". You can import another or close this modal.`);
                // router.dismiss(); // Keep modal open
            } else {
                setError(`Failed to import playlist from ${selectedPluginPlatform}. No songs returned or import failed.`);
            }
		} catch (err: any) {
			setError(`Import failed: ${err.message || 'Please check the URL and selected source.'}`);
			logError('Import error:', err)
		} finally {
			setIsLoading(false)
		}
	}

	const DismissPlayerSymbol = () => (
		<View style={[styles.dismissSymbol, { top: top - 25 }]}>
			<View style={styles.dismissBar} />
		</View>
	)

	return (
		<SafeAreaView style={[styles.modalContainer, { paddingTop: headerHeight }]}>
			<DismissPlayerSymbol />
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
			>
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ flexGrow: 1 }}
					keyboardShouldPersistTaps="handled"
				>
					<Text style={styles.header}>Import / Create Playlist</Text>

					{/* Create New Playlist Section (remains largely the same) */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Create New Playlist</Text>
						<View style={styles.createPlaylistCard}>
							<View style={styles.createPlaylistContainer}>
								<View style={styles.coverContainer}>
									<TouchableOpacity onPress={pickImage} style={styles.coverPicker}>
										{coverImage ? (
											<Image source={{ uri: coverImage }} style={styles.coverImage} />
										) : (
											<View style={styles.coverPlaceholder}>
												<Ionicons name="image-outline" size={24} color={colors.primary} />
												<Text style={styles.coverText}>Choose Cover</Text>
											</View>
										)}
									</TouchableOpacity>
								</View>
								<View style={styles.playlistInfoContainer}>
									<View style={[styles.inputContainer, { marginBottom: 0 }]}>
										<TextInput
											ref={nameInputRef}
											style={styles.input}
											value={customName}
											onChangeText={setCustomName}
											placeholder="Enter playlist name (optional for import)"
											placeholderTextColor="#999"
											autoCapitalize="none"
											returnKeyType="done"
										/>
									</View>
								</View>
							</View>
							<TouchableOpacity
								onPress={handleCreatePlaylist}
								activeOpacity={0.8}
								style={styles.button}
								disabled={isLoading && selectedPluginPlatform !== null} // Disable if importing
							>
								{isLoading && !selectedPluginPlatform ? (
									<ActivityIndicator color="#fff" />
								) : (
									<>
										<Ionicons name="add-circle-outline" size={24} color={colors.primary} />
										<Text style={styles.buttonText}>Create Playlist</Text>
									</>
								)}
							</TouchableOpacity>
						</View>
					</View>

					<View style={styles.divider} />

					{/* Import Existing Playlist Section - Modified for Plugins */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Import Playlist from Source</Text>
						<View style={styles.createPlaylistCard}>
                            <View style={styles.pluginSelectorContainer}>
                                <Text style={styles.inputLabel}>Select Source:</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pluginScrollView}>
                                    {plugins.map(p => (
                                        <TouchableOpacity
                                            key={p.platform}
                                            style={[
                                                styles.pluginButton,
                                                selectedPluginPlatform === p.platform && styles.pluginButtonSelected
                                            ]}
                                            onPress={() => setSelectedPluginPlatform(p.platform)}
                                        >
                                            <Text style={styles.pluginButtonText}>{p.platform}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                {plugins.length === 0 && <Text style={styles.infoText}>No importable plugin sources found.</Text>}
                            </View>

							<View style={styles.importContainer}>
								<TextInput
									ref={urlInputRef}
									style={styles.input}
									value={playlistUrl}
									onChangeText={setPlaylistUrl}
									placeholder="Enter playlist URL or ID from selected source"
									placeholderTextColor="#999"
									autoCapitalize="none"
									keyboardType="url"
									returnKeyType="done"
								/>
							</View>

							<TouchableOpacity
								onPress={handleImport}
								activeOpacity={0.8}
								style={[styles.button, (!selectedPluginPlatform || isLoading) && styles.buttonDisabled]}
								disabled={isLoading || !selectedPluginPlatform}
							>
								{isLoading && selectedPluginPlatform !== null ? ( // Show loader only when importing
									<ActivityIndicator color="#fff" />
								) : (
									<>
										<Ionicons name="cloud-download-outline" size={24} color={colors.primary} />
										<Text style={styles.buttonText}>Import Playlist</Text>
									</>
								)}
							</TouchableOpacity>
						</View>
					</View>

					{error && <Text style={styles.error}>{error}</Text>}
					{successMessage && <Text style={styles.successText}>{successMessage}</Text>}
                    {/* Kept for context, but success is now handled by successMessage state */}
					{/* {playlistData && !error && ( 
						<Text style={styles.successText}>Imported: {playlistData.name}</Text>
					)} */}
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	modalContainer: {
		...defaultStyles.container,
		paddingHorizontal: screenPadding.horizontal,
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: '600',
		color: colors.text,
		marginBottom: 16,
	},
    infoText: {
        color: colors.textMuted,
        fontSize: 14,
        textAlign: 'center',
        marginTop: 5,
    },
	divider: {
		height: 1,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		marginVertical: 24,
	},
	dismissSymbol: {
		position: 'absolute',
		left: 0,
		right: 0,
		flexDirection: 'row',
		justifyContent: 'center',
		zIndex: 1,
	},
	dismissBar: {
		width: 50,
		height: 5,
		borderRadius: 2.5,
		backgroundColor: '#c7c7cc',
	},
	inputContainer: {
		width: '100%',
	},
	inputLabel: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.text,
		marginBottom: 8,
	},
	header: {
		fontSize: 31,
		fontWeight: 'bold',
		padding: 0,
		paddingTop: 5,
		marginBottom: 24,
		color: colors.text,
	},
	input: {
		height: 44,
		backgroundColor: '#2C2C2F',
		borderRadius: 8,
		paddingHorizontal: 16,
		fontSize: 16,
		color: '#fff',
		width: '100%',
	},
	coverContainer: {
		width: 100,
	},
	coverPicker: {
		width: 100,
		height: 100,
		borderRadius: 8,
		overflow: 'hidden',
		backgroundColor: '#2C2C2F',
		justifyContent: 'center',
		alignItems: 'center',
	},
	coverImage: {
		width: '100%',
		height: '100%',
		resizeMode: 'cover',
	},
	coverPlaceholder: {
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	coverText: {
		color: colors.primary,
		marginTop: 8,
		fontSize: 14,
	},
	error: {
		color: '#ff3b30', // iOS system red
        textAlign: 'center',
		marginTop: 10,
        paddingHorizontal: 10,
	},
	successText: {
		color: '#34c759', // iOS system green
        textAlign: 'center',
		marginTop: 10,
        paddingHorizontal: 10,
	},
	button: {
		padding: 12,
		backgroundColor: '#2C2C2F',
		borderRadius: 8,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		columnGap: 8,
		width: '100%',
	},
    buttonDisabled: {
        opacity: 0.5,
    },
	buttonText: {
		...defaultStyles.text,
		color: colors.primary,
		fontWeight: '600',
		fontSize: 18,
		textAlign: 'center',
	},
	createPlaylistCard: {
		backgroundColor: '#1C1C1F',
		borderRadius: 12,
		padding: 16,
		gap: 16,
	},
	createPlaylistContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		columnGap: 16,
	},
	playlistInfoContainer: {
		flex: 1,
		height: 100,
		justifyContent: 'center',
	},
	importContainer: {
		width: '100%',
	},
    pluginSelectorContainer: {
        marginBottom: 16,
    },
    pluginScrollView: {
        maxHeight: 60, // Limit height if many plugins
    },
    pluginButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#2C2C2F',
        borderRadius: 8,
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    pluginButtonSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryMuted,
    },
    pluginButtonText: {
        color: colors.text,
        fontSize: 14,
    },
})

export default ImportPlayListModal
