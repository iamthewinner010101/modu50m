import {photoEvidenceRole} from './photoEvidenceRoles.js';
import {walkingConnection} from './arrivalRoutes.js';

export const PHOTO_READING_LABELS = {
  scene: '이 구간의 장면', landmark: '위치·방향 찾기', detail: '바닥·입구 살펴보기', surface: '바닥·입구 살펴보기', context: '주변 모습 비교',
};

// Roles describe what a photo can show; they never establish a continuous or accessible path.
export function photoReadingPurpose(photo) {
  const authored = photo?.readingPurpose;
  if (authored && PHOTO_READING_LABELS[authored.kind] && authored.cue) {
    return {...authored, label: PHOTO_READING_LABELS[authored.kind]};
  }
  const evidence = photoEvidenceRole(photo);
  if (evidence) return {kind: 'context', label: PHOTO_READING_LABELS.context, cue: evidence.detail};
  if (photo?.context) return {kind: 'context', label: PHOTO_READING_LABELS.context, cue: '주변 표지와 바닥을 앞뒤 번호의 사진과 비교해요. 사진 사이의 길이 모두 보이는 장면은 아니에요.'};
  return {kind: 'scene', label: PHOTO_READING_LABELS.scene, cue: '표지로 위치를 찾고, 보도와 차도 경계·바닥·입구를 차례로 살펴봐요.'};
}

export function nextPhotoConnection(route, index) {
  const from = route?.steps?.[index], to = route?.steps?.[index + 1];
  if (!from || !to) return null;
  return {from: index, to: index + 1, label: `${String(index + 1).padStart(2, '0')} → ${String(index + 2).padStart(2, '0')}`, title: to.title, detail: from.next?.detail, topology: walkingConnection(route, index)};
}

// A shortcut may request a different pair without changing the selected photo.
// Discard it when that photo changes; a manual pair choice wins within the request.
export function connectionReviewIndex(route, selected, request, choice) {
  const requested=request?.at===selected?request.index:selected;
  const index=choice?.at===selected&&choice?.request===request?.serial?choice.index:requested;
  return Math.max(0,Math.min((route?.steps?.length||2)-2,Number.isInteger(index)?index:0));
}
