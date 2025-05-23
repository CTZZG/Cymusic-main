import { Stack } from 'expo-router';
import i18n from '@/utils/i18n'; // Import i18n
// Removed GlobalButton and other unused imports for clarity based on new structure
// import GlobalButton from '@/components/GlobalButton';
// import { StackScreenWithSearchBar } from '@/constants/layout';
import { defaultStyles } from '@/styles';
import { View } from 'react-native';
// Removed nowLanguage import as it's not used in the provided new structure
// import { nowLanguage } from '@/utils/i18n';

// Changed component name to match common practice for layout files
const SongsTabLayout = () => {
	// const language = nowLanguage.useValue(); // Removed as key={language} is not standard for this use case
	return (
		<View style={defaultStyles.container}>
			<Stack>
				<Stack.Screen
					name="index" // This is src/app/(tabs)/(songs)/index.tsx
					options={{
						// Removed StackScreenWithSearchBar as TopListsScreen doesn't use search currently
						headerLargeTitle: true, // Retain if desired, or adjust
						title: i18n.t('topLists.title') 
					}}
				/>
				<Stack.Screen 
					name="topListDetail" // This is src/app/(tabs)/(songs)/topListDetail.tsx
					options={{ 
						title: i18n.t('topListDetail.titleFallback') 
						// The actual title for topListDetail can be set dynamically in the component itself
						// using <Stack.Screen options={{ title: dynamicTitle }} />
					}} 
				/>
                 {/* Assuming a playlistDetail screen might be navigated to from RadioScreen's sheets */}
                 <Stack.Screen
                    name="playlistDetail" // Path: /(songs)/playlistDetail - needs to exist or be created
                    options={{
                        title: i18n.t('common.playlistName') || "Playlist", // Example, adjust as needed
                    }}
                />
			</Stack>
		</View>
	)
}

export default SongsTabLayout;
