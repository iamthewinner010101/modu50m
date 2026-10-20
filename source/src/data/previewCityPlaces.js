import { PREVIEW_PRECINCTS, getPreviewPrecinct } from './previewRoadviewSelection.js';
import { CITY_EXPANSION_PLACES } from './previewCityExpansion.js';
import { EXPANSION_V18_PLACES } from './previewExpansionV18.js';

// Public exterior references are not Roadview captures or entrance evidence.
const referencePhoto = (id, image, sourceUrl, providerLabel, extra = {}) => ({
  id, image: `/modu50m/place-reference-v6/${image}`, sourceUrl, provider: 'public-reference', providerLabel,
  captureDate: null, captureDatePrecision: 'unknown', retrievedAt: '2026-09-20',
  camera: null, mapBindingVerified: false, fieldVerified: false, entranceVerified: false,
  captureMethod: 'public-source-photo-unmodified', ...extra,
});

const SCIENCE_SOURCE = 'https://inmun360.culture.go.kr/content/580.do?cid=2369845&mode=view&page=28';
const DONGCHUNDANG_SOURCE = 'https://www.daedeok.go.kr/fet/goContents.do?link=%2Ffet%2Ffet06%2FFET0604&menuId=FET0604';

export const NEW_CITY_PLACES = [
  {
    id: 'station', name: '대전역', shortName: '대전역', district: '동구', category: '교통',
    description: '대전 여행의 시작, 서광장과 긴 유리 역사를 만나보세요.',
    referenceOnly: true, thumbnail: '/modu50m/place-reference-v6/station-front.jpg',
    coverage: '2019년 서광장 외관 사진 · 현재 출입구와 이동 경로는 확인 전',
    photos: {
      facade: referencePhoto('station-west-20190608', 'station-front.jpg', 'https://commons.wikimedia.org/wiki/File:Q20919_Daejeon_Station_A01.jpg', 'Wikimedia Commons', {
        captureDate: '2019-06-08', captureDatePrecision: 'day', historical: true,
        attribution: '*Youngjin · CC BY-SA 3.0 · 원본 사진', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      }),
    },
    checkpoints: [{ id: 'facade', number: '01', title: '서광장과 역사 정면', short: '서광장',
      question: '긴 유리 정면과 차양, 꽃시계와 광장 배치를 살펴보세요.',
      hint: '2019년 6월 8일 서광장에서 촬영한 공개 외관 사진입니다. 현재 출입문과 보행 동선은 확인 전입니다.',
      next: '이용할 출입구의 현재 모습, 승강기와 승강장까지의 연결을 확인하기',
      features: ['역사 정면', '광장', '보행 차양'],
    }],
  },
  {
    id: 'science', name: '국립중앙과학관', shortName: '중앙과학관', district: '유성구', category: '과학',
    description: '중앙 아치와 하얀 천체관, 과학관의 넓은 마당을 둘러보세요.',
    referenceOnly: true, thumbnail: '/modu50m/place-reference-v6/science-campus.jpg',
    coverage: '공개 항공·전경 사진 2장 · 촬영일과 입구 접근 경로는 미확인',
    photos: {
      campus: referencePhoto('science-campus-reference', 'science-campus.jpg', SCIENCE_SOURCE, '인문360', {
        publishedAt: '2019-01-30', historical: true, attribution: '한국문화예술교육진흥원 인문360 · 원본 사진',
        licenseLabel: '출처표시·상업적 이용금지·변경금지', licenseUrl: 'https://www.kogl.or.kr/info/licenseType4.do',
      }),
      plaza: referencePhoto('science-plaza-reference', 'science-plaza.jpg', SCIENCE_SOURCE, '인문360', {
        publishedAt: '2019-01-30', historical: true, attribution: '한국문화예술교육진흥원 인문360 · 원본 사진',
        licenseLabel: '출처표시·상업적 이용금지·변경금지', licenseUrl: 'https://www.kogl.or.kr/info/licenseType4.do',
      }),
    },
    checkpoints: [
      { id: 'campus', number: '01', title: '과학관 전체 전경', short: '전체 전경',
        question: '낮은 전시관과 중앙 아치, 오른쪽의 흰 천체관 돔을 살펴보세요.',
        hint: '2019년 게시된 공식 소개의 전경 사진입니다. 촬영일은 공개되지 않았으며, 가까운 입구 사진은 아닙니다.',
        next: '방문할 전시관의 출입구와 현재 운영 안내를 확인하기', features: ['중앙 아치', '천체관 돔', '전시관 배치'] },
      { id: 'plaza', number: '02', title: '중앙광장과 건물 배치', short: '중앙광장',
        question: '중앙광장과 아치 아래 공간이 어떻게 이어지는지 살펴보세요.',
        hint: '행사 천막이 보이는 과거 항공 사진입니다. 천막은 상설 시설이 아니며 현재 동선을 나타내지 않습니다.',
        next: '광장 진입부의 단차와 전시관 문 앞까지의 연결을 가까운 사진으로 확인하기' },
    ],
  },
  {
    id: 'dongchundang', name: '동춘당', shortName: '동춘당', district: '대덕구', category: '역사',
    description: '기와지붕 아래 작은 별당과 돌담 안 마당을 살펴보세요.',
    referenceOnly: true, thumbnail: '/modu50m/place-reference-v6/dongchundang-courtyard.jpg',
    coverage: '대덕구 공식 외관 사진 2장 · 촬영일과 현장 접근성은 미확인',
    photos: {
      facade: referencePhoto('dongchundang-facade-reference', 'dongchundang-front.jpg', DONGCHUNDANG_SOURCE, '대덕구 문화관광', { attribution: '대전광역시 대덕구 · 원본 사진' }),
      courtyard: referencePhoto('dongchundang-courtyard-reference', 'dongchundang-courtyard.jpg', DONGCHUNDANG_SOURCE, '대덕구 문화관광', { attribution: '대전광역시 대덕구 · 원본 사진' }),
    },
    checkpoints: [
      { id: 'facade', number: '01', title: '별당 정면', short: '별당 정면',
        question: '기와지붕과 목조 기둥, 마루 높이와 기단을 살펴보세요.',
        hint: '대덕구 공식 소개 사진입니다. 촬영일과 현재 내부 관람 범위는 확인되지 않았습니다.',
        next: '마당에서 마루까지의 높이와 관람 가능한 범위를 확인하기', features: ['기와지붕', '목조 마루', '기단'] },
      { id: 'courtyard', number: '02', title: '마당과 돌담', short: '마당',
        question: '마당의 바닥과 별당 주변 돌담, 기단의 높이를 살펴보세요.',
        hint: '대덕구 공식 마당 전경입니다. 공원 입구부터 이 마당까지 이어지는 경로는 사진에 보이지 않습니다.',
        next: '공원 진입부와 마당 포장 상태, 관람 동선을 확인하기' },
    ],
  },
];

NEW_CITY_PLACES.push(...CITY_EXPANSION_PLACES);
const DISTRICTS = { hanbit: '유성구', arts: '서구', museum: '서구' };
export const PREVIEW_CITY_PLACES = [
  ...PREVIEW_PRECINCTS.map(place => ({ ...place, district: DISTRICTS[place.id], referenceOnly: false })),
  ...NEW_CITY_PLACES,
  ...EXPANSION_V18_PLACES,
];
export const getCityPlace = id => PREVIEW_CITY_PLACES.find(place => place.id === id) || getPreviewPrecinct('arts');

export const NEXT_CITY_CANDIDATES = [];

export const photoCaption = photo => photo.captureDate
  ? `${photo.captureDate.replaceAll('-', '.')} 촬영${photo.historical ? ' · 과거 자료' : ''}`
  : photo.sourcePeriodLabel || `촬영일 미확인${(photo.publishedAt || photo.sourcePublishedAt) ? ` · ${(photo.publishedAt || photo.sourcePublishedAt).replaceAll('-', '.')} 게시` : ''}`;
