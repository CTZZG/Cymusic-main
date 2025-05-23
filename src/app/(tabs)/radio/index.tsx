import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { fetchAllPluginsRecommendSheetTags, fetchPluginRecommendSheetsByTag, AugmentedRecommendSheetTagsResult } from '@/helpers/pluginDataFetchers';
import { IPlugin, ICommon, IMusic } from '@/types'; 
import { defaultStyles } from '@/styles';
import { useRouter } from 'expo-router';
import { screenPadding } from '@/constants/tokens';
import i18n from '@/utils/i18n'; // Import i18n instance

interface DisplayTag extends ICommon.IUnique {
    platform: string;
    title?: string;
}

interface DisplayTagGroup {
    title?: string; 
    platform: string; 
    data: DisplayTag[];
}

const RadioScreen = () => {
    const [tagGroups, setTagGroups] = useState<DisplayTagGroup[]>([]);
    const [pinnedTags, setPinnedTags] = useState<DisplayTag[]>([]);
    const [selectedTag, setSelectedTag] = useState<DisplayTag | null>(null);
    const [sheets, setSheets] = useState<IMusic.IMusicSheetItemBase[]>([]);
    const [isLoadingTags, setIsLoadingTags] = useState(true);
    const [isLoadingSheets, setIsLoadingSheets] = useState(false);
    const [currentPageSheets, setCurrentPageSheets] = useState(1);
    const [hasMoreSheets, setHasMoreSheets] = useState(true);
    const router = useRouter();

    const loadInitialTags = useCallback(async () => {
        setIsLoadingTags(true);
        const results: AugmentedRecommendSheetTagsResult[] = await fetchAllPluginsRecommendSheetTags();
        const allPinned: DisplayTag[] = [];
        const allGroups: DisplayTagGroup[] = [];

        results.forEach(pluginResult => {
            const platform = pluginResult.platform; 
            if (pluginResult.pinned) {
                allPinned.push(...pluginResult.pinned.map(t => ({
                    ...t,
                    id: t.id || t.title || `pinned_${Math.random()}`, 
                    title: t.title || t.name || t.id, 
                    platform: platform
                })));
            }
            if (pluginResult.data) {
                allGroups.push(...pluginResult.data.map(g => ({
                    title: g.title,
                    platform: platform,
                    data: g.data.map(t => ({
                        ...t,
                        id: t.id || t.title || `grouped_${Math.random()}`, 
                        title: t.title || t.name || t.id, 
                        platform: platform
                    }))
                })));
            }
        });

        setPinnedTags(allPinned);
        setTagGroups(allGroups);
        setIsLoadingTags(false);
    }, []);

    useEffect(() => {
        loadInitialTags();
    }, [loadInitialTags]);

    const loadSheetsForTag = useCallback(async (tag: DisplayTag, pageToLoad: number, isInitialLoad = false) => {
        if (!tag || (!hasMoreSheets && !isInitialLoad)) return;

        setIsLoadingSheets(true);
        if (isInitialLoad) {
            setSheets([]); 
            setCurrentPageSheets(1); 
            setHasMoreSheets(true); 
        }
        
        const tagToFetch: ICommon.IUnique = { id: tag.id, title: tag.title };
        const result = await fetchPluginRecommendSheetsByTag(tagToFetch, pageToLoad, tag.platform);

        if (result?.data) {
            setSheets(prev => isInitialLoad ? result.data! : [...prev, ...result.data!]);
            setHasMoreSheets(!(result.isEnd ?? true));
            setCurrentPageSheets(pageToLoad + 1); 
        } else if (!result?.data && pageToLoad === 1) { 
            setSheets([]);
            setHasMoreSheets(false);
        } else if (!result?.data) { 
            setHasMoreSheets(false);
        }
        setIsLoadingSheets(false);
    }, [hasMoreSheets]); 


    const handleTagSelect = (tag: DisplayTag) => {
        setSelectedTag(tag);
        loadSheetsForTag(tag, 1, true); 
    };
    
    const handleSheetPress = (sheet: IMusic.IMusicSheetItemBase) => {
        router.push({
            pathname: `/(songs)/playlistDetail`, 
            params: { id: sheet.id, platform: sheet.platform, title: sheet.title, artwork: sheet.artwork },
        });
    };

    const renderTag = (tag: DisplayTag) => (
        <TouchableOpacity 
            key={`${tag.platform}_${tag.id}`} 
            onPress={() => handleTagSelect(tag)} 
            style={[
                styles.tag, 
                selectedTag?.id === tag.id && selectedTag.platform === tag.platform && styles.selectedTag
            ]}
        >
            <Text style={styles.tagText}>{tag.title} ({tag.platform})</Text>
        </TouchableOpacity>
    );

    const renderSheetItem = ({ item }: { item: IMusic.IMusicSheetItemBase }) => (
         <TouchableOpacity onPress={() => handleSheetPress(item)} style={styles.sheetItem}>
            <View style={styles.sheetTextContainer}>
                <Text style={styles.sheetTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.sheetPlatform} numberOfLines={1}>{item.platform} {item.playCount ? `- ${item.playCount} plays` : ''}</Text>
                {item.creator && <Text style={styles.sheetCreator} numberOfLines={1}>By: {item.creator.nickname || item.creator.name}</Text>}
            </View>
        </TouchableOpacity>
    );

    if (isLoadingTags) {
        return <ActivityIndicator style={styles.centered} size="large" />;
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
        >
            <Text style={styles.sectionTitle}>{i18n.t('radioScreen.pinnedTags')}</Text>
            <View style={styles.tagContainer}>
                {pinnedTags.length > 0 ? pinnedTags.map(renderTag) : <Text style={styles.emptyText}>{i18n.t('radioScreen.noPinnedTags')}</Text>}
            </View>

            {tagGroups.map((group, index) => (
                <View key={`${group.platform}_${group.title || 'group'}_${index}`}>
                    <Text style={styles.sectionTitle}>{group.title || i18n.t('radioScreen.tagsFallbackTitle')} ({group.platform})</Text>
                    <View style={styles.tagContainer}>
                        {group.data.length > 0 ? group.data.map(renderTag) : <Text style={styles.emptyText}>{i18n.t('radioScreen.noTagsInGroup')}</Text>}
                    </View>
                </View>
            ))}

            {selectedTag && (
                <View style={styles.sheetsSection}>
                    <Text style={styles.sectionTitle}>{i18n.t('radioScreen.playlistsForTag', { tagName: selectedTag.title, platformName: selectedTag.platform })}</Text>
                    {isLoadingSheets && sheets.length === 0 ? ( 
                        <ActivityIndicator size="large" style={{ marginTop: 20 }}/>
                    ) : (
                        <FlatList
                            data={sheets}
                            renderItem={renderSheetItem}
                            keyExtractor={(item, idx) => `${item.platform}_${item.id}_${idx}`} 
                            ListEmptyComponent={!isLoadingSheets ? <Text style={styles.emptyText}>{i18n.t('radioScreen.noPlaylistsForTag')}</Text> : null}
                            onEndReached={() => selectedTag && loadSheetsForTag(selectedTag, currentPageSheets)}
                            onEndReachedThreshold={0.5}
                            ListFooterComponent={isLoadingSheets && sheets.length > 0 ? <ActivityIndicator style={{ marginVertical: 20 }} /> : null}
                        />
                    )}
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: defaultStyles.container?.backgroundColor || '#f8f8f8', 
    },
    scrollContentContainer: {
        paddingBottom: screenPadding.bottom + 20, 
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 20, 
    },
    sectionTitle: {
        fontSize: 20, 
        fontWeight: 'bold',
        paddingHorizontal: screenPadding.horizontal,
        paddingTop: 15, 
        paddingBottom: 8, 
        color: defaultStyles.text?.color || '#222', 
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: screenPadding.horizontal - 4, 
        marginBottom:10, 
    },
    tag: {
        backgroundColor: '#e0e0e0', 
        paddingVertical: 8,
        paddingHorizontal: 14, 
        margin: 4, 
        borderRadius: 16, 
    },
    selectedTag: {
        backgroundColor: '#c0c0c0', 
    },
    tagText: {
        color: '#333', 
        fontSize: 14,
        fontWeight: '500', 
    },
    sheetsSection: {
        marginTop: 10, 
    },
    sheetItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: screenPadding.horizontal,
        borderBottomWidth: 1,
        borderColor: '#eaeaea', 
        backgroundColor: '#fff', 
    },
    sheetTextContainer: { 
        flex: 1,
    },
    sheetTitle: {
        fontSize: 16,
        fontWeight: '600', 
        color: '#333',
    },
    sheetPlatform: {
        fontSize: 12,
        color: '#777', 
        marginTop: 2,
    },
    sheetCreator: {
        fontSize: 12,
        color: '#777',
        marginTop: 2,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 15, 
        paddingHorizontal: screenPadding.horizontal,
        fontSize: 15, 
        color: '#6c6c6c', 
    }
});

export default RadioScreen;
