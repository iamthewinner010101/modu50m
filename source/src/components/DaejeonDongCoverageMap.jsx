import { useMemo, useState } from 'react';
import {
  DAEJEON_DONG_STATUS_ORDER,
  groupDaejeonDongsByDistrict,
  getStatusDefinition,
  normalizeDaejeonDongCoverage,
  normalizeDaejeonLegalDongCoverage,
  normalizeDongStatus,
  summarizeDaejeonRegionRelations,
  summarizeDaejeonDongCoverage,
} from '../utils/daejeonDongCoverage';
import './DaejeonDongCoverageMap.css';

const ALL_STATUS_FILTER = 'all';
const NOOP = () => {};

function resolveCoverageInput(coverageData, dongs) {
  if (Array.isArray(dongs)) return { dongs };
  return coverageData ?? [];
}

function getInitialFilter(value) {
  if (value === ALL_STATUS_FILTER) return ALL_STATUS_FILTER;
  return normalizeDongStatus(value) ?? ALL_STATUS_FILTER;
}

function getDisplayName(dong, unitLabel = '동') {
  return dong?.name || `${unitLabel} 이름 대기`;
}

function getLoadedCopy(summary, unitLabel) {
  if (summary.remainingCount > 0) {
    return `권위 데이터 ${summary.remainingCount}개 레코드 대기`;
  }
  if (summary.loadedCount === 0) return '권위 데이터 연결 대기';
  if (summary.stageCounts?.source_frame === summary.total) {
    return `공식 목록 확인 ${summary.stageCounts.source_frame}/${summary.total}`;
  }
  return `연결된 ${unitLabel} 전체 표시`;
}

function getEvidenceMetric(evidenceCounts, key, fallbackCount, fallbackTotal = null) {
  const supplied = evidenceCounts?.[key];
  if (typeof supplied === 'number' && Number.isFinite(supplied)) {
    return { count: Math.max(Math.trunc(supplied), 0), total: fallbackTotal };
  }
  if (supplied && typeof supplied === 'object') {
    const count = Number(supplied.count);
    const total = Number(supplied.total);
    return {
      count: Number.isFinite(count) ? Math.max(Math.trunc(count), 0) : 0,
      total: Number.isFinite(total) && total >= 0 ? Math.trunc(total) : fallbackTotal,
      note: typeof supplied.note === 'string' ? supplied.note : '',
    };
  }
  return { count: fallbackCount, total: fallbackTotal, note: '' };
}

function formatEvidenceCount(metric) {
  return metric.total === null || metric.total === undefined
    ? String(metric.count)
    : `${metric.count}/${metric.total}`;
}

export default function DaejeonDongCoverageMap({
  coverageData = null,
  legalCoverageData = null,
  candidateSourceData = null,
  dongs = null,
  expectedCount = 82,
  defaultStatus = 'needs_recheck',
  initialStatus = ALL_STATUS_FILTER,
  onSelectDong = NOOP,
  className = '',
  evidenceCounts = {},
}) {
  const normalizedAdministrativeCoverage = useMemo(
    () => normalizeDaejeonDongCoverage(
      resolveCoverageInput(coverageData, dongs),
      { expectedCount, defaultStatus },
    ),
    [coverageData, dongs, expectedCount, defaultStatus],
  );
  const normalizedLegalCoverage = useMemo(
    () => normalizeDaejeonLegalDongCoverage(legalCoverageData, { defaultStatus }),
    [legalCoverageData, defaultStatus],
  );
  const [regionLayer, setRegionLayer] = useState('administrative');
  const normalizedCoverage = regionLayer === 'legal'
    ? normalizedLegalCoverage
    : normalizedAdministrativeCoverage;
  const summary = useMemo(
    () => summarizeDaejeonDongCoverage(normalizedCoverage.dongs, normalizedCoverage.expectedCount),
    [normalizedCoverage.dongs, normalizedCoverage.expectedCount],
  );
  const [statusFilter, setStatusFilter] = useState(() => getInitialFilter(initialStatus));
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const relationSummary = useMemo(
    () => summarizeDaejeonRegionRelations(normalizedLegalCoverage.dongs),
    [normalizedLegalCoverage.dongs],
  );
  const legalDongsByAdministrativeCode = useMemo(() => {
    const mapping = new Map();
    normalizedLegalCoverage.dongs.forEach((legalDong) => {
      legalDong.administrativeDongs.forEach((administrativeDong) => {
        if (!mapping.has(administrativeDong.code)) mapping.set(administrativeDong.code, []);
        mapping.get(administrativeDong.code).push(legalDong);
      });
    });
    return mapping;
  }, [normalizedLegalCoverage.dongs]);
  const isLegalLayer = regionLayer === 'legal';
  const unitLabel = isLegalLayer ? '법정동' : '행정동';

  const statusVisibleDongs = statusFilter === ALL_STATUS_FILTER
    ? normalizedCoverage.dongs
    : normalizedCoverage.dongs.filter((dong) => dong.status === statusFilter);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const visibleDongs = normalizedSearchQuery
    ? statusVisibleDongs.filter((dong) => (
        `${dong.name} ${dong.district} ${dong.id}`.toLowerCase().includes(normalizedSearchQuery)
      ))
    : statusVisibleDongs;
  const districtGroups = groupDaejeonDongsByDistrict(visibleDongs);
  const selectedDong = visibleDongs.find((dong) => dong.id === selectedId)
    ?? visibleDongs[0]
    ?? normalizedCoverage.dongs.find((dong) => dong.id === selectedId)
    ?? null;
  const selectedStatus = selectedDong ? getStatusDefinition(selectedDong.status) : null;
  const selectedStatusDescription = selectedStatus && isLegalLayer && selectedDong?.status === 'source_frame'
    ? '공식 자료에서 법정동 이름·소속 구·코드와 연결 행정동을 확인한 단계입니다.'
    : selectedStatus?.description;
  const selectedRelatedDongs = selectedDong
    ? (isLegalLayer
        ? selectedDong.administrativeDongs
        : (legalDongsByAdministrativeCode.get(selectedDong.id) ?? []))
    : [];
  const reconciliationIssues = Array.isArray(normalizedLegalCoverage.reconciliation?.issues)
    ? normalizedLegalCoverage.reconciliation.issues
    : [];
  const selectedReconciliationIssues = selectedDong
    ? reconciliationIssues.filter((issue) => (
        isLegalLayer
          ? issue.legalDongCode === selectedDong.id
          : issue.administrativeDongCode === selectedDong.id
      ))
    : [];
  const evidenceMetrics = [
    {
      key: 'sourceFrame',
      label: '행정동 목록',
      metric: getEvidenceMetric(evidenceCounts, 'sourceFrame', summary.stageCounts.source_frame, summary.total),
      note: '행정동 목록·소속 확인',
      className: 'source-frame',
    },
    {
      key: 'legalSourceFrame',
      label: '법정동 목록',
      metric: getEvidenceMetric(
        evidenceCounts,
        'legalSourceFrame',
        relationSummary.legalDongCount,
        normalizedLegalCoverage.expectedCount,
      ),
      note: '공식 법정동 이름·코드 목록',
      className: 'source-frame',
    },
    {
      key: 'candidate',
      label: '후보 풀',
      metric: getEvidenceMetric(evidenceCounts, 'candidate', summary.stageCounts.candidate),
      note: '둔산 파일럿 후보',
      className: 'candidate',
    },
    {
      key: 'photoObservation',
      label: '사진 관찰',
      metric: getEvidenceMetric(evidenceCounts, 'photoObservation', summary.stageCounts.photo_draft),
      note: '저장된 관찰 기록',
      className: 'photo-observation',
    },
    {
      key: 'studentReview',
      label: '학생 검수',
      metric: getEvidenceMetric(evidenceCounts, 'studentReview', summary.stageCounts.student_review),
      note: '직접 검수 증거',
      className: 'student-review',
    },
    {
      key: 'independentReview',
      label: '독립 검수',
      metric: getEvidenceMetric(evidenceCounts, 'independentReview', summary.stageCounts.independent_review),
      note: '다른 검수자 재확인',
      className: 'independent-review',
    },
    {
      key: 'fieldConfirmation',
      label: '현장 확인',
      metric: getEvidenceMetric(evidenceCounts, 'fieldConfirmation', summary.stageCounts.field_confirmation),
      note: '방문 확인 기록',
      className: 'field-confirmation',
    },
  ];
  const auditedCandidateSources = Array.isArray(candidateSourceData?.primarySources)
    ? candidateSourceData.primarySources
    : [];
  const auditedCandidateSourceRowSum = auditedCandidateSources.reduce(
    (sum, source) => sum + (Number(source.daejeonRows) || 0),
    0,
  );
  const rootClassName = ['daejeon-dong-coverage', className].filter(Boolean).join(' ');

  function handleSelectDong(dong) {
    setSelectedId(dong.id);
    onSelectDong(dong);
  }

  function handleLayerChange(nextLayer) {
    setRegionLayer(nextLayer);
    setStatusFilter(ALL_STATUS_FILTER);
    setSelectedId(null);
    setSearchQuery('');
  }

  return (
    <section
      className={rootClassName}
      data-testid="daejeon-dong-coverage-map"
      data-map-kind="offline-schematic"
      data-expected-count={summary.total}
      data-loaded-count={summary.loadedCount}
      data-status-filter={statusFilter}
      data-region-layer={regionLayer}
      aria-label={`대전 ${unitLabel} 조사 범위와 검수 상태`}
    >
      <header className="daejeon-dong-coverage__header">
        <div>
          <span className="daejeon-dong-coverage__eyebrow">대전 생활권 · 검수 현황</span>
          <h2>대전 지역 조사 지도</h2>
          <p>
            행정동 82개와 법정동 177개를 서로 다른 층으로 확인합니다. 공식 지역 목록과
            실제 장소·사진·사람 검수 증거는 섞지 않습니다.
          </p>
        </div>
        <div className="daejeon-dong-coverage__headline-metric" aria-label={`연결된 ${unitLabel} 수`}>
          <strong>{summary.loadedCount}<span>/{summary.total}</span></strong>
          <small>{getLoadedCopy(summary, unitLabel)}</small>
        </div>
      </header>

      <p className="daejeon-dong-coverage__boundary-note">
        격자형 조사 현황판 · 실제 행정경계 아님. 82+177은 259개 독립 지역이 아니라 서로 겹치는 두 분류입니다.
      </p>

      <nav className="daejeon-dong-coverage__layer-switch" aria-label="지역 분류 선택">
        <button
          type="button"
          className={regionLayer === 'administrative' ? 'active' : ''}
          aria-pressed={regionLayer === 'administrative'}
          onClick={() => handleLayerChange('administrative')}
        >
          <span>행정 운영 기준</span>
          <strong>행정동 82</strong>
          <small>주민센터·행정 서비스 단위</small>
        </button>
        <button
          type="button"
          className={regionLayer === 'legal' ? 'active' : ''}
          aria-pressed={regionLayer === 'legal'}
          onClick={() => handleLayerChange('legal')}
        >
          <span>주소·토지 기준</span>
          <strong>법정동 177</strong>
          <small>주소에 쓰이는 지역 이름 단위</small>
        </button>
      </nav>

      <section className="daejeon-dong-coverage__relation-summary" aria-label="행정동과 법정동 연결관계">
        <div>
          <span>두 분류의 연결</span>
          <strong>82 행정동 ↔ 177 법정동</strong>
          <small>행정안전부 관할구역 연결코드 기준</small>
        </div>
        <dl>
          <div>
            <dt>고유 연결관계</dt>
            <dd>{relationSummary.relationCount}</dd>
          </div>
          <div>
            <dt>여러 행정동에 걸친 법정동</dt>
            <dd>{relationSummary.multiAdministrativeLegalDongCount}</dd>
          </div>
          <div className="needs-confirmation">
            <dt>지역표 교차확인 필요</dt>
            <dd>{normalizedLegalCoverage.reconciliation?.issueCount ?? 0}</dd>
          </div>
        </dl>
      </section>

      <div className="daejeon-dong-coverage__metrics" aria-label={`${unitLabel} 조사 범위 요약`}>
        <article>
          <span>목록에 넣은 {unitLabel}</span>
          <strong>{summary.loadedCount}/{summary.total}</strong>
          <small>{summary.remainingCount > 0 ? `${summary.remainingCount}개 대기` : '대기 없음'}</small>
        </article>
        <article>
          <span>공식 이름 확인</span>
          <strong>{summary.namedCount}</strong>
          <small>제공된 이름만 집계</small>
        </article>
        <article>
          <span>재확인 필요</span>
          <strong>{summary.needsRecheckCount}</strong>
          <small>상태 누락 포함</small>
        </article>
        <article>
          <span>목록 반영률</span>
          <strong>{summary.completionPercent}%</strong>
          <small>공식 목록 기준</small>
        </article>
      </div>

      <section className="daejeon-dong-coverage__evidence-boundary" aria-label="공식 지역 목록과 사람 증거의 구분">
        <header>
          <div>
            <span>증거 경계</span>
            <strong>행정동 82/82 · 법정동 177/177과 접근성 조사는 별도입니다</strong>
          </div>
          <small>공식 목록 연결 수와 조사 증거 수를 섞지 않습니다.</small>
        </header>
        <div className="daejeon-dong-coverage__evidence-grid">
          {evidenceMetrics.map(({ key, label, metric, note, className: metricClassName }) => (
            <article className={`evidence-${metricClassName}`} key={key}>
              <span>{label}</span>
              <strong>{formatEvidenceCount(metric)}</strong>
              <small>{metric.note || note}</small>
            </article>
          ))}
        </div>
      </section>

      {auditedCandidateSources.length > 0 ? (
        <section className="daejeon-dong-coverage__candidate-sources" aria-label="추가 실제 장소 후보 원천">
          <header>
            <div>
              <span>다음 실제 장소 층</span>
              <strong>공식 데이터 3종 · 대전 후보 원천행 {auditedCandidateSourceRowSum.toLocaleString()}개</strong>
            </div>
            <small>중복 제거·동 연결 전 · 접근성 검증 전</small>
          </header>
          <div className="daejeon-dong-coverage__candidate-source-grid">
            {auditedCandidateSources.map((source) => (
              <a href={source.datasetUrl} target="_blank" rel="noreferrer" key={source.id}>
                <span>{source.name}</span>
                <strong>{Number(source.daejeonRows).toLocaleString()}<small>행</small></strong>
                <small>{source.coordinateSystem || '주소 연결 필요'} · 법정동/행정동 연결 대기</small>
              </a>
            ))}
          </div>
          <p>
            이 수치는 공식 원천에서 찾은 조사 시작 후보입니다. 같은 장소 중복, 실제 출입구,
            마지막 30~50m, 현재 통행 가능 여부는 아직 확인하지 않았습니다.
          </p>
        </section>
      ) : null}

      <label className="daejeon-dong-coverage__search">
        <span>{unitLabel} 이름·자치구·코드 찾기</span>
        <input
          type="search"
          value={searchQuery}
          placeholder={isLegalLayer ? '예: 둔산동, 유성구, 3017011200' : '예: 둔산1동, 서구, 3017063000'}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <small>{searchQuery ? `${visibleDongs.length}개 검색됨` : `${summary.loadedCount}개 전체 표시`}</small>
      </label>

      <nav className="daejeon-dong-coverage__filters" aria-label={`${unitLabel} 조사 단계 필터`}>
        <button
          type="button"
          className={statusFilter === ALL_STATUS_FILTER ? 'active' : ''}
          aria-pressed={statusFilter === ALL_STATUS_FILTER}
          onClick={() => setStatusFilter(ALL_STATUS_FILTER)}
        >
          <span>전체</span>
          <strong>{summary.loadedCount}</strong>
        </button>
        {DAEJEON_DONG_STATUS_ORDER.map((status) => {
          const definition = getStatusDefinition(status);
          return (
            <button
              type="button"
              key={status}
              className={`${statusFilter === status ? 'active ' : ''}status-${status}`}
              aria-pressed={statusFilter === status}
              onClick={() => setStatusFilter(status)}
            >
              <span>{definition.label}</span>
              <strong>{summary.counts[status]}</strong>
            </button>
          );
        })}
      </nav>

      <div className="daejeon-dong-coverage__body">
        <section className="daejeon-dong-coverage__board" aria-label={`${unitLabel} 조사 단계 격자 지도`}>
          <header className="daejeon-dong-coverage__board-header">
            <div>
              <span>{summary.total}개 {unitLabel} 조사 단계</span>
              <strong>{visibleDongs.length}개 타일 표시</strong>
            </div>
            <small>{districtGroups.length}개 자치구 묶음 · 순서는 제공된 데이터 순서를 유지합니다.</small>
          </header>
          {visibleDongs.length > 0 ? (
            <div className="daejeon-dong-coverage__district-groups">
              {districtGroups.map((group) => (
                <section className="daejeon-dong-coverage__district-group" key={group.key}>
                  <header>
                    <div>
                      <span>자치구</span>
                      <strong>{group.label}</strong>
                    </div>
                    <small>{group.dongs.length}개</small>
                  </header>
                  <div className="daejeon-dong-coverage__tile-grid">
                    {group.dongs.map((dong) => {
                      const definition = getStatusDefinition(dong.status);
                      const isSelected = selectedDong?.id === dong.id;
                      const tileIndex = visibleDongs.indexOf(dong) + 1;
                      return (
                        <button
                          type="button"
                          key={`${dong.id}-${tileIndex}`}
                          className={`daejeon-dong-coverage__tile status-${dong.status}${isSelected ? ' selected' : ''}`}
                          data-dong-id={dong.sourceId ?? dong.id}
                          data-status={dong.status}
                          aria-pressed={isSelected}
                          aria-label={`${getDisplayName(dong, unitLabel)}, ${definition.label}`}
                          onClick={() => handleSelectDong(dong)}
                        >
                          <span className="daejeon-dong-coverage__tile-index">{String(tileIndex).padStart(2, '0')}</span>
                          <strong>{getDisplayName(dong, unitLabel)}</strong>
                          <small>
                            {isLegalLayer && dong.spansMultipleAdministrativeDongs
                              ? `행정동 ${dong.administrativeDongCount}곳 연결`
                              : definition.compactLabel}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="daejeon-dong-coverage__empty-state">
              {normalizedCoverage.hasRecords ? (
                <>
                  <strong>조건에 맞는 {unitLabel}이 없습니다.</strong>
                  <p>검색어나 조사 단계를 바꾸면 연결된 레코드를 볼 수 있습니다.</p>
                </>
              ) : (
                <>
                  <strong>권위 있는 {unitLabel} 데이터 대기 중</strong>
                  <p>데이터가 연결되기 전까지 이름·타일을 생성하지 않습니다.</p>
                </>
              )}
            </div>
          )}
        </section>

        <aside
          className="daejeon-dong-coverage__detail"
          data-selected-dong-id={selectedDong?.sourceId ?? selectedDong?.id ?? ''}
          aria-label={`선택한 ${unitLabel} 상태 상세`}
        >
          <span className="daejeon-dong-coverage__detail-eyebrow">선택한 {unitLabel}</span>
          {selectedDong && selectedStatus ? (
            <>
              <h3>{getDisplayName(selectedDong, unitLabel)}</h3>
              <div className={`daejeon-dong-coverage__current-status status-${selectedDong.status}`}>
                <span>현재 조사 단계</span>
                <strong>{selectedStatus.label}</strong>
                <p>{selectedStatusDescription}</p>
              </div>
              {selectedReconciliationIssues.length > 0 ? (
                <div className="daejeon-dong-coverage__reconciliation-warning">
                  <strong>관할 관계를 한 번 더 확인해야 합니다</strong>
                  {selectedReconciliationIssues.map((issue) => (
                    <p key={issue.id}>
                      {issue.note}{' '}
                      <a href={issue.localSourceUrl} target="_blank" rel="noreferrer">자치구 표 보기</a>
                    </p>
                  ))}
                </div>
              ) : null}
              <dl>
                {selectedDong.district ? (
                  <div>
                    <dt>자치구</dt>
                    <dd>{selectedDong.district}</dd>
                  </div>
                ) : null}
                {selectedDong.sourceId ? (
                  <div>
                    <dt>{unitLabel} 코드</dt>
                    <dd>{selectedDong.sourceId}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>{isLegalLayer ? '연결 행정동' : '포함·연결 법정동'}</dt>
                  <dd>{selectedRelatedDongs.length}개</dd>
                </div>
              </dl>
              {selectedRelatedDongs.length > 0 ? (
                <div className="daejeon-dong-coverage__related-dongs">
                  <span>{isLegalLayer ? '이 법정동을 관할하는 행정동' : '이 행정동에 연결된 법정동'}</span>
                  <ul>
                    {selectedRelatedDongs.map((relatedDong) => (
                      <li key={relatedDong.code ?? relatedDong.id}>
                        <strong>{relatedDong.name}</strong>
                        <small>{relatedDong.code ?? relatedDong.id}</small>
                      </li>
                    ))}
                  </ul>
                  {isLegalLayer && selectedDong.spansMultipleAdministrativeDongs ? (
                    <p>이 법정동은 행정동 한 곳으로 임의 배정하지 않고 연결된 관할을 모두 표시합니다.</p>
                  ) : null}
                </div>
              ) : null}
              <div className="daejeon-dong-coverage__trail">
                <span>기록된 상태 흐름</span>
                <ol>
                  {selectedDong.statusTrail.map((status, index) => (
                    <li key={`${status}-${index}`} className={`status-${status}`}>
                      <b>{index + 1}</b>
                      <span>{getStatusDefinition(status).label}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <p className="daejeon-dong-coverage__detail-note">
                상태는 제공된 레코드의 현재 단계 표시입니다. 실제 현장 확인이나 최종 접근성 판단을 대신하지 않습니다.
              </p>
            </>
          ) : (
            <div className="daejeon-dong-coverage__detail-empty">
              <strong>{unitLabel}을 선택하면</strong>
              <p>제공된 이름, 상태, 상태 흐름을 이곳에서 확인합니다.</p>
            </div>
          )}
        </aside>
      </div>

      <footer className="daejeon-dong-coverage__footer">
        <div>
          <span>단계 안내와 출처</span>
          <p>
            색상은 상태 구분용이며, 완료·안전·접근 가능을 의미하지 않습니다. {normalizedCoverage.sourceLabel
              ? `데이터 출처: ${normalizedCoverage.sourceLabel}`
              : '데이터 출처 표시는 연결된 패킷의 메타데이터를 따릅니다.'}
            {normalizedCoverage.sourceEffectiveDate ? ` · 코드 시행 ${normalizedCoverage.sourceEffectiveDate}` : ''}
            {normalizedCoverage.sourceRetrievedAt ? ` · 확인 ${normalizedCoverage.sourceRetrievedAt}` : ''}
          </p>
        </div>
        <div className="daejeon-dong-coverage__source-links" aria-label="지역 분류 공식 출처 링크">
          {normalizedAdministrativeCoverage.sourceUrl ? (
            <a href={normalizedAdministrativeCoverage.sourceUrl} target="_blank" rel="noreferrer">대전시 행정구역 표</a>
          ) : null}
          {normalizedAdministrativeCoverage.codeSourceUrl || normalizedLegalCoverage.sourceUrl ? (
            <a
              href={normalizedAdministrativeCoverage.codeSourceUrl || normalizedLegalCoverage.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              행정안전부 행정동·법정동 원문
            </a>
          ) : null}
        </div>
      </footer>
    </section>
  );
}
