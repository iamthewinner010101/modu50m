import { PREVIEW_MODELS } from './previewModels.js';
import { getPhotoReview } from './wheelchairPhotoReview.js';
import recommendedModels from './routeModelsV30.json' with {type:'json'};

// Scene illustrations select photos. They never supply geographic coordinates.
export const COMMUNITY_MINIATURES = {
  civic: {
    image: '/modu50m/visual-preview-v1/civic-miniature-v17.png',
    alt: '기존 후보 사진의 밝은 석재 건물, 주차 진입부와 돌담·나무를 참고한 AI 근사 모형. 실제 장소·이용 출입문은 재확인 전입니다.',
    photoPins: [[60, 76]],
    referenceLabel: '기존 수집 후보 사진 참고',
  },
  subway: {
    image: '/modu50m/visual-preview-v1/subway-miniature-v17.png',
    alt: '시청역 8번 계단 출구의 유리 차양, 출구 표지와 주변 보도를 참고한 AI 근사 모형. 승강기 위치를 나타내지 않습니다.',
    photoPins: [[45, 76]],
    referenceLabel: '8번 계단 출구 사진 참고',
  },
};

const SHORT_TITLES = { civic: { scene: '센터 방향 진입부' }, subway: { scene: '8번 계단 출구' } };
export const getPlaceMiniature = siteId => (['sungsim','arboretum'].includes(siteId) ? recommendedModels[siteId] : null) || PREVIEW_MODELS[siteId] || COMMUNITY_MINIATURES[siteId];

export function getMiniatureScenes(site) {
  const model = getPlaceMiniature(site.id);
  return site.checkpoints.map((point, index) => {
    const photo = site.photos[point.id];
    const sameAs = site.checkpoints.find(other => photo.samePositionAs === `${site.id}.${other.id}`);
    return {
      ...point, index, photo, review: getPhotoReview(site, point.id),
      shortTitle: SHORT_TITLES[site.id]?.[point.id] || point.short || point.title,
      // A zoom from the same panorama must not create another apparent location.
      sameAs: sameAs ? { id: sameAs.id, number: sameAs.number } : null,
      selector: sameAs || point.mobilityPhoto || (site.id === 'hanbit' && point.id === 'doorway') ? null : model?.photoPins?.[index],
    };
  });
}
