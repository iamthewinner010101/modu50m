import {
  ArrowLeft,
  ArrowUpRight,
  Camera,
  CaretDown,
  CheckCircle,
  Clock,
  Info,
  LinkSimple,
  MagnifyingGlass,
  MapPin,
  MapTrifold,
  WarningCircle,
} from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import daejeonCandidateRegionBridge from '../data/daejeonCandidateRegionBridge.generated.json';
import daejeonPlaceCandidates from '../data/daejeonPlaceCandidates.generated.json';
import daejeonRoadviewAudit from '../data/daejeonRoadviewAudit.generated.json';
import { getAstraDaejeonAcquisitionPriority } from '../data/astraDaejeonAcquisitionPriorities.js';
import {
  createDaejeonReviewQueueData,
  DAEJEON_REVIEW_QUEUE_STATUS,
  DAEJEON_REVIEW_QUEUE_STATUS_OPTIONS,
  filterDaejeonReviewQueue,
  getPreferredDaejeonReviewQueueItem,
  toDaejeonCitizenReviewCandidate,
} from '../utils/daejeonReviewQueueAdapter.js';
import './DaejeonReviewQueue.css';

const DEFAULT_FILTERS = Object.freeze({
  district: 'all',
  dong: 'all',
  category: 'all',
  status: DAEJEON_REVIEW_QUEUE_STATUS.ALL,
  query: '',
});

function formatCount(value) {
  return new Intl.NumberFormat('ko-KR').format(Number(value) || 0);
}

function formatCoordinate(item) {
  if (!item.coordinate.valid) return '대전 좌표 범위 밖';
  return `${item.coordinate.lat.toFixed(5)}, ${item.coordinate.lng.toFixed(5)}`;
}

function formatCaptureTime(item) {
  if (!item.photo.captureTime) return '촬영 시점 확인 전';
  return item.photo.captureTimePrecision === 'month_observed_in_browser_receipt'
    ? `${item.photo.captureTime} · 관찰 월`
    : item.photo.captureTime;
}

function formatDongs(item) {
  if (!item.administrativeDongs.length) return '행정동 연결 대기';
  const names = item.administrativeDongs.map((dong) => dong.name).filter(Boolean);
  if (names.length <= 2) return names.join(' · ');
  return `${names.slice(0, 2).join(' · ')} 외 ${names.length - 2}곳`;
}

function statusCount(summary, status) {
  if (status === DAEJEON_REVIEW_QUEUE_STATUS.ALL) return summary.sourceRows;
  if (status === DAEJEON_REVIEW_QUEUE_STATUS.ONE_FRAME_READY) return summary.oneFrameReadyCount;
  if (status === DAEJEON_REVIEW_QUEUE_STATUS.PLACE_MATCH_ONLY) return summary.placeMatchOnlyCount;
  if (status === DAEJEON_REVIEW_QUEUE_STATUS.ROADVIEW_CAPTURE_REQUIRED) {
    return summary.roadviewCaptureRequiredCount;
  }
  if (status === DAEJEON_REVIEW_QUEUE_STATUS.SOURCE_EXCLUDED) return summary.sourceExcludedCount;
  if (status === DAEJEON_REVIEW_QUEUE_STATUS.LOCATION_CONFIRMATION_NEEDED) {
    return summary.locationConfirmationNeededCount;
  }
  if (status === DAEJEON_REVIEW_QUEUE_STATUS.PLACE_MATCH_VERIFIED) return summary.placeMatchVerifiedCount;
  if (status === DAEJEON_REVIEW_QUEUE_STATUS.ACCESSIBILITY_VERIFIED) {
    return summary.accessibilityVerifiedCount;
  }
  return 0;
}

function getStatusOption(status) {
  return DAEJEON_REVIEW_QUEUE_STATUS_OPTIONS.find((option) => option.value === status)
    ?? DAEJEON_REVIEW_QUEUE_STATUS_OPTIONS[0];
}

function getContext(item, action) {
  return {
    action,
    item,
    candidate: item.candidate,
    citizenReviewCandidate: toDaejeonCitizenReviewCandidate(item),
    evidenceBoundary: item.evidenceBoundary,
  };
}

function SelectField({ label, value, options, onChange, testId }) {
  return (
    <label className="daejeon-review-queue__select-field">
      <span>{label}</span>
      <span className="daejeon-review-queue__select-wrap">
        <select value={value} onChange={(event) => onChange(event.target.value)} data-testid={testId}>
          {options.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label} · {formatCount(option.count)}
            </option>
          ))}
        </select>
        <CaretDown size={16} weight="bold" aria-hidden="true" />
      </span>
    </label>
  );
}

function EvidencePill({ tone = 'neutral', children }) {
  return <span className={`daejeon-review-queue__evidence-pill ${tone}`}>{children}</span>;
}

/**
 * 대전 공식 후보를 시민 사진 검수 또는 로드뷰 자료 준비 큐로 보여 줍니다.
 *
 * Props contract:
 * - queueData: createDaejeonReviewQueueData() 결과를 주입할 수 있습니다.
 * - candidates / roadviewAudit / regionBridge: queueData가 없을 때 실제 생성 JSON을 대체합니다.
 * - onSelectCandidate(item, context): 선택된 item과 CitizenReviewWorkbench에 전달할 후보를 받습니다.
 * - onOpenPhotoReview(item, context): 기존 캡처가 있는 행의 사진 검수를 엽니다.
 * - onPrepareRoadview(item, context): 캡처가 없는 행의 자료 준비 화면을 엽니다.
 */
export default function DaejeonReviewQueue({
  queueData: queueDataProp,
  candidates: candidatesProp,
  roadviewAudit: roadviewAuditProp,
  regionBridge: regionBridgeProp,
  initialCandidateId,
  onSelectCandidate,
  onOpenPhotoReview,
  onPrepareRoadview,
  onBack,
  onOpenDetailedCoverage,
  className = '',
}) {
  const generatedQueueData = useMemo(
    () => createDaejeonReviewQueueData(candidatesProp ?? daejeonPlaceCandidates, {
      roadviewAuditInput: roadviewAuditProp ?? daejeonRoadviewAudit,
      regionBridgeInput: regionBridgeProp ?? daejeonCandidateRegionBridge,
    }),
    [candidatesProp, regionBridgeProp, roadviewAuditProp],
  );
  const queueData = queueDataProp ?? generatedQueueData;
  const sortedItems = useMemo(
    () => [...(queueData.items ?? [])].sort((left, right) => (
      Number(right.photo.available) - Number(left.photo.available)
      || (getAstraDaejeonAcquisitionPriority(left.id)?.rank ?? Number.MAX_SAFE_INTEGER)
        - (getAstraDaejeonAcquisitionPriority(right.id)?.rank ?? Number.MAX_SAFE_INTEGER)
      || Number(right.coordinate.valid) - Number(left.coordinate.valid)
      || left.name.localeCompare(right.name, 'ko')
    )),
    [queueData.items],
  );
  const preferredItem = useMemo(
    () => (initialCandidateId
      ? sortedItems.find((item) => item.id === initialCandidateId)
      : null) ?? getPreferredDaejeonReviewQueueItem(sortedItems),
    [initialCandidateId, sortedItems],
  );
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState(() => preferredItem?.id ?? '');
  const [actionNotice, setActionNotice] = useState('');
  const [failedImageId, setFailedImageId] = useState('');

  const filteredItems = useMemo(
    () => filterDaejeonReviewQueue(sortedItems, filters),
    [filters, sortedItems],
  );
  const selectedItem = filteredItems.find((item) => item.id === selectedId)
    ?? filteredItems[0]
    ?? null;

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
    setActionNotice('');
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setActionNotice('');
  }

  function emitSelection(item, action = 'select') {
    setSelectedId(item.id);
    setActionNotice('');
    onSelectCandidate?.(item, getContext(item, action));
  }

  function handlePrimaryAction(item) {
    setSelectedId(item.id);
    if (item.canOpenPhotoReview) {
      const context = getContext(item, 'open_photo_review');
      setActionNotice('세 곳의 확인 가이드가 준비되어 사진 검수를 열 수 있습니다.');
      if (onOpenPhotoReview) onOpenPhotoReview(item, context);
      else onSelectCandidate?.(item, context);
      return;
    }
    if (item.canOpenPlaceMatchQuestion) {
      const context = getContext(item, 'open_place_match_question');
      setActionNotice('동광공원은 장소·입구 일치 질문만 열립니다. 접근성 3문항은 가이드가 없어 잠겨 있습니다.');
      if (onOpenPhotoReview) onOpenPhotoReview(item, context);
      else onSelectCandidate?.(item, context);
      return;
    }
    const context = getContext(item, 'prepare_roadview');
    setActionNotice(item.coordinate.valid
      ? '정면·좌·우 장면을 비교한 뒤, 장소 식별·실제 입구·보행 연결이 함께 보이는 사진만 대표 후보로 고릅니다. 지금은 저장 이미지가 없어 준비 대기입니다.'
      : '이 행은 대전 좌표 범위 밖이라 먼저 좌표를 확인해야 합니다.');
    onPrepareRoadview?.(item, context);
    if (!onPrepareRoadview) onSelectCandidate?.(item, context);
  }

  const summary = queueData.summary ?? {};
  const selectedStatusOption = selectedItem ? getStatusOption(selectedItem.reviewStatus) : null;

  return (
    <main
      className={`daejeon-review-queue ${className}`.trim()}
      data-testid="daejeon-review-queue"
      data-source-rows={summary.sourceRows ?? 0}
      data-plottable-count={summary.plottableCandidateCount ?? 0}
      data-photo-count={summary.photoAvailableCount ?? 0}
      data-selected-id={selectedItem?.id ?? ''}
    >
      <header className="daejeon-review-queue__topbar">
        <div className="daejeon-review-queue__brand-lockup" aria-label="모두의 50m 대전 검수 대기">
          <strong>모두의 50m</strong>
          <span aria-hidden="true" />
          <b>대전 검수 대기</b>
          <span aria-hidden="true" />
          <b>확인해야 할 곳</b>
        </div>
        <div className="daejeon-review-queue__topbar-meta">
          {onBack ? (
            <button type="button" className="daejeon-review-queue__topbar-button" onClick={onBack}>
              <ArrowLeft size={17} weight="bold" aria-hidden="true" /> 시민 검수 예시
            </button>
          ) : null}
          {onOpenDetailedCoverage ? (
            <button type="button" className="daejeon-review-queue__topbar-button" onClick={onOpenDetailedCoverage}>
              <MapTrifold size={17} weight="bold" aria-hidden="true" /> 82개 행정동 목록·관계도
            </button>
          ) : null}
          <Clock size={20} weight="bold" aria-hidden="true" />
          <strong>대전 후보 원천</strong>
          <b>{formatCount(summary.sourceRows)}행</b>
          <span className="daejeon-review-queue__topbar-stage" aria-label="조사 단계">원천 → 사진 준비 → 장소 확인 → 접근성 판단</span>
        </div>
      </header>

      <section className="daejeon-review-queue__intro" aria-labelledby="daejeon-review-queue-title">
        <div>
          <p className="daejeon-review-queue__eyebrow">길 안내가 끝난 뒤 · 목적지 앞 마지막 30~50m</p>
          <h1 id="daejeon-review-queue-title">대전에서 먼저 확인해야 할 곳</h1>
          <p className="daejeon-review-queue__intro-copy">
            지도는 목적지까지 안내하지만 실제 출입구·턱·접근로 정보는 충분하지 않습니다.
            모두의 50m는 공식 후보를 모으고, 여러 로드뷰 중 실제 입구와 이어지는 길이 잘 보이는 사진을 고른 뒤 사람이 최종 판단합니다.
          </p>
          <a className="daejeon-review-queue__intro-jump" href="#daejeon-review-queue-list-title">첫 확인 사례 보기</a>
        </div>
        <div className="daejeon-review-queue__intro-boundary">
          <Info size={20} weight="bold" aria-hidden="true" />
          <div>
            <strong>수집 범위와 검증 범위를 나눠 표시해요</strong>
            <span>
              주소 관계상 행정동 {formatCount(summary.administrativeDongCoverageCount)}/{formatCount(summary.expectedAdministrativeDongCount)}
              · 단일 행정동 후보가 있는 동 {formatCount(summary.administrativeDongExactCandidateCoverageCount)}/{formatCount(summary.expectedAdministrativeDongCount)}
              · 법정동 주소 연결 {formatCount(summary.legalDongCoverageCount)}/{formatCount(summary.expectedLegalDongCount)}
            </span>
          </div>
        </div>
      </section>

      <section className="daejeon-review-queue__metric-grid" aria-label="대전 후보 실제 카운트">
        <article className="is-blue">
          <span>공식 후보 원천행</span>
          <strong>{formatCount(summary.sourceRows)}</strong>
          <small>공원 {formatCount(summary.sourceCategoryCounts?.park)} · 충전기 {formatCount(summary.sourceCategoryCounts?.wheelchair_charger)} · 도서관 {formatCount(summary.sourceCategoryCounts?.library)}</small>
        </article>
        <article className="is-green">
          <span>대전 범위 표시 가능</span>
          <strong>{formatCount(summary.plottableCandidateCount)}</strong>
          <small>유효 고유 좌표 {formatCount(summary.validUniqueCoordinateCount)} · 제외 {formatCount(summary.coordinateExcludedCount)}</small>
        </article>
        <article className="is-photo">
          <span>저장 로드뷰 캡처</span>
          <strong>{formatCount(summary.photoAvailableCount)}</strong>
          <small>장소 일치 미확인 · 대표 이미지 보류</small>
        </article>
        <article className="is-amber">
          <span>현재 검수 미완료</span>
          <strong>{formatCount(summary.plottableCandidateCount)}</strong>
          <small>캡처 준비 {formatCount(summary.roadviewMaterialNeededCount)} · 장소 확인 {formatCount(summary.locationConfirmationNeededCount)}</small>
        </article>
        <article className="is-muted">
          <span>검증 완료</span>
          <strong>장소 {formatCount(summary.placeMatchVerifiedCount)} · 접근성 {formatCount(summary.accessibilityVerifiedCount)}</strong>
          <small>태윤 직접 {formatCount(summary.studentReviewedCount)} · 독립 {formatCount(summary.independentReviewedCount)} · 현장 {formatCount(summary.fieldConfirmedCount)}</small>
        </article>
      </section>

      <section className="daejeon-review-queue__filters" aria-label="대전 후보 필터">
        <div className="daejeon-review-queue__filter-heading">
          <div>
            <span>검수 대기 큐</span>
            <strong>현재 {formatCount(filteredItems.length)}행 표시</strong>
            <small>원천행 {formatCount(summary.sourceRows)} · 실제 검수 대상 {formatCount(summary.plottableCandidateCount)} · 제외 {formatCount(summary.coordinateExcludedCount)}</small>
          </div>
          <button type="button" className="daejeon-review-queue__reset" onClick={resetFilters}>
            필터 초기화
          </button>
        </div>
        <div className="daejeon-review-queue__filter-row">
          <label className="daejeon-review-queue__search-field">
            <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
            <span className="sr-only">후보 검색</span>
            <input
              type="search"
              value={filters.query}
              onChange={(event) => updateFilter('query', event.target.value)}
              placeholder="장소명·주소·동·원천 행 검색"
              data-testid="daejeon-review-queue-search"
            />
          </label>
          <SelectField label="구" value={filters.district} options={queueData.filters?.districts ?? []} onChange={(value) => updateFilter('district', value)} testId="daejeon-review-queue-district" />
          <SelectField label="동" value={filters.dong} options={queueData.filters?.dongs ?? []} onChange={(value) => updateFilter('dong', value)} testId="daejeon-review-queue-dong" />
          <SelectField label="유형" value={filters.category} options={queueData.filters?.categories ?? []} onChange={(value) => updateFilter('category', value)} testId="daejeon-review-queue-category" />
        </div>
        <div className="daejeon-review-queue__status-filter" role="group" aria-label="상태 필터">
          <span><MapTrifold size={16} weight="bold" aria-hidden="true" /> 상태</span>
          {DAEJEON_REVIEW_QUEUE_STATUS_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.value}
              className={filters.status === option.value ? 'active' : ''}
              onClick={() => updateFilter('status', option.value)}
              title={option.description}
            >
              {option.label}<b>{formatCount(statusCount(summary, option.value))}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="daejeon-review-queue__workspace">
        <section className="daejeon-review-queue__list-panel" aria-labelledby="daejeon-review-queue-list-title">
          <header>
            <div>
              <span>후보 목록</span>
              <h2 id="daejeon-review-queue-list-title">지금 확인할 순서</h2>
            </div>
            <span className="daejeon-review-queue__list-count">{formatCount(filteredItems.length)} / {formatCount(summary.sourceRows)}</span>
          </header>
          <div className="daejeon-review-queue__list-scroll">
            {filteredItems.length ? filteredItems.map((item, index) => (
              <article
                className={`daejeon-review-queue__item ${selectedItem?.id === item.id ? 'selected' : ''}`}
                key={item.id}
                data-review-status={item.reviewStatus}
                data-candidate-id={item.id}
                data-acquisition-priority={getAstraDaejeonAcquisitionPriority(item.id)?.rank ?? undefined}
              >
                <button type="button" className="daejeon-review-queue__item-select" onClick={() => emitSelection(item)}>
                  <span className="daejeon-review-queue__item-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="daejeon-review-queue__item-copy">
                    <small>
                      {item.district} · {item.categoryLabel}
                      {getAstraDaejeonAcquisitionPriority(item.id)
                        ? ` · 첫 확보 ${String(getAstraDaejeonAcquisitionPriority(item.id).rank).padStart(2, '0')}`
                        : ''}
                    </small>
                    <strong>{item.name}</strong>
                    <em>{item.address || '주소 확인 필요'}</em>
                    <span className="daejeon-review-queue__item-dong"><MapPin size={13} weight="bold" aria-hidden="true" /> {formatDongs(item)}</span>
                  </span>
                </button>
                <div className="daejeon-review-queue__item-side">
                  <EvidencePill tone={item.canOpenPhotoReview ? 'blue' : item.canOpenPlaceMatchQuestion ? 'purple' : item.coordinate.valid ? 'amber' : 'gray'}>
                    {item.statusMeta.reviewLabel}
                  </EvidencePill>
                  {item.location.confirmationNeeded ? <EvidencePill tone="purple">위치 확인 필요</EvidencePill> : null}
                  <button type="button" className="daejeon-review-queue__item-action" onClick={() => handlePrimaryAction(item)}>
                    {item.canOpenPhotoReview ? '한 장 검수' : item.canOpenPlaceMatchQuestion ? '장소 질문' : item.coordinate.valid ? '준비 기준' : '좌표 확인'}
                    <ArrowUpRight size={15} weight="bold" aria-hidden="true" />
                  </button>
                </div>
              </article>
            )) : (
              <div className="daejeon-review-queue__empty-list">
                <WarningCircle size={28} weight="bold" aria-hidden="true" />
                <strong>조건에 맞는 후보가 없습니다.</strong>
                <span>구·동·유형·상태 필터를 바꿔 보세요.</span>
              </div>
            )}
          </div>
        </section>

        <aside className="daejeon-review-queue__detail-panel" aria-label="선택한 대전 후보">
          {selectedItem ? (
            <>
              <header>
                <div>
                  <span>선택한 후보</span>
                  <h2>{selectedItem.name}</h2>
                  <p>{selectedItem.district} · {selectedItem.categoryLabel}</p>
                </div>
                <EvidencePill tone={selectedItem.canOpenPhotoReview ? 'blue' : selectedItem.canOpenPlaceMatchQuestion ? 'purple' : selectedItem.coordinate.valid ? 'amber' : 'gray'}>
                  {selectedStatusOption?.label}
                </EvidencePill>
              </header>

              {actionNotice ? <p className="daejeon-review-queue__action-notice" aria-live="polite">{actionNotice}</p> : null}

              <div className="daejeon-review-queue__detail-facts">
                <div><span>행정동</span><strong>{formatDongs(selectedItem)}</strong></div>
                <div><span>공식 원천 행</span><strong>{selectedItem.sourceRecordId || '확인 필요'}</strong></div>
                <div><span>좌표</span><strong>{formatCoordinate(selectedItem)}</strong></div>
                <div><span>기준일</span><strong>{selectedItem.basisDate || '기준일 확인 필요'}</strong></div>
              </div>

              <div className="daejeon-review-queue__detail-photo">
                <div className="daejeon-review-queue__detail-section-title">
                  <span><Camera size={17} weight="bold" aria-hidden="true" /> 검수 자료</span>
                  {selectedItem.photo.available ? <EvidencePill tone="blue">사진 1장</EvidencePill> : null}
                </div>
                {selectedItem.photo.available && failedImageId !== selectedItem.id ? (
                  <figure>
                    <img
                      src={selectedItem.photo.imagePath}
                      alt={`${selectedItem.name} 기존 로드뷰 캡처`}
                      onError={() => setFailedImageId(selectedItem.id)}
                    />
                    <figcaption>
                      <strong>기존 브라우저 캡처</strong>
                      <span>{formatCaptureTime(selectedItem)} · 해시 연결됨</span>
                    </figcaption>
                  </figure>
                ) : (
                  <div className="daejeon-review-queue__detail-photo-empty">
                    <MapTrifold size={30} weight="bold" aria-hidden="true" />
                    <strong>{selectedItem.photo.available ? '기존 캡처를 불러오지 못했어요.' : '로드뷰 자료 준비 필요'}</strong>
                    <span>
                      {selectedItem.photo.available
                        ? '파일 경로를 다시 확인해 주세요. 새 이미지를 만들어 채우지 않습니다.'
                        : '이 후보에는 검증된 로컬 캡처가 없습니다. 빈 사진을 만들지 않습니다.'}
                    </span>
                  </div>
                )}
              </div>

              <div className="daejeon-review-queue__image-selection">
                <div className="daejeon-review-queue__detail-section-title">
                  <span><Camera size={17} weight="bold" aria-hidden="true" /> 대표 이미지 선정</span>
                  <EvidencePill tone={selectedItem.photo.available ? 'purple' : 'amber'}>
                    {selectedItem.photo.available ? '선정 보류' : '입력 이미지 없음'}
                  </EvidencePill>
                </div>
                <strong>
                  {selectedItem.photo.available
                    ? '이 사진은 장소 대조용이며 접근성 대표 사진으로는 확정하지 않았습니다.'
                    : '여러 방향을 비교하기 전에는 대표 사진을 정하지 않습니다.'}
                </strong>
                <p>
                  {selectedItem.photo.available
                    ? '공원 이름·실제 진입구·바깥 보행로 연결이 한 장에 보이는 다음 사진이 필요합니다.'
                    : '장소 식별 단서, 실제 입구와 바닥, 보도에서 입구까지 이어지는 길이 함께 보이는 장면을 우선합니다.'}
                </p>
                <div className="daejeon-review-queue__selection-gates" aria-label="대표 이미지 선정 기준">
                  <span>1 장소 식별</span><span>2 실제 입구</span><span>3 보행 연결</span>
                </div>
              </div>

              <div className="daejeon-review-queue__detail-boundary">
                <div className="daejeon-review-queue__detail-section-title">
                  <span><Info size={17} weight="bold" aria-hidden="true" /> 확인 상태</span>
                  <small>자동 승격 없음</small>
                </div>
                <div className="daejeon-review-queue__boundary-grid">
                  <span className={selectedItem.location.placeMatchVerified ? 'verified' : ''}>
                    장소·입구<strong>{selectedItem.location.placeMatchVerified ? '검증 완료' : '확인 전'}</strong>
                  </span>
                  <span className={selectedItem.location.accessibilityVerified ? 'verified' : ''}>
                    접근성<strong>{selectedItem.location.accessibilityVerified ? '검증 완료' : selectedItem.accessibilityQuestionsEnabled ? '확인 전' : '3문항 잠금'}</strong>
                  </span>
                  <span className={selectedItem.humanEvidence.studentReviewed ? 'verified' : ''}>
                    태윤 직접<strong>{selectedItem.humanEvidence.studentReviewed ? '기록 있음' : '기록 없음'}</strong>
                  </span>
                  <span className={selectedItem.humanEvidence.independentReviewed ? 'verified' : ''}>
                    독립 검수<strong>{selectedItem.humanEvidence.independentReviewed ? '기록 있음' : '기록 없음'}</strong>
                  </span>
                  <span className={selectedItem.humanEvidence.fieldConfirmed ? 'verified' : ''}>
                    현장 확인<strong>{selectedItem.humanEvidence.fieldConfirmed ? '기록 있음' : '기록 없음'}</strong>
                  </span>
                </div>
                <p>
                  장소·입구 일치 질문은 {selectedItem.photo.available ? '활성화' : '자료 준비 후 활성화'}이고,
                  접근성 3문항은 {selectedItem.accessibilityQuestionsEnabled ? '활성화' : '가이드 필요로 잠금'}입니다. {selectedItem.evidenceBoundary.note}
                </p>
              </div>

              <div className="daejeon-review-queue__detail-links">
                <div className="daejeon-review-queue__detail-section-title">
                  <span><LinkSimple size={17} weight="bold" aria-hidden="true" /> 공식 좌표 링크</span>
                  <small>읽기 전용 대상</small>
                </div>
                {selectedItem.links ? (
                  <div className="daejeon-review-queue__link-row">
                    <a href={selectedItem.links.kakaoMap} target="_blank" rel="noreferrer">카카오 지도 <ArrowUpRight size={14} weight="bold" aria-hidden="true" /></a>
                    <a href={selectedItem.links.kakaoRoadview} target="_blank" rel="noreferrer">카카오 로드뷰 <ArrowUpRight size={14} weight="bold" aria-hidden="true" /></a>
                  </div>
                ) : <p>좌표 범위 밖이라 공식 링크를 만들지 않았습니다.</p>}
                <small>링크를 여는 것은 장소·입구 일치나 접근성 검증을 완료했다는 뜻이 아닙니다.</small>
              </div>

              <div className="daejeon-review-queue__detail-actions">
                <button type="button" className="secondary" onClick={() => emitSelection(selectedItem)}>
                  항목 선택
                </button>
                <button type="button" className="primary" onClick={() => handlePrimaryAction(selectedItem)}>
                  {selectedItem.canOpenPhotoReview
                    ? '사진 한 장 검수 열기'
                    : selectedItem.canOpenPlaceMatchQuestion
                      ? '장소·입구 일치 질문 열기'
                      : selectedItem.coordinate.valid ? '로드뷰 준비 기준 보기' : '좌표 확인 필요'}
                  <ArrowUpRight size={17} weight="bold" aria-hidden="true" />
                </button>
              </div>
            </>
          ) : (
            <div className="daejeon-review-queue__detail-empty">
              <CheckCircle size={36} weight="bold" aria-hidden="true" />
              <strong>선택한 후보가 없습니다.</strong>
              <span>필터를 바꾸거나 후보를 선택해 주세요.</span>
            </div>
          )}
        </aside>
      </section>

      <footer className="daejeon-review-queue__footer">
        <Info size={22} weight="bold" aria-hidden="true" />
        <span>
          시민 기록은 시민 관찰 기록으로만 남습니다. 태윤 직접 증거·정본 접근성 판정·현장 확인으로 자동 승격하지 않아요.
          현재 장소 일치 {formatCount(summary.placeMatchVerifiedCount)}건 · 접근성 {formatCount(summary.accessibilityVerifiedCount)}건 · 태윤 직접 {formatCount(summary.studentReviewedCount)}건입니다.
        </span>
      </footer>
    </main>
  );
}
