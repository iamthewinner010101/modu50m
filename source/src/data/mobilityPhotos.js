import additionsV19 from './mobilityPhotosV19.json' with { type: 'json' };
import supplementsV20 from './mobilityPhotosV20.json' with { type: 'json' };
import supplementsV21 from './mobilityPhotosV21.json' with { type: 'json' };
import supplementsV23 from './mobilityPhotosV23.json' with { type: 'json' };
import supplementsV30 from './mobilityPhotosV30.json' with { type: 'json' };
import supplementsV31 from './mobilityPhotosV31.json' with { type: 'json' };
import supplementsV32 from './mobilityPhotosV32.json' with { type: 'json' };
import supplementsV43 from './mobilityPhotosV43.json' with { type: 'json' };

const additions = [...additionsV19, ...supplementsV20, ...supplementsV21, ...supplementsV23, ...supplementsV30, ...supplementsV31, ...supplementsV32, ...supplementsV43].reduce((entries, extra) => {
  const index = entries.findIndex(item => item.placeId === extra.placeId);
  if (index < 0) return [...entries, { ...extra, photos: extra.photos || [], existingPhotos: extra.existingPhotos || [] }];
  const current = entries[index];
  entries[index] = { ...current, photos: [...(current.photos || []), ...(extra.photos || [])],
    existingPhotos: [...(current.existingPhotos || []), ...(extra.existingPhotos || [])],
    missingShots: extra.missingShots || current.missingShots, note: extra.note || current.note };
  return entries;
}, []);

// Keep the existing photo IDs and record bindings. Newly reviewed photographs
// are separate scenes; their camera metadata never becomes a model pin or route.
export function withMobilityPhotos(place) {
  const entry = additions.find(item => item.placeId === place.id);
  if (!entry?.photos.length && !entry?.existingPhotos?.length) return place;
  const photos = { ...place.photos };
  const checkpoints = [...place.checkpoints];
  const mobilityReviews = { ...place.mobilityReviews };
  for (const item of entry.existingPhotos || []) {
    if (!photos[item.pointId] || photos[item.pointId].id !== item.photo.id || photos[item.pointId].image !== item.photo.image) throw new Error(`Existing photo identity changed: ${place.id}/${item.pointId}`);
    photos[item.pointId] = { ...photos[item.pointId], sourceSha256: item.photo.sourceSha256, mobilityEvidence: true };
    mobilityReviews[item.pointId] = item.review;
  }
  for (const item of entry.photos) {
    if (photos[item.pointId]) throw new Error(`Duplicate photo checkpoint: ${place.id}/${item.pointId}`);
    photos[item.pointId] = item.photo;
    checkpoints.push({
      id: item.pointId, number: String(checkpoints.length + 1).padStart(2, '0'),
      title: item.review.title, short: item.shortTitle || item.review.title,
      question: item.review.question, hint: item.photo.scope,
      next: item.review.unknowns[0], mobilityPhoto: true,
    });
    mobilityReviews[item.pointId] = item.review;
  }
  return { ...place, referenceOnly: false, originalReferenceOnly: place.referenceOnly,
    photos, checkpoints, mobilityReviews, missingShots: entry.missingShots || place.missingShots, mobilitySourceNote: entry.note || null };
}

export const MOBILITY_ADDITIONS = additions;
