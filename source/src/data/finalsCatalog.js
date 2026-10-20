import { PREVIEW_CITY_PLACES } from './previewCityPlaces.js';
import { CORE_CASES } from './coreNeighborhoods.js';
import { withMobilityPhotos } from './mobilityPhotos.js';
import { EXPANSION_V20_PLACES } from './previewExpansionV20.js';
import recommendedPlaces from './recommendedPlacesV30.json' with { type: 'json' };

// These are photo scenes, not verified entrances or a connected walking route.
export const COMMUNITY_PLACES = CORE_CASES.filter(item => !item.placeId).map(item => ({
  id: item.id, name: item.name, shortName: item.shortName || item.name,
  district: '서구', category: item.category, referenceOnly: false, communityCase: true,
  thumbnail: item.photo.image, coverage: item.scope,
  photos: { scene: item.photo },
  checkpoints: [{ id: 'scene', number: '01', title: item.photoTitle, question: item.question, next: item.next, hint: item.scope }],
  sceneReview: {
    image: item.photo.image,
    kind: 'context', title: item.photoTitle, question: item.question, focus: [50, 60],
    observations: item.observations.map((detail, index) => ({ label: index ? '추가로 확인할 내용' : '현재 사진에서 보이는 것', detail })),
    unknowns: [item.next], connection: item.scope,
    fieldVerified: false, continuousRouteVerified: false,
  },
}));
export const FINALS_PLACES = [...PREVIEW_CITY_PLACES, ...COMMUNITY_PLACES, ...EXPANSION_V20_PLACES, ...recommendedPlaces].map(withMobilityPhotos);
export const getFinalsPlace = id => FINALS_PLACES.find(item => item.id === id) || FINALS_PLACES[0];

export const PRESENTATION_STEPS = [
  { title: '문제', duration: '0:00–0:35', criterion: '개발 목적', cue: '가고 싶은 곳은 찾았는데, 내린 뒤 보도로 들어가 입구를 찾는 길은 어떨까요? 이 준비를 돕고 싶었다는 목적부터 말해 주세요.', view: 'story' },
  { title: '장소', duration: '0:35–1:00', criterion: '개발 목적 · 창의성', cue: '건물 미니어처로 장소를 고릅니다. 대표 10곳 중 한밭수목원을 예로 들고, 같은 장소의 정류장·갈림길·입구로 이어 가세요.', view: 'focus' },
  { title: '길과 사진', duration: '1:00–2:25', criterion: '설계와 방법론 · 구현 및 완성도', cue: '01번 정류장 → 03번 표지와 지상 길 → 05번 문 앞 바닥을 차례로 선택하세요. 모형으로 순서를, 실제 사진으로 세부를 보는 이유와 사진 출처를 설명합니다.', view: 'detail', place: 'arboretum', point: 'bus-v31-bus', anchorSelector: '.fv-media' },
  { title: '같은 위치', duration: '2:25–3:20', criterion: '창의성 · 구현 및 완성도', cue: '05번의 댓글·답글·공감을 보여 주세요. 예시 글임을 밝히고, 한 사람의 질문이 같은 위치의 다음 여행자에게 이어지는 구조를 설명합니다. 공유 댓글과 개인 기록도 구분하세요.', view: 'detail', place: 'arboretum', point: 'bus-v31-door', anchorSelector: '.rc-panel' },
  { title: '마무리', duration: '3:20–4:35', criterion: '설계와 방법론 · 발표', cue: '입구 사진을 다시 보여 주며 작품의 도움을 한 문장으로 마무리하세요. 제작 과정과 수정 전후는 포스터·작품설명서로 설명합니다. 작동 점검과 실제 이용자 확인을 구분하고 25초 여유를 남깁니다.', view: 'detail', place: 'arboretum', point: 'bus-v31-door', anchorSelector: '.fv-media' },
];
