import actualArboretumApproach from './routePhotoAlbumsV94.json' with {type:'json'};
import skyroadParkingPhotos from './routePhotoAlbumsV77.json' with {type:'json'};
import previous from './routePhotoAlbumsV25.json' with {type:'json'};


import additions from './routePhotoAlbumsV27.json' with {type:'json'};


import journey3d from './routePhotoAlbumsV33.json' with {type:'json'};


import curated from './routePhotoAlbumsV35.json' with {type:'json'};


import naverPhotos from './routePhotoAlbumsV36.json' with {type:'json'};


import onlineSupplement from './routePhotoAlbumsV40.json' with {type:'json'};


import terminalSidewalk from './routePhotoAlbumsV41.json' with {type:'json'};


import readingSupplement from './routePhotoAlbumsV42.json' with {type:'json'};


import museumApproach from './routePhotoAlbumsV43.json' with {type:'json'};


import scienceWalkway from './routePhotoAlbumsV44.json' with {type:'json'};


import forecourtComparison from './routePhotoAlbumsV45.json' with {type:'json'};

import parkApproach from './routePhotoAlbumsV47.json' with {type:'json'};
import groundComparisons from './routePhotoAlbumsV48.json' with {type:'json'};
import curbComparison from './routePhotoAlbumsV50.json' with {type:'json'};





// Context photographs remain separate from confirmed route checkpoints.


const albums = {};


for (const source of [previous, additions, journey3d, curated, naverPhotos, onlineSupplement, terminalSidewalk, readingSupplement, museumApproach, scienceWalkway, forecourtComparison, parkApproach, groundComparisons, curbComparison, skyroadParkingPhotos, actualArboretumApproach]) {


  for (const [place, groups] of Object.entries(source)) {


    albums[place] ||= {};


    for (const [point, photos] of Object.entries(groups)) {


      albums[place][point] = [...(albums[place][point] || []), ...photos];


    }


  }


}


export default albums;


export const routeContextPhotos = (place, step) =>


  step && !step.pointId ? [...(albums[place]?.[`step:${step.id}`] || [])].sort((a,b)=>Number(Boolean(b.preferredForStep))-Number(Boolean(a.preferredForStep))) : [];


export function photoSourceDescription(photo) {


  const street = ['kakao','naver'].includes(photo.provider);


  const blog = photo.provider === 'blog' || /tistory\.com|blog\.naver\.com/.test(photo.sourceUrl || '');


  const captured = photo.capturedAt || photo.captureDate;


  const published = photo.publishedAt || photo.sourcePublishedAt || photo.publicationDate;


  return {


    kind: street ? '거리뷰 · 실제 촬영 장면' : photo.platform === 'naver-blog' ? '네이버 블로그 · 현장 사진' : blog ? '방문 후기 · 실제 현장 사진' : `${photo.providerLabel || '공개 자료'} · 현장 사진`,


    date: captured ? `촬영 ${captured}` : published ? `게시 ${published} · 촬영일 미상` : '촬영일·게시일 미상',


    link: street ? '이 위치의 거리뷰 원본 ↗' : blog ? '이 사진의 방문 후기 원문 ↗' : '이 사진의 원본 출처 ↗',


  };


}


