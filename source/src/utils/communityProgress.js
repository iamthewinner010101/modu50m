const WINDOW_DAYS = 7;

export const COMMUNITY_BADGES = [
  {
    key: 'first_step',
    label: '첫 발자국',
    description: '첫 직접 검수를 저장했어요',
    isEarned: (counts) => counts.primary >= 1,
  },
  {
    key: 'careful_observer',
    label: '꼼꼼한 관찰자',
    description: '서로 다른 장소 3곳을 검수했어요',
    isEarned: (counts) => counts.primary >= 3,
  },
  {
    key: 'cross_checker',
    label: '교차검증자',
    description: '다른 사람의 기록을 독립 검수했어요',
    isEarned: (counts) => counts.second >= 1,
  },
  {
    key: 'difference_finder',
    label: '불일치 발견자',
    description: '서로 다른 판단을 숨기지 않고 남겼어요',
    isEarned: (counts) => counts.disputed >= 1,
  },
  {
    key: 'field_evidence',
    label: '현장 증거 수집가',
    description: '사진이 있는 현장 확인을 남겼어요',
    isEarned: (counts) => counts.field >= 1,
  },
];

function createCounts() {
  return { primary: 0, second: 0, disputed: 0, field: 0 };
}

function isActualAccountEvent(event) {
  return Boolean(event?.actorId && !String(event.actorId).startsWith('demo:'));
}

function classifyEvent(event) {
  if (
    ['REVIEW_CREATED', 'REVIEW_UPDATED'].includes(event.action) &&
    event.after?.feedbackOrigin === 'human_user' &&
    event.after?.stepChecks?.decisionSaved === true &&
    event.before?.stepChecks?.decisionSaved !== true
  ) {
    return { kind: 'primary', points: 1 };
  }
  if (event.action === 'SECOND_REVIEW_RECORDED') {
    const disputed = event.after?.secondReviewEvidence?.decision === 'disputed';
    return { kind: 'second', points: disputed ? 4 : 3, disputed };
  }
  if (event.action === 'FIELD_VERIFICATION_RECORDED') {
    return { kind: 'field', points: 5 };
  }
  return null;
}

function buildBadges(counts) {
  return COMMUNITY_BADGES.map(({ isEarned, ...badge }) => ({
    ...badge,
    earned: isEarned(counts),
  }));
}

export function buildCommunityProgress({ events = [], actorId = '', actorDisplayName = '나', now = new Date() } = {}) {
  const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const windowStartMs = nowMs - WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const contributors = new Map();
  const seenContributions = new Set();
  let ignoredEventCount = 0;

  const orderedEvents = [...events].sort((a, b) => {
    const timeDelta = Date.parse(a.createdAt ?? 0) - Date.parse(b.createdAt ?? 0);
    return timeDelta || Number(a.id ?? 0) - Number(b.id ?? 0);
  });

  for (const event of orderedEvents) {
    const createdAtMs = Date.parse(event.createdAt ?? '');
    const classification = isActualAccountEvent(event) ? classifyEvent(event) : null;
    if (!classification || !Number.isFinite(createdAtMs) || createdAtMs < windowStartMs || createdAtMs > nowMs) {
      ignoredEventCount += 1;
      continue;
    }

    const contributionKey = `${event.actorId}:${event.candidateId ?? 'workspace'}:${classification.kind}`;
    if (seenContributions.has(contributionKey)) {
      ignoredEventCount += 1;
      continue;
    }
    seenContributions.add(contributionKey);

    const contributor = contributors.get(event.actorId) ?? {
      actorId: event.actorId,
      displayName: event.actorDisplayName || event.actorId,
      points: 0,
      counts: createCounts(),
    };
    contributor.points += classification.points;
    contributor.counts[classification.kind] += 1;
    if (classification.disputed) contributor.counts.disputed += 1;
    contributors.set(event.actorId, contributor);
  }

  const rankings = [...contributors.values()]
    .map((contributor) => ({ ...contributor, badges: buildBadges(contributor.counts) }))
    .sort((a, b) => b.points - a.points || b.counts.field - a.counts.field || a.displayName.localeCompare(b.displayName, 'ko'))
    .map((contributor, index) => ({ ...contributor, rank: index + 1 }));

  const existingMine = rankings.find((contributor) => contributor.actorId === actorId);
  const emptyCounts = createCounts();
  const myProgress = existingMine ?? {
    actorId,
    displayName: actorDisplayName,
    points: 0,
    counts: emptyCounts,
    badges: buildBadges(emptyCounts),
    rank: null,
  };

  return {
    windowDays: WINDOW_DAYS,
    rankings,
    myProgress,
    ignoredEventCount,
    qualityRule: 'AI 분석·자동 검증·반복 저장은 점수에 포함하지 않아요.',
  };
}
