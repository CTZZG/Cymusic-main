/**
 * Helper for searching across all plugins
 */

import { searchService } from '@/core/search';
import { IMusic } from '@/types/music';
import { IArtist } from '@/types/artist';
import { IAlbum } from '@/types/album';

const PAGE_SIZE = 20;

type SearchType = 'songs' | 'artists' | 'albums' | 'playlists';

/**
 * Search across all plugins
 * @param searchText Search query
 * @param page Page number (1-based)
 * @param type Type of media to search for
 * @returns Search results and whether there are more results
 */
const searchAllPlugins = async (
  searchText: string,
  page: number = 1,
  type: SearchType = 'songs',
): Promise<{ data: any[]; hasMore: boolean }> => {
  console.log('Searching plugins:', searchText, 'page:', page, 'type:', type);
  
  let results;
  
  if (type === 'songs') {
    results = await searchService.searchMusic(searchText, page);
  } else if (type === 'artists') {
    results = await searchService.searchArtist(searchText, page);
  } else if (type === 'albums') {
    results = await searchService.searchAlbum(searchText, page);
  } else if (type === 'playlists') {
    results = await searchService.searchSheet(searchText, page);
  } else {
    throw new Error(`Unsupported search type: ${type}`);
  }
  
  // Merge results from all plugins
  const mergedResult = searchService.mergeResults(results);
  
  // Transform data if needed
  let transformedData = mergedResult.data;
  
  if (type === 'artists') {
    // Transform artist results to a common format
    transformedData = transformedData.map((artist: IArtist.IArtistItem) => ({
      id: artist.id,
      title: artist.name,
      artist: artist.name,
      artwork: artist.avatar,
      platform: artist.platform,
      isArtist: true,
    }));
  } else if (type === 'albums') {
    // Transform album results to a common format
    transformedData = transformedData.map((album: IAlbum.IAlbumItem) => ({
      id: album.id,
      title: album.title,
      artist: album.artist,
      artwork: album.artwork,
      platform: album.platform,
      isAlbum: true,
    }));
  } else if (type === 'playlists') {
    // Transform playlist results to a common format
    transformedData = transformedData.map((playlist: IMusic.IMusicSheetItem) => ({
      id: playlist.id,
      title: playlist.title,
      artwork: playlist.artwork,
      platform: playlist.platform,
      isPlaylist: true,
    }));
  }
  
  // Determine if there are more results
  const hasMore = !mergedResult.isEnd;
  
  return {
    data: transformedData,
    hasMore,
  };
};

export default searchAllPlugins;
