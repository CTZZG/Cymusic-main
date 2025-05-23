// In src/helpers/pluginDataFetchers.ts (or similar)
import pluginManager from '@/helpers/PluginManager';
// Assuming global types or a central export from '@/types' that resolves these.
// Actual imports might be more specific, e.g., import { IAlbum } from '@/types/album'; etc.
// For this task, we'll use the provided import line.
import { IAlbum, IMusic, IArtist, IPlugin, ICommon } from '@/types';

export async function fetchPluginAlbumInfo(
    albumItemBase: IAlbum.IAlbumItemBase, // Contains platform and id
    page: number
): Promise<IPlugin.IAlbumInfoResult | null> {
    if (!albumItemBase?.platform) {
        console.error("Album item is missing platform information.");
        return null;
    }
    const plugin = pluginManager.getPlugin(albumItemBase.platform);

    if (plugin && plugin.instance?.getAlbumInfo && plugin.userConfig.isEnabled !== false) {
        try {
            const result = await plugin.instance.getAlbumInfo(albumItemBase, page);
            return result;
        } catch (error) {
            console.error(`Error fetching album info from plugin ${albumItemBase.platform}:`, error);
            return null;
        }
    } else {
        if (!plugin) {
            console.warn(`Plugin for ${albumItemBase.platform} not found.`);
        } else if (plugin.userConfig.isEnabled === false) {
            console.warn(`Plugin for ${albumItemBase.platform} is disabled.`);
        } else if (!plugin.instance?.getAlbumInfo) {
            console.warn(`Plugin for ${albumItemBase.platform} does not implement getAlbumInfo.`);
        }
        return null;
    }
}

export async function fetchPluginMusicSheetInfo(
    sheetItem: IMusic.IMusicSheetItem, // Contains platform and id
    page: number
): Promise<IPlugin.ISheetInfoResult | null> {
    if (!sheetItem?.platform) {
        console.error("Sheet item is missing platform information.");
        return null;
    }
    const plugin = pluginManager.getPlugin(sheetItem.platform);

    if (plugin && plugin.instance?.getMusicSheetInfo && plugin.userConfig.isEnabled !== false) {
        try {
            const result = await plugin.instance.getMusicSheetInfo(sheetItem, page);
            return result;
        } catch (error) {
            console.error(`Error fetching music sheet info from plugin ${sheetItem.platform}:`, error);
            return null;
        }
    } else {
        if (!plugin) {
            console.warn(`Plugin for ${sheetItem.platform} not found.`);
        } else if (plugin.userConfig.isEnabled === false) {
            console.warn(`Plugin for ${sheetItem.platform} is disabled.`);
        } else if (!plugin.instance?.getMusicSheetInfo) {
            console.warn(`Plugin for ${sheetItem.platform} does not implement getMusicSheetInfo.`);
        }
        return null;
    }
}

export async function fetchPluginArtistWorks(
    artistItem: IArtist.IArtistItem, // Contains platform and id
    page: number,
    type: IArtist.ArtistMediaType
): Promise<IPlugin.ISearchResult<typeof type> | null> {
    if (!artistItem?.platform) {
        console.error("Artist item is missing platform information.");
        return null;
    }
    const plugin = pluginManager.getPlugin(artistItem.platform);

    if (plugin && plugin.instance?.getArtistWorks && plugin.userConfig.isEnabled !== false) {
        try {
            // The type for getArtistWorks in IPlugin.d.ts is:
            // type IGetArtistWorksFunc = <T extends IArtist.ArtistMediaType>(artistItem: IArtist.IArtistItem, page: number, type: T) => Promise<ISearchResult<T>>;
            // We cast to ensure TypeScript correctly handles the generic method call.
            const result = await (plugin.instance.getArtistWorks as IPlugin.IGetArtistWorksFunc)(artistItem, page, type);
            return result;
        } catch (error) {
            console.error(`Error fetching artist works from plugin ${artistItem.platform} for type ${type}:`, error);
            return null;
        }
    } else {
        if (!plugin) {
            console.warn(`Plugin for ${artistItem.platform} not found.`);
        } else if (plugin.userConfig.isEnabled === false) {
            console.warn(`Plugin for ${artistItem.platform} is disabled.`);
        } else if (!plugin.instance?.getArtistWorks) {
            console.warn(`Plugin for ${artistItem.platform} does not implement getArtistWorks.`);
        }
        return null;
    }
}

// New functions start here

export async function importMusicItemFromPlugin(
    platform: string,
    urlLike: string
): Promise<IMusic.IMusicItem | null> {
    if (!platform) {
        console.error("Platform is required to import music item.");
        return null;
    }
    const plugin = pluginManager.getPlugin(platform);

    if (plugin && plugin.instance?.importMusicItem && plugin.userConfig.isEnabled !== false) {
        try {
            const result = await plugin.instance.importMusicItem(urlLike);
            // Optionally, augment with platform if not already present, though plugins should set this
            if (result && !result.platform) {
                (result as any).platform = platform;
            }
            return result;
        } catch (error) {
            console.error(`Error importing music item from plugin ${platform} for URL ${urlLike}:`, error);
            return null;
        }
    } else {
        if (!plugin) {
            console.warn(`Plugin for ${platform} not found for importing music item.`);
        } else if (plugin.userConfig.isEnabled === false) {
            console.warn(`Plugin for ${platform} is disabled for importing music item.`);
        } else if (!plugin.instance?.importMusicItem) {
            console.warn(`Plugin for ${platform} does not implement importMusicItem.`);
        }
        return null;
    }
}

export async function importMusicSheetFromPlugin(
    platform: string,
    urlLike: string
): Promise<IMusic.IMusicItem[] | null> {
    if (!platform) {
        console.error("Platform is required to import music sheet.");
        return null;
    }
    const plugin = pluginManager.getPlugin(platform);

    if (plugin && plugin.instance?.importMusicSheet && plugin.userConfig.isEnabled !== false) {
        try {
            const result = await plugin.instance.importMusicSheet(urlLike);
            // Optionally, augment items with platform if not already present
            if (result) {
                result.forEach(item => {
                    if (!item.platform) {
                        (item as any).platform = platform;
                    }
                });
            }
            return result;
        } catch (error) {
            console.error(`Error importing music sheet from plugin ${platform} for URL ${urlLike}:`, error);
            return null;
        }
    } else {
        if (!plugin) {
            console.warn(`Plugin for ${platform} not found for importing music sheet.`);
        } else if (plugin.userConfig.isEnabled === false) {
            console.warn(`Plugin for ${platform} is disabled for importing music sheet.`);
        } else if (!plugin.instance?.importMusicSheet) {
            console.warn(`Plugin for ${platform} does not implement importMusicSheet.`);
        }
        return null;
    }
}

// Define an augmented type for top lists that includes the platform
export type AugmentedMusicSheetGroupItem = IMusic.IMusicSheetGroupItem & { platform: string };

export async function fetchAllPluginsTopLists(): Promise<AugmentedMusicSheetGroupItem[]> {
    const activePlugins = pluginManager.getActivePlugins();
    let aggregatedTopLists: AugmentedMusicSheetGroupItem[] = [];

    for (const plugin of activePlugins) {
        if (plugin.instance?.getTopLists && plugin.userConfig.isEnabled !== false) {
            try {
                const topLists = await plugin.instance.getTopLists();
                if (topLists) {
                    const platformAnnotatedTopLists = topLists.map(group => ({
                        ...group,
                        platform: plugin.platform, // Add platform to the group
                        // Ensuring nested data also carries platform if it makes sense for your UI
                        data: group.data.map(item => ({ ...item, platform: plugin.platform }))
                    }));
                    aggregatedTopLists = aggregatedTopLists.concat(platformAnnotatedTopLists);
                }
            } catch (error) {
                console.error(`Error fetching top lists from plugin ${plugin.platform}:`, error);
            }
        }
    }
    return aggregatedTopLists;
}


export async function fetchPluginTopListDetail(
    topListItem: IMusic.IMusicSheetItemBase, // Should contain platform and id
    page: number
): Promise<IPlugin.ITopListInfoResult | null> {
    if (!topListItem?.platform) {
        console.error("Top list item is missing platform information.");
        return null;
    }
    const plugin = pluginManager.getPlugin(topListItem.platform);

    if (plugin && plugin.instance?.getTopListDetail && plugin.userConfig.isEnabled !== false) {
        try {
            const result = await plugin.instance.getTopListDetail(topListItem, page);
            return result;
        } catch (error) {
            console.error(`Error fetching top list detail from plugin ${topListItem.platform} for ID ${topListItem.id}:`, error);
            return null;
        }
    } else {
        if (!plugin) {
            console.warn(`Plugin for ${topListItem.platform} not found for fetching top list detail.`);
        } else if (plugin.userConfig.isEnabled === false) {
            console.warn(`Plugin for ${topListItem.platform} is disabled for fetching top list detail.`);
        } else if (!plugin.instance?.getTopListDetail) {
            console.warn(`Plugin for ${topListItem.platform} does not implement getTopListDetail.`);
        }
        return null;
    }
}

// Define an augmented type for recommend sheet tags that includes the platform
export type AugmentedRecommendSheetTagsResult = IPlugin.IGetRecommendSheetTagsResult & { platform: string };

export async function fetchAllPluginsRecommendSheetTags(): Promise<AugmentedRecommendSheetTagsResult[]> {
    const activePlugins = pluginManager.getActivePlugins();
    let aggregatedTags: AugmentedRecommendSheetTagsResult[] = [];

    for (const plugin of activePlugins) {
        if (plugin.instance?.getRecommendSheetTags && plugin.userConfig.isEnabled !== false) {
            try {
                const tagsResult = await plugin.instance.getRecommendSheetTags();
                if (tagsResult) {
                    // Augment the entire result object with the platform
                    const platformAnnotatedTagsResult = {
                        ...tagsResult,
                        platform: plugin.platform,
                        // Optionally, further augment pinned and data items if needed for your UI
                        // pinned: tagsResult.pinned?.map(p => ({ ...p, platform: plugin.platform })),
                        // data: tagsResult.data?.map(d => ({ ...d, platform: plugin.platform, items: d.items.map(i => ({...i, platform: plugin.platform}))}))
                    };
                    aggregatedTags.push(platformAnnotatedTagsResult);
                }
            } catch (error) {
                console.error(`Error fetching recommend sheet tags from plugin ${plugin.platform}:`, error);
            }
        }
    }
    return aggregatedTags;
}

export async function fetchPluginRecommendSheetsByTag(
    tag: ICommon.IUnique, // Contains id, and platform should be passed separately
    page: number,
    platform: string
): Promise<ICommon.PaginationResponse<IMusic.IMusicSheetItemBase> | null> {
    if (!platform) {
        console.error("Platform is required to fetch recommend sheets by tag.");
        return null;
    }
    if (!tag || !tag.id) {
        console.error("Tag with ID is required to fetch recommend sheets.");
        return null;
    }
    const plugin = pluginManager.getPlugin(platform);

    if (plugin && plugin.instance?.getRecommendSheetsByTag && plugin.userConfig.isEnabled !== false) {
        try {
            const result = await plugin.instance.getRecommendSheetsByTag(tag, page);
            // Optionally augment items with platform if not already present and necessary
            if (result && result.data) {
                result.data.forEach(item => {
                    if (!item.platform) {
                        (item as any).platform = platform;
                    }
                });
            }
            return result;
        } catch (error) {
            console.error(`Error fetching recommend sheets by tag from plugin ${platform} for tag ID ${tag.id}:`, error);
            return null;
        }
    } else {
        if (!plugin) {
            console.warn(`Plugin for ${platform} not found for fetching recommend sheets by tag.`);
        } else if (plugin.userConfig.isEnabled === false) {
            console.warn(`Plugin for ${platform} is disabled for fetching recommend sheets by tag.`);
        } else if (!plugin.instance?.getRecommendSheetsByTag) {
            console.warn(`Plugin for ${platform} does not implement getRecommendSheetsByTag.`);
        }
        return null;
    }
}
