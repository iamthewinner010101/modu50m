import { useMemo, useState } from 'react';
import daejeonCandidateRegionBridge from '../data/daejeonCandidateRegionBridge.generated.json';
import daejeonPlaceCandidates from '../data/daejeonPlaceCandidates.generated.json';
import daejeonRoadviewAudit from '../data/daejeonRoadviewAudit.generated.json';
import astraRoadviewImageSelections from '../data/astraRoadviewImageSelections.js';
import {
  createDaejeonReviewQueueData,
  toDaejeonCitizenReviewCandidate,
} from '../utils/daejeonReviewQueueAdapter.js';
import CitizenReviewWorkbench from './CitizenReviewWorkbench.jsx';
import DaejeonReviewQueue from './DaejeonReviewQueue.jsx';

const DAEJEON_CITIZEN_STORAGE_KEY = 'modu50m-daejeon-citizen-place-match-reviews-v1';

function loadDaejeonCitizenReviews() {
  if (typeof window === 'undefined') return {};
  try {
    const saved = JSON.parse(window.localStorage.getItem(DAEJEON_CITIZEN_STORAGE_KEY) ?? '{}');
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  } catch {
    return {};
  }
}

export default function DaejeonReviewExperience({ onBack, onOpenDetailedCoverage }) {
  const queueData = useMemo(() => createDaejeonReviewQueueData(daejeonPlaceCandidates, {
    roadviewAuditInput: daejeonRoadviewAudit,
    regionBridgeInput: daejeonCandidateRegionBridge,
  }), []);
  const [activeItemId, setActiveItemId] = useState('');
  const [citizenReviews, setCitizenReviews] = useState(loadDaejeonCitizenReviews);
  const activeItem = queueData.items.find((item) => item.id === activeItemId) ?? null;

  function openReview(item) {
    if (!item?.canOpenPhotoReview && !item?.canOpenPlaceMatchQuestion) return;
    setActiveItemId(item.id);
  }

  function saveReview(payload) {
    const record = {
      ...payload,
      schema: 'modu50m.daejeon_citizen_review.v1',
      sourceSchema: payload.schema,
      sourceArtifactSha256: daejeonRoadviewAudit.sourceArtifactSha256 ?? '',
      sourceRecordSha256: activeItem?.candidate?.sourceRecordSha256 ?? '',
      moderationStatus: 'pending',
      canonicalPromotion: false,
    };
    setCitizenReviews((current) => {
      const next = { ...current, [record.candidateId]: record };
      window.localStorage.setItem(DAEJEON_CITIZEN_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  if (activeItem) {
    return (
      <CitizenReviewWorkbench
        key={activeItem.id}
        candidate={{
          ...toDaejeonCitizenReviewCandidate(activeItem),
          roadviewImageSelection: astraRoadviewImageSelections[activeItem.id] ?? null,
        }}
        candidateIndex={0}
        candidateCount={1}
        review={citizenReviews[activeItem.id]}
        reviewMode={activeItem.canOpenPhotoReview ? 'full' : 'place_match_only'}
        coverageLabel="대전 확인 목록"
        onOpenCoverage={() => setActiveItemId('')}
        onSave={saveReview}
        onNext={() => setActiveItemId('')}
      />
    );
  }

  return (
    <><a className="er-entry-link" href={(() => { const url = new URL(window.location.href); url.searchParams.set('mode', 'entrance-review'); url.hash = ''; return url.toString(); })()}>사진·근거 서버 검수 열기 · 1차 연결 3곳</a><DaejeonReviewQueue
      queueData={queueData}
      onBack={onBack}
      onOpenDetailedCoverage={onOpenDetailedCoverage}
      onOpenPhotoReview={openReview}
    /></>
  );
}
