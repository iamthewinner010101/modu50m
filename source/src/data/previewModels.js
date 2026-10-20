import { EXPANSION_V18_MODELS } from './previewExpansionV18.js';
import { EXPANSION_V20_MODELS } from './previewExpansionV20.js';

// Illustration coordinates select photographs; they are not camera coordinates.
// Keep these separate from the georeferenced Roadview evidence.
export const CITY_OVERVIEW = {
  image: '/modu50m/visual-preview-v1/daejeon-city-miniature-v7.png',
  alt: '대전의 다섯 구와 대표 풍경을 산림과 하천, 작은 건물로 표현한 AI 미니어처 개념도. 행정경계와 도로·건물 위치를 단순화한 근사 모형입니다.',
  referenceUrl: 'https://www.daejeon.go.kr/drh/DrhContentsHtmlView.do?menuSeq=1716',
  placePins: { hanbit: [54, 27], arts: [48, 45], museum: [66, 44], station: [70, 64], science: [35, 25], dongchundang: [81, 33], cityhall: [49, 64], onsen: [32, 50], uam: [87, 51], library: [58, 84], oworld: [30, 82], daecheong: [68, 16] },
  districtLabels: [
    { name: '유성구', position: [29, 24] },
    { name: '대덕구', position: [74, 20] },
    { name: '서구', position: [25, 61] },
    { name: '중구', position: [57, 76] },
    { name: '동구', position: [82, 58] },
  ],
};

export const PREVIEW_MODELS = {
  ...EXPANSION_V20_MODELS,
  ...EXPANSION_V18_MODELS,
  arts: {
    image: '/modu50m/visual-preview-v1/arts-miniature-photo-informed-v2.png',
    alt: '실제 외관 사진을 참고한 예술의전당 AI 미니어처. 넓은 곡선 지붕, 원형 유리 로비, 서측 석재 벽과 주차장, 남측 광장을 표현한 근사 모형입니다.',
    photoPins: [[29, 61], [61, 57], [75, 68]],
    referenceUrl: 'https://tong.visitkorea.or.kr/cms/resource/06/607706_image2_1.jpg',
    referenceLabel: '한국관광공사 예술의전당 외관 사진',
  },
  museum: {
    image: '/modu50m/visual-preview-v1/museum-miniature-photo-informed-v3.png',
    alt: '공식 외관 사진을 참고한 대전시립미술관 AI 미니어처. 낮은 석재 건물, 위로 휘어진 지붕, 경사 벽과 앞쪽 수공간을 표현한 근사 모형입니다.',
    photoPins: [[24, 62], [59, 77], [79, 68]],
    referenceUrl: 'https://www.daejeon.go.kr/dma/dmaContentsHtmlView.do?menuSeq=6072',
    referenceLabel: '대전시립미술관 공식 시설 사진',
  },
  hanbit: {
    image: '/modu50m/visual-preview-v1/hanbit-miniature-photo-informed-v4.png',
    alt: '공식 외관과 동측 로드뷰를 참고한 한빛탑 AI 미니어처. 석재 탑신, 원형 전망대, 긴 첨탑과 주변 전시관·주차장 접근부를 표현한 근사 모형입니다.',
    photoPins: [[82, 73], [59, 79], [70, 64]],
    referenceUrl: 'https://daejeontour.co.kr/find_djt/6',
    referenceLabel: '대전관광 공식 한빛탑 외관 사진',
  },
  station: {
    image: '/modu50m/visual-preview-v1/station-miniature-v6.png',
    alt: '대전역 서광장 사진을 참고한 AI 근사 모형. 긴 유리 역사와 붉은 띠, 광장 꽃시계와 뒤쪽 두 철도기관 타워를 표현했습니다.',
    photoPins: [[48, 69]],
    referenceUrl: 'https://commons.wikimedia.org/wiki/File:Q20919_Daejeon_Station_A01.jpg',
    referenceLabel: '대전역 서광장 사진 · *Youngjin / CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
  },
  science: {
    image: '/modu50m/visual-preview-v1/science-miniature-v6.png',
    alt: '국립중앙과학관 공개 전경 사진을 참고한 AI 근사 모형. 낮은 은색 전시관, 중앙 아치와 하얀 천체관 돔을 표현했습니다.',
    photoPins: [[78, 59], [43, 59]],
    referenceUrl: 'https://inmun360.culture.go.kr/content/580.do?cid=2369845&mode=view&page=28',
    referenceLabel: '인문360 국립중앙과학관 외관 사진',
  },
  dongchundang: {
    image: '/modu50m/visual-preview-v1/dongchundang-miniature-v6.png',
    alt: '대덕구 공식 사진을 참고한 동춘당 AI 근사 모형. 기와지붕과 세 칸 목조 정면, 기단과 돌담 안 마당을 표현했습니다.',
    photoPins: [[52, 57], [31, 77]],
    referenceUrl: 'https://www.daedeok.go.kr/fet/goContents.do?link=%2Ffet%2Ffet06%2FFET0604&menuId=FET0604',
    referenceLabel: '대덕구 공식 동춘당 외관 사진',
  },
  cityhall: {
    image: '/modu50m/visual-preview-v1/cityhall-miniature-v7.png',
    alt: '대전시청 외관 사진을 참고한 AI 근사 모형. 높은 청사와 중앙 유리부, 낮은 기단과 앞마당을 표현했습니다.',
    photoPins: [[52, 66]], referenceUrl: 'https://www.cctoday.co.kr/news/articleView.html?idxno=2208593', referenceLabel: '충청투데이 대전시청 외관 사진',
  },
  onsen: {
    image: '/modu50m/visual-preview-v1/onsen-miniature-v7.png',
    alt: '유성온천 족욕체험장 공식 사진을 참고한 AI 근사 모형. 낮은 족욕탕과 나무 좌석, 그늘막과 산책길을 표현했습니다.',
    photoPins: [[64, 62]], referenceUrl: 'https://www.yuseong.go.kr/prog/trrsrt/TRSE_01/tour/sub02_01/view.do?trrsrtNo=15', referenceLabel: '유성구 공식 족욕체험장 사진',
  },
  uam: {
    image: '/modu50m/visual-preview-v1/uam-miniature-v7.png',
    alt: '우암사적공원 공식 사진을 참고한 AI 근사 모형. 언덕의 전통 건물과 돌담, 산책길을 표현했습니다.',
    photoPins: [[52, 64]], referenceUrl: 'https://www.donggu.go.kr/dg/tour/83/6/sights', referenceLabel: '동구 공식 우암사적공원 사진',
  },
  library: {
    image: '/modu50m/visual-preview-v1/library-miniature-v7.png',
    alt: '2025년 리모델링 후 공식 사진을 참고한 한밭도서관 AI 근사 모형. 푸른 유리와 흰 차양, 넓은 지붕과 계단을 표현했습니다.',
    photoPins: [[58, 65]], referenceUrl: 'https://www.daejeon.go.kr/drh/board/boardNormalView.do?boardId=normal_0189&menuSeq=1632&ntatcSeq=1503425570', referenceLabel: '대전시 한밭도서관 그린리모델링 보도자료',
  },
  oworld: {
    image: '/modu50m/visual-preview-v1/oworld-miniature-v7.png',
    alt: '한국관광공사 사진을 참고한 대전오월드 입구의 AI 근사 모형. 파스텔색 성 형태의 아치와 매표소를 표현했습니다.',
    photoPins: [[51, 68]], referenceUrl: 'https://japanese.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=84673', referenceLabel: '한국관광공사 대전오월드 입구 사진',
  },
  daecheong: {
    image: '/modu50m/visual-preview-v1/daecheong-miniature-v7.png',
    alt: '대덕구 공식 사진을 참고한 대청공원 정원 일부의 AI 근사 모형. 생울타리와 자갈 길, 돌 정원과 쉼터를 표현했습니다.',
    photoPins: [[29, 61], [74, 49]], referenceUrl: 'https://www.daedeok.go.kr/tour/goContents.do?link=/tour/tour01/TOUR0104&menuId=TOUR0104', referenceLabel: '대덕구 공식 금강로하스대청공원 사진',
  },
};
