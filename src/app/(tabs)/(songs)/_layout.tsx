import { Stack } from 'expo-router'; 
import i18n from '@/utils/i18n';
// Removed TouchableOpacity, View, Ionicons, colors, useRouter, Platform as they are no longer needed
// after removing the headerRight button.
import { defaultStyles } from '@/styles';
import { View } from 'react-native'; // View is still used for the root container

// Changed component name to match common practice for layout files
const SongsTabLayout = () => {
    // const router = useRouter(); // Removed as it's no longer used

	return (
		<View style={defaultStyles.container}>
			<Stack>
				<Stack.Screen
					name="index" // This is src/app/(tabs)/(songs)/index.tsx
					options={{
						headerLargeTitle: true, 
						title: i18n.t('topLists.title'),
                        // headerRight was removed here
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
