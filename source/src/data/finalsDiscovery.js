import { FINALS_PLACES } from './finalsCatalog.js';
import { getPlaceReview } from './wheelchairPhotoReview.js';

export const DISTRICT_NAMES = ['유성구', '서구', '중구', '동구', '대덕구'];
export const SPACE_TYPES = ['전체', '문화·역사', '공원·휴식', '교통', '공공·생활', '과학·배움'];
const GROUP_IDS = {
  '문화·역사': ['arts', 'museum', 'dongchundang', 'uam', 'leeungno', 'gugak', 'modernhistory', 'temiorae', 'literature', 'prehistory'],
  '공원·휴식': ['hanbit', 'onsen', 'oworld', 'daecheong', 'arboretum', 'expoBridge', 'sikjang', 'daedong'],
  '교통': ['station', 'subway', 'terminal', 'sintanjin'],
  '공공·생활': ['cityhall', 'civic', 'dcc'],
  '과학·배움': ['science', 'library', 'observatory', 'geology', 'currency'],
};
export const spaceTypeFor = place => place.spaceType || SPACE_TYPES.find(type => GROUP_IDS[type]?.includes(place.id)) || place.category;
export const countPhotos = places => new Set(places.flatMap(place => Object.values(place.photos).map(photo => photo.image))).size;
const searchText = value => value.replace(/\s+/g, '').toLocaleLowerCase('ko');
export function filterFinalsPlaces({ district = '전체', spaceType = '전체', query = '', onlySegments = false } = {}) {
  const needle = searchText(query);
  return FINALS_PLACES.filter(place => (district === '전체' || district === place.district)
    && (spaceType === '전체' || spaceType === spaceTypeFor(place))
    && searchText(`${place.name} ${place.shortName} ${place.district} ${place.category} ${spaceTypeFor(place)}`).includes(needle)
    && (!onlySegments || getPlaceReview(place).hasSegments));
}
