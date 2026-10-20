export const ASTRA_DAEJEON_ACQUISITION_PRIORITIES = Object.freeze([
  Object.freeze({ id: '15012890:01711', rank: 1, reason: '기존 캡처의 대표 이미지 보류 사유를 먼저 확인' }),
  Object.freeze({ id: '15034533:00777', rank: 2, reason: '원천 설치 위치가 입구 앞으로 기록됨' }),
  Object.freeze({ id: '15034533:00678', rank: 3, reason: '원천 설치 위치가 입구 우측으로 기록됨' }),
  Object.freeze({ id: '15013109:01793', rank: 4, reason: '동구 도서관 표본' }),
  Object.freeze({ id: '15012890:13648', rank: 5, reason: '중구 공원 표본' }),
  Object.freeze({ id: '15034533:03566', rank: 6, reason: '중구 충전기 표본' }),
  Object.freeze({ id: '15013109:01511', rank: 7, reason: '중구 도서관 표본' }),
  Object.freeze({ id: '15012890:03763', rank: 8, reason: '서구 공원 표본' }),
  Object.freeze({ id: '15034533:00745', rank: 9, reason: '서구 충전기 표본' }),
  Object.freeze({ id: '15013109:03166', rank: 10, reason: '서구 도서관 표본' }),
  Object.freeze({ id: '15012890:03706', rank: 11, reason: '유성구 공원 표본' }),
  Object.freeze({ id: '15034533:00707', rank: 12, reason: '유성구 충전기 표본' }),
  Object.freeze({ id: '15013109:03025', rank: 13, reason: '유성구 도서관 표본' }),
  Object.freeze({ id: '15012890:15792', rank: 14, reason: '대덕구 공원 표본' }),
  Object.freeze({ id: '15013109:00531', rank: 15, reason: '대덕구 도서관 표본' }),
]);

const PRIORITY_BY_ID = new Map(
  ASTRA_DAEJEON_ACQUISITION_PRIORITIES.map((entry) => [entry.id, entry]),
);

export function getAstraDaejeonAcquisitionPriority(candidateId) {
  return PRIORITY_BY_ID.get(String(candidateId ?? '')) ?? null;
}
