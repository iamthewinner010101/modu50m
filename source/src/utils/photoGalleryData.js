// Known local dimensions let PhotoSwipe load the current and adjacent images lazily.
// An optional new photograph may fail independently; keep its number and source.
export async function prepareGalleryPhotos(photos, dimensions, probe) {
  return Promise.all(photos.map(async photo => {
    const known = dimensions[photo.image];
    try {
      const size = known || await probe(photo.image);
      if (!(size.width > 0 && size.height > 0)) throw new Error('Invalid dimensions');
      return {...photo, src:photo.image, alt:photo.title, ...size};
    } catch {
      return {...photo, type:'html', html:'<div class="jg-load-error" role="status">이 사진을 불러오지 못했어요. 다음 사진을 넘겨 보거나 아래 원본 출처를 확인해 주세요.</div>', width:1200, height:800, loadFailed:true};
    }
  }));
}
