import { Stack, useRouter } from 'expo-router'; 
import i18n from '@/utils/i18n';
import { TouchableOpacity, View } from 'react-native'; 
import { Ionicons } from '@expo/vector-icons'; 
import { colors } from '@/constants/tokens'; 
import { defaultStyles } from '@/styles';

// Changed component name to match common practice for layout files
const SongsTabLayout = () => {
    const router = useRouter(); // Initialize router

	return (
		<View style={defaultStyles.container}>
			<Stack>
				<Stack.Screen
					name="index" // This is src/app/(tabs)/(songs)/index.tsx
					options={{
						headerLargeTitle: true, 
						title: i18n.t('topLists.title'),
                        headerRight: () => (
                            <TouchableOpacity onPress={() => router.push('/SettingsScreen')} style={{ marginRight: 15 }}>
                              <Ionicons name="settings-outline" size={24} color={colors.icon || (Platform.OS === 'ios' ? colors.primary : colors.text)} />
                            </TouchableOpacity>
                        ),
					}}
				/>
				<Stack.Screen 
					name="topListDetail" // This is src/app/(tabs)/(songs)/topListDetail.tsx
					options={{ 
						title: i18n.t('topListDetail.titleFallback') 
					}} 
				/>
                 <Stack.Screen
                    name="playlistDetail" 
                    options={{
                        title: i18n.t('common.playlistName') || "Playlist", 
                    }}
                />
			</Stack>
		</View>
	)
}

export default SongsTabLayout;
