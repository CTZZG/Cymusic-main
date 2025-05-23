import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { fetchPluginTopListDetail } from '@/helpers/pluginDataFetchers';
import { IMusic, IPlugin } from '@/types'; 
import { defaultStyles } from '@/styles';
import { screenPadding } from '@/constants/tokens';
import { TracksListItem } from '@/components/TracksListItem'; 
import myTrackPlayer from '@/helpers/trackPlayerIndex'; 
import i18n from '@/utils/i18n'; // Import i18n instance

const TopListDetailScreen = () => {
    const params = useLocalSearchParams<{ id: string; platform: string; title: string; artwork?: string }>();
    const { id, platform, title, artwork } = params;

    const [musicList, setMusicList] = useState<IMusic.IMusicItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [hasMoreToLoad, setHasMoreToLoad] = useState(true);

    const loadTopListDetails = useCallback(async (pageToFetch: number) => {
        if (!id || !platform) {
            setError(i18n.t('topListDetail.detailsNotFound')); // Or a more generic error
            setLoading(false);
            setIsFetchingMore(false);
            return;
        }

        if (pageToFetch === 1) setLoading(true); else setIsFetchingMore(true);
        setError(null);

        try {
            const topListItemBase: IMusic.IMusicSheetItemBase = {
                id,
                platform,
                title: title || i18n.t('topListDetail.titleFallback'), 
                artwork: artwork || '',
            };

            const result: IPlugin.ITopListInfoResult | null = await fetchPluginTopListDetail(topListItemBase, pageToFetch);

            if (result?.musicList && result.musicList.length > 0) {
                setMusicList(prev => pageToFetch === 1 ? result.musicList! : [...prev, ...result.musicList!]);
                if (result.isEnd === true || result.musicList.length === 0) {
                    setHasMoreToLoad(false);
                }
            } else if (pageToFetch === 1) {
                setMusicList([]); 
                setHasMoreToLoad(false);
            } else {
                 setHasMoreToLoad(false); 
            }
        } catch (e) {
            console.error("Failed to fetch top list details:", e);
            setError(i18n.t('common.error')); // Generic error
        } finally {
            if (pageToFetch === 1) setLoading(false); else setIsFetchingMore(false);
        }
    }, [id, platform, title, artwork]); // Ensure all dependencies that can change are listed

    useEffect(() => {
        loadTopListDetails(1); 
    }, [loadTopListDetails]); // Rerun if loadTopListDetails changes (e.g. due to params changing)

    const handleLoadMore = () => {
        if (!isFetchingMore && hasMoreToLoad) {
            setCurrentPage(prevPage => {
                const nextPage = prevPage + 1;
                loadTopListDetails(nextPage); // loadTopListDetails now uses currentPage from state
                return nextPage;
            });
        }
    };

    const handleTrackPress = (track: IMusic.IMusicItem) => {
        const fullTrackList = musicList.map(item => ({ ...item, artwork: item.artwork || artwork }));
        myTrackPlayer.playWithReplacePlayList(track, fullTrackList);
    };


    if (loading && currentPage === 1) {
        return (
            <View style={[defaultStyles.container, styles.centered]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={[defaultStyles.container, styles.centered]}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }
    
    // Use passed title or fallback for screen options
    const screenTitle = title || i18n.t('topListDetail.titleFallback');

    return (
        <View style={defaultStyles.container}>
            <Stack.Screen options={{ title: screenTitle }} />
            <FlatList
                data={musicList}
                renderItem={({ item }) => (
                    <TracksListItem
                        track={{...item, artwork: item.artwork || artwork }} 
                        onTrackPress={() => handleTrackPress(item)}
                    />
                )}
                keyExtractor={(item, index) => `${item.platform}_${item.id}_${index}`}
                contentContainerStyle={{ paddingHorizontal: screenPadding.horizontal, paddingTop: 10 }}
                ListHeaderComponent={artwork ? (
                    // Using artwork directly as a simple text placeholder as in original.
                    // A real app would use an <Image> component here.
                    <Text style={styles.artworkText}>{i18n.t('topListDetail.artworkFor', { title: screenTitle })}</Text>
                ) : null}
                ListEmptyComponent={
                    !loading && !isFetchingMore ? (
                        <View style={styles.centered}>
                            <Text>{i18n.t('topListDetail.noSongs')}</Text>
                        </View>
                    ) : null
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={isFetchingMore ? <ActivityIndicator style={{ marginVertical: 20 }} /> : null}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
    },
    artworkText: { // Placeholder for actual image
        fontSize: 16,
        color: defaultStyles.text?.color ||'#888',
        marginBottom: 8,
        textAlign: 'center',
        padding: 10,
    },
    container: { // Added from original for consistency
        flex: 1,
        backgroundColor: defaultStyles.container?.backgroundColor, 
    },
    headerContainer: { // Added from original for consistency
        padding: 16,
        alignItems: 'center',
    },
    titleText: { // Added from original for consistency
        fontSize: 24,
        fontWeight: 'bold',
        color: defaultStyles.text?.color, 
    },
    emptyText: { // Added from original for consistency
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: defaultStyles.text?.color || '#888',
    }
});

export default TopListDetailScreen;
