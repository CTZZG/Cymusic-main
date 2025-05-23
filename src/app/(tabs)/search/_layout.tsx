import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/tokens';
import { defaultStyles } from '@/styles';
import i18n from '@/utils/i18n';
// Removed nowLanguage import as it's not directly used in the modified structure
// import { nowLanguage } from '@/utils/i18n';
// Removed StackScreenWithSearchBar as we are customizing headerRight directly
// import { StackScreenWithSearchBar } from '@/constants/layout';

const SearchTabLayout = () => {
	const router = useRouter();
	// const language = nowLanguage.useValue(); // Not directly used for keying the View here

	return (
		<View style={defaultStyles.container}>
			<Stack>
				<Stack.Screen
					name="index"
					options={{
						// ...StackScreenWithSearchBar, // Removed to avoid conflict if it sets headerRight
						headerLargeTitle: true, // Assuming this was intended from StackScreenWithSearchBar
						title: i18n.t('search.title', 'Search'), // New i18n key
						headerRight: () => (
                            <TouchableOpacity onPress={() => router.push('/SettingsScreen')} style={{ marginRight: 15 }}>
                              <Ionicons name="settings-outline" size={24} color={colors.icon || (Platform.OS === 'ios' ? colors.primary : colors.text)} />
                            </TouchableOpacity>
                        ),
					}}
				/>

				<Stack.Screen
					name="[name]" // This is for dynamic routes like search results detail
					options={{
						headerTitle: '',
						headerBackVisible: true,
						headerStyle: {
							backgroundColor: colors.background,
						},
						headerTintColor: colors.primary,
					}}
				/>
			</Stack>
		</View>
	)
}

export default SearchTabLayout;
