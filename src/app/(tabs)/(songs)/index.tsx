import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { fetchAllPluginsTopLists, AugmentedMusicSheetGroupItem } from '@/helpers/pluginDataFetchers';
import { defaultStyles } from '@/styles';
import { screenPadding } from '@/constants/tokens';
import { useRouter } from 'expo-router'; 
import { IMusic } from '@/types'; 
import i18n from '@/utils/i18n'; // Import i18n instance

const TopListsScreen = () => {
    const [topListGroups, setTopListGroups] = useState<AugmentedMusicSheetGroupItem[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadTopLists = async () => {
            setLoading(true);
            try {
                const groups = await fetchAllPluginsTopLists();
                setTopListGroups(groups);
            } catch (error) {
                console.error("Failed to fetch top lists:", error);
            }
            setLoading(false);
        };
        loadTopLists();
    }, []);

    const handleTopListItemPress = (item: IMusic.IMusicSheetItemBase) => {
        console.log("Selected Top List:", item.title, "from", item.platform, "with ID:", item.id);
        router.push({
            pathname: `/(songs)/topListDetail`, 
            params: { id: item.id, platform: item.platform, title: item.title, artwork: item.artwork },
        });
    };

    const renderTopListItem = ({ item }: { item: IMusic.IMusicSheetItemBase }) => (
        <TouchableOpacity onPress={() => handleTopListItemPress(item)}>
            <View style={styles.listItem}>
                <Text style={styles.listItemText}>{item.title} ({item.platform})</Text>
            </View>
        </TouchableOpacity>
    );

    const renderGroup = ({ item: group }: { item: AugmentedMusicSheetGroupItem }) => (
        <View style={styles.groupContainer}>
            <Text style={styles.groupTitle}>
                {group.title} {group.platform ? `(${group.platform})` : ''}
            </Text>
            <FlatList
                data={group.data}
                renderItem={renderTopListItem}
                keyExtractor={(listItem) => `${listItem.platform}_${listItem.id}`}
                horizontal={false} 
            />
        </View>
    );

    if (loading) {
        return (
            <View style={[defaultStyles.container, styles.centered]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!topListGroups.length) {
        return (
            <View style={[defaultStyles.container, styles.centered]}>
                <Text>{i18n.t('topLists.noListsAvailable')}</Text>
            </View>
        );
    }

    return (
        <View style={defaultStyles.container}>
            <FlatList
                data={topListGroups}
                renderItem={renderGroup}
                keyExtractor={(group, index) => `${group.platform}_${group.title}_${index}`}
                contentContainerStyle={{ paddingHorizontal: screenPadding.horizontal, paddingTop: 10 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
        // Ensure styles.centered takes up full space if it's meant to center content within the whole screen
        flex: 1, 
    },
    groupContainer: {
        marginBottom: 20,
    },
    groupTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: defaultStyles.text?.color || '#333', 
    },
    listItem: {
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderColor: '#eee', 
        backgroundColor: defaultStyles.container?.backgroundColor || '#fff', 
        borderRadius: 5,
        marginBottom: 5,
    },
    listItemText: {
        fontSize: 16,
        color: defaultStyles.text?.color || '#444', 
    },
});

export default TopListsScreen;
