// Public reference photographs are shown unchanged; miniature layouts are illustrative.
const photo = (id, file, sourceUrl, providerLabel, extra = {}) => ({
  id, image: `/modu50m/place-reference-v7/${file}`, sourceUrl, provider: 'public-reference', providerLabel,
  captureDate: null, captureDatePrecision: 'unknown', retrievedAt: '2026-09-20',
  camera: null, mapBindingVerified: false, fieldVerified: false, entranceVerified: false,
  captureMethod: 'public-source-photo-unmodified', attribution: `${providerLabel} · 원본 사진`, ...extra,
});
const place = (id, name, shortName, district, category, description, reference, title, question, hint, features) => ({
  id, name, shortName, district, category, description, referenceOnly: true,
  thumbnail: reference.image, coverage: '공개 외관 사진 · 촬영일과 현재 접근 경로는 미확인',
  photos: { facade: reference },
  checkpoints: [{ id: 'facade', number: '01', title, short: title, question, hint, features,
    next: '방문 전 현재 출입구와 보행 동선, 시설 이용 안내를 확인하기' }],
});
const PARK_SOURCE = 'https://www.daedeok.go.kr/tour/goContents.do?link=/tour/tour01/TOUR0104&menuId=TOUR0104';
export const CITY_EXPANSION_PLACES = [
  place('cityhall', '대전시청', '대전시청', '서구', '공공', '높은 청사와 낮은 기단, 앞마당을 함께 살펴보세요.',
    photo('cityhall-front-reference', 'cityhall.jpg', 'https://www.cctoday.co.kr/news/articleView.html?idxno=2208593', '충청투데이'),
    '청사 정면', '두 날개처럼 이어진 높은 청사와 중앙 유리 부분을 살펴보세요.',
    '공개 기사에 실린 청사 외관 사진입니다. 사진의 촬영일과 현재 출입구 접근 경로는 확인 전입니다.', ['청사 정면', '중앙 유리부', '앞마당']),
  place('onsen', '유성온천 족욕체험장', '유성온천', '유성구', '휴식', '나무 그늘 아래 족욕장과 산책길을 둘러보세요.',
    photo('onsen-footbath-reference', 'onsen.jpg', 'https://www.yuseong.go.kr/prog/trrsrt/TRSE_01/tour/sub02_01/view.do?trrsrtNo=15', '유성구 문화관광'),
    '족욕장과 산책길', '낮은 족욕탕과 나무 좌석, 그늘막과 보행 공간을 살펴보세요.',
    '유성구 공식 소개 사진입니다. 현재 운영 여부와 족욕탕의 높이·진입 방식은 별도 확인이 필요합니다.', ['족욕탕', '나무 좌석', '그늘막']),
  place('uam', '우암사적공원', '우암사적공원', '동구', '역사', '언덕의 기와집과 돌담 사이 길을 따라가 보세요.',
    photo('uam-park-reference', 'uam.jpg', 'https://www.donggu.go.kr/dg/tour/83/6/sights', '동구 문화관광'),
    '기와집과 돌담길', '언덕을 따라 놓인 전통 건물과 돌담, 계단과 길의 배치를 살펴보세요.',
    '동구 공식 공원 전경입니다. 넓은 구역을 한 장에 담은 사진으로 경사도나 끊김 없는 이동 경로를 확인한 자료는 아닙니다.', ['기와지붕', '돌담', '언덕 산책길']),
  place('library', '한밭도서관', '한밭도서관', '중구', '문화', '새 유리 정면과 흰 차양, 넓은 지붕 아래 도서관을 만나보세요.',
    photo('library-renovated-reference', 'library.png', 'https://www.daejeon.go.kr/drh/board/boardNormalView.do?boardId=normal_0189&menuSeq=1632&ntatcSeq=1503425570', '대전광역시', {
      publishedAt: '2025-12-02', attribution: '대전광역시 · 2025년 그린리모델링 보도자료 첨부 사진',
      sourceDocument: 'https://www.daejeon.go.kr/FileUpload/CommonBoard/normal_0189/20251203054106728.hwp',
      extraction: 'HWP BinData/BIN0002.png 원본 바이트 추출', licenseUrl: 'https://www.kogl.or.kr/info/licenseType1.do',
    }),
    '리모델링 후 정면', '넓은 돌출 지붕, 흰 차양과 푸른 유리 정면을 살펴보세요.',
    '2025년 12월 2일 대전시 보도자료의 리모델링 후 사진입니다. 게시일과 촬영일은 다르며, 별도 무단차 출입구는 이 사진으로 확인되지 않습니다.', ['새 외벽 차양', '중앙 유리부', '정면 계단']),
  place('oworld', '대전오월드', '오월드', '중구', '가족', '작은 성처럼 생긴 입구와 매표소 앞마당을 둘러보세요.',
    photo('oworld-entrance-reference', 'oworld.bmp', 'https://japanese.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=84673', '한국관광공사'),
    '오월드 입구', '중앙 아치와 파스텔색 탑, 양옆 매표소의 형태를 살펴보세요.',
    '한국관광공사 공개 입구 사진입니다. 모형은 입구 구역만 표현하며 놀이시설 전체 배치나 현재 입장 동선을 안내하지 않습니다.', ['중앙 아치', '입구 탑', '매표소']),
  {
    id: 'daecheong', name: '대청공원', shortName: '대청공원', district: '대덕구', category: '자연',
    description: '낮은 생울타리와 돌 정원, 공원 속 작은 풍경을 둘러보세요.',
    referenceOnly: true, thumbnail: '/modu50m/place-reference-v7/daecheong.jpg',
    coverage: '금강로하스대청공원 정원 사진 2장 · 촬영일과 접근 경로는 미확인',
    photos: {
      maze: photo('daecheong-hedge-reference', 'daecheong.jpg', PARK_SOURCE, '대덕구 문화관광'),
      garden: photo('daecheong-garden-reference', 'daecheong-lawn.jpg', PARK_SOURCE, '대덕구 문화관광'),
    },
    checkpoints: [
      { id: 'maze', number: '01', title: '생울타리 정원', short: '생울타리', question: '낮은 생울타리와 자갈 길이 만드는 무늬를 살펴보세요.',
        hint: '대덕구 공식 사진입니다. 모형은 공원 전체가 아닌 정원 일부를 재구성했으며 길의 폭과 현재 포장 상태는 확인 전입니다.',
        next: '정원 진입부와 자갈 길의 현재 상태를 확인하기', features: ['생울타리', '자갈 길', '나무 그늘'] },
      { id: 'garden', number: '02', title: '돌 정원과 쉼터', short: '돌 정원', question: '돌과 작은 소나무, 굽은 길과 쉼터의 모습을 살펴보세요.',
        hint: '대덕구 공식 정원 사진입니다. 주차장에서 이 정원까지 이어지는 이동 경로는 확인되지 않았습니다.',
        next: '주차장과 정원 사이의 연결, 쉼터 진입부를 확인하기' },
    ],
  },
];
