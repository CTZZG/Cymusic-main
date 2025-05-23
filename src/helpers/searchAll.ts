// helpers/searchAll.ts
import pluginManager from '@/helpers/PluginManager'; // Import PluginManager
import { Track } from 'react-native-track-player';
// Assuming types are available globally via d.ts files or a central types export
// No direct import for IPlugin or ICommon needed if they are global namespaces.

const PAGE_SIZE = 20; // This might need adjustment based on how plugins paginate

type SearchAllType = 'songs' | 'artists'; // Existing type in searchAll

// Helper to map SearchAllType to plugin's SupportMediaType
function mapSearchType(type: SearchAllType): ICommon.SupportMediaType {
    if (type === 'songs') return 'music';
    if (type === 'artists') return 'artist';
    return 'music'; // Default
}

const searchAll = async (
    searchText: string,
    page: number = 1,
    type: SearchAllType = 'songs',
): Promise<{ data: Track[]; hasMore: boolean }> => {
    console.log('searchAll called with text:', searchText, 'page:', page, 'type:', type);

    const activePlugins = pluginManager.getActivePlugins();
    const pluginSearchType = mapSearchType(type);
    let aggregatedResults: Track[] = [];
    let hasMoreOverall = false; // Initialize to false

    for (const plugin of activePlugins) {
        if (plugin.instance?.search && plugin.userConfig.isEnabled !== false) {
            // Optional: Check if plugin supports the current search type
            // const supportedTypes = plugin.instance.supportedSearchType || ['music', 'artist', 'album', 'sheet', 'lyric'];
            // if (!supportedTypes.includes(pluginSearchType)) {
            //     console.log(`Plugin ${plugin.platform} does not support search type ${pluginSearchType}`);
            //     continue;
            // }

            try {
                console.log(`Searching with plugin: ${plugin.platform} for type: ${pluginSearchType}`);
                const result: IPlugin.ISearchResult<typeof pluginSearchType> = await plugin.instance.search(
                    searchText,
                    page,
                    pluginSearchType,
                );

                if (result.data && result.data.length > 0) {
                    // If any plugin returns data and doesn't explicitly say it's the end,
                    // we can assume there might be more data either from this plugin on the next page
                    // or from other plugins.
                    if (result.isEnd === false) {
                        hasMoreOverall = true;
                    }
                    // If result.isEnd is undefined, and we got data, it's safer to assume more might be available.
                    // If result.isEnd is true, this specific plugin is done for this query.
                    // hasMoreOverall will remain true if another plugin indicated !isEnd.
                    // If all plugins return isEnd:true or no data, hasMoreOverall will remain false (unless data.length > 0, see below)

                    const mappedData = result.data.map((item: any /* IMusic.IMusicItemBase or IArtist.IArtistItemBase */) => {
                        // Basic mapping, might need more robust field checks
                        const track: Track = {
                            id: String(item.id), // Ensure id is a string
                            title: item.title || item.name, // Use name for artists
                            artist: item.artist || item.name, // Use name for artists
                            artwork: item.artwork || item.avatar, // Use avatar for artists
                            url: item.url || '', // May not be directly available or needed for search results
                            platform: plugin.platform, // Assign platform from plugin
                            // duration, album etc. might be missing or need to be fetched separately if not provided by search
                        };
                        if (pluginSearchType === 'artist') {
                            track.isArtist = true;
                        }
                        return track;
                    });
                    aggregatedResults = aggregatedResults.concat(mappedData);
                }
            } catch (error) {
                console.error(`Error searching with plugin ${plugin.platform}:`, error);
            }
        } else {
            if (!plugin.instance?.search) {
                console.log(`Plugin ${plugin.platform} does not implement search or instance is not available.`);
            }
            if (plugin.userConfig.isEnabled === false) {
                console.log(`Plugin ${plugin.platform} is disabled.`);
            }
        }
    }

    // Simple de-duplication based on id and platform
    const uniqueResults = aggregatedResults.filter((track, index, self) =>
        index === self.findIndex((t) => t.id === track.id && t.platform === track.platform)
    );

    // A simple heuristic for hasMoreOverall: if we fetched any results, and no plugin explicitly stated it was the end.
    // If uniqueResults.length > 0 and hasMoreOverall was not set to true by any plugin saying !isEnd,
    // it implies all plugins either returned isEnd:true or no data.
    // However, if we got some data, it's possible that a *different* plugin might have more on its page 1
    // even if the current ones are exhausted. This is tricky with multi-plugin aggregation.
    // For now: if any plugin explicitly stated `isEnd: false`, `hasMoreOverall` is true.
    // If no plugin stated `isEnd: false`, but we got results, it's ambiguous.
    // Let's refine: if any plugin says "isEnd: false", it's true. Otherwise, it's false.
    // This means we rely on plugins to correctly report their pagination status.
    // If all plugins report isEnd: true or return no data, then hasMoreOverall will be false.

    console.log(`Search results for "${searchText}" (page ${page}, type ${type}): ${uniqueResults.length} items. HasMore: ${hasMoreOverall}`);

    return {
        data: uniqueResults,
        hasMore: hasMoreOverall,
    };
};

export default searchAll;
