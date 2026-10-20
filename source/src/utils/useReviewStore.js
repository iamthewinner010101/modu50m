import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_SYNC_STATE = {
  mode: 'checking',
  status: 'checking',
  label: '저장 경로 확인 중',
  detail: 'SaaS 서버 연결 여부를 확인합니다.',
  tenantName: '',
  lastSavedAt: '',
};

const DEFAULT_TEAM_STATE = {
  actor: null,
  tenant: null,
  memberships: [],
  assignments: {},
  claimingCandidateId: '',
  error: '',
};

const DEFAULT_ACCOUNT_STATE = {
  authMode: 'demo',
  status: 'checking',
  requiresLogin: false,
  workspaceSlug: 'codefair-judge',
  error: '',
  notice: '',
};

const DEFAULT_AUDIT_STATE = {
  status: 'idle',
  tenant: null,
  filters: {},
  events: [],
  eventCount: 0,
  loadedAt: '',
  error: '',
};

const DEFAULT_LEARNING_STATE = {
  status: 'idle',
  feedbackLearning: null,
  actionReasonCode: '',
  notice: '',
  error: '',
};

function readLocalReviews(storageKey) {
  try {
    const savedReviews = window.localStorage.getItem(storageKey);
    return savedReviews ? JSON.parse(savedReviews) : {};
  } catch {
    return {};
  }
}

function getDemoIdentity() {
  const params = new URLSearchParams(window.location.search);
  const requestedWorkspace = params.get('workspace') ?? 'codefair-judge';
  const workspaceSlug = /^[a-z0-9][a-z0-9-]{2,47}$/.test(requestedWorkspace)
    ? requestedWorkspace
    : 'codefair-judge';
  const displayName = (params.get('actor') ?? '코드페어 심사위원').slice(0, 40);
  const requestedRole = params.get('role') ?? 'supervisor';
  const role = ['supervisor', 'reviewer', 'read_only'].includes(requestedRole)
    ? requestedRole
    : 'supervisor';
  const authMode = params.get('auth') === 'account' ? 'account' : 'demo';
  return { workspaceSlug, displayName, role, authMode };
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    const error = new Error('SaaS API is not available on this origin.');
    error.code = 'API_UNAVAILABLE';
    throw error;
  }
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload?.error?.message ?? `API request failed: ${response.status}`);
    error.code = payload?.error?.code ?? 'API_REQUEST_FAILED';
    error.status = response.status;
    error.details = payload?.error?.details;
    throw error;
  }
  return payload;
}

function getAuthorizationHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getFeedbackOrigin() {
  if (typeof window === 'undefined') return 'legacy_unverified';
  return new URLSearchParams(window.location.search).get('qa') === '1'
    ? 'automated_qa'
    : 'human_user';
}

export function useReviewStore(storageKey) {
  const scopedStorageKey = `${storageKey}:${getDemoIdentity().workspaceSlug}`;
  const [reviews, setReviews] = useState(() => readLocalReviews(scopedStorageKey));
  const [syncState, setSyncState] = useState(DEFAULT_SYNC_STATE);
  const [teamState, setTeamState] = useState(DEFAULT_TEAM_STATE);
  const [auditState, setAuditState] = useState(DEFAULT_AUDIT_STATE);
  const [learningState, setLearningState] = useState(DEFAULT_LEARNING_STATE);
  const [accountState, setAccountState] = useState(() => ({
    ...DEFAULT_ACCOUNT_STATE,
    authMode: getDemoIdentity().authMode,
    workspaceSlug: getDemoIdentity().workspaceSlug,
  }));
  const reviewsRef = useRef(reviews);
  const sessionRef = useRef(null);
  const versionsRef = useRef({});
  const writeQueueRef = useRef(Promise.resolve());
  const pendingWritesRef = useRef(0);
  const auditRevisionRef = useRef(0);
  const feedbackOriginRef = useRef(getFeedbackOrigin());
  const requestEntranceApi = useCallback((suffix, options = {}) => {
    if (!sessionRef.current?.token) return Promise.reject(new Error('서버 세션 연결이 필요합니다.'));
    return requestJson(`/api/entrances${suffix}`, { ...options, headers: {
      ...options.headers, ...getAuthorizationHeaders(sessionRef.current.token),
    } });
  }, []);

  useEffect(() => {
    reviewsRef.current = reviews;
    window.localStorage.setItem(scopedStorageKey, JSON.stringify(reviews));
  }, [reviews, scopedStorageKey]);

  function applyWorkspaceSession({ workspace, token, identity, sessionStorageKey }) {
    sessionRef.current = {
      token,
      workspaceSlug: workspace.tenant?.slug ?? identity.workspaceSlug,
      actor: workspace.actor,
      sessionStorageKey,
      authMode: identity.authMode,
    };
    versionsRef.current = workspace.versions ?? {};
    setReviews(workspace.reviews ?? {});
    setTeamState({
      actor: workspace.actor ?? null,
      tenant: workspace.tenant ?? null,
      memberships: workspace.memberships ?? [],
      assignments: workspace.assignments ?? {},
      claimingCandidateId: '',
      error: '',
    });
    auditRevisionRef.current = 0;
    setAuditState(DEFAULT_AUDIT_STATE);
    setLearningState({
      status: 'loaded',
      feedbackLearning: workspace.feedbackLearning ?? null,
      actionReasonCode: '',
      notice: '',
      error: '',
    });
    setSyncState({
      mode: 'server',
      status: 'saved',
      label: 'SaaS 서버 저장',
      detail:
        identity.authMode === 'account'
          ? '로그인 계정의 조직 저장소와 감사 로그가 연결되었습니다.'
          : '조직별 SQLite 저장과 감사 로그가 연결되었습니다.',
      tenantName: workspace.tenant?.name ?? identity.workspaceSlug,
      lastSavedAt: '',
    });
    setAccountState({
      authMode: identity.authMode,
      status: 'authenticated',
      requiresLogin: false,
      workspaceSlug: workspace.tenant?.slug ?? identity.workspaceSlug,
      error: '',
      notice: '',
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function connectServerStorage() {
      try {
        const health = await requestJson('/api/health');
        if (health.service !== 'modu50m-saas' || health.storage !== 'sqlite') {
          throw Object.assign(new Error('Unexpected API service.'), { code: 'API_UNAVAILABLE' });
        }

        const identity = getDemoIdentity();
        const sessionStorageKey =
          identity.authMode === 'account'
            ? `modu50m-account-session-v1:${identity.workspaceSlug}`
            : `modu50m-saas-session-v1:${identity.workspaceSlug}:${identity.displayName}:${identity.role}`;
        let token = window.sessionStorage.getItem(sessionStorageKey) ?? '';
        let workspace;

        if (token) {
          try {
            workspace = await requestJson('/api/workspace', {
              headers: getAuthorizationHeaders(token),
            });
          } catch (error) {
            if (error.status !== 401) throw error;
            window.sessionStorage.removeItem(sessionStorageKey);
            token = '';
          }
        }

        if (!token && identity.authMode === 'account') {
          if (cancelled) return;
          sessionRef.current = null;
          versionsRef.current = {};
          setReviews({});
          setTeamState(DEFAULT_TEAM_STATE);
          setAuditState(DEFAULT_AUDIT_STATE);
          setLearningState(DEFAULT_LEARNING_STATE);
          setSyncState({
            mode: 'server',
            status: 'auth_required',
            label: '계정 로그인 필요',
            detail: '기관 계정으로 로그인한 뒤 서버 검수함을 엽니다.',
            tenantName: '',
            lastSavedAt: '',
          });
          setAccountState({
            authMode: 'account',
            status: 'idle',
            requiresLogin: true,
            workspaceSlug: identity.workspaceSlug,
            error: '',
            notice: '',
          });
          return;
        }

        if (!token) {
          const session = await requestJson('/api/session/demo', {
            method: 'POST',
            body: JSON.stringify(identity),
          });
          token = session.token;
          window.sessionStorage.setItem(sessionStorageKey, token);
          workspace = await requestJson('/api/workspace', {
            headers: getAuthorizationHeaders(token),
          });
        }

        if (cancelled) return;
        const localSnapshot = reviewsRef.current;
        const serverReviewCount = Object.keys(workspace.reviews ?? {}).length;
        const localReviewEntries = Object.entries(localSnapshot);
        if (
          identity.authMode === 'demo' &&
          serverReviewCount === 0 &&
          localReviewEntries.length > 0
        ) {
          for (const [candidateId, review] of localReviewEntries) {
            const saved = await requestJson(`/api/reviews/${candidateId}`, {
              method: 'PUT',
              headers: getAuthorizationHeaders(token),
              body: JSON.stringify({ patch: review, expectedVersion: 0 }),
            });
            versionsRef.current[candidateId] = saved.version;
          }
          workspace = await requestJson('/api/workspace', {
            headers: getAuthorizationHeaders(token),
          });
        }

        if (cancelled) return;
        applyWorkspaceSession({ workspace, token, identity, sessionStorageKey });
      } catch (error) {
        if (cancelled) return;
        sessionRef.current = null;
        versionsRef.current = {};
        setTeamState(DEFAULT_TEAM_STATE);
        setAuditState(DEFAULT_AUDIT_STATE);
        setLearningState(DEFAULT_LEARNING_STATE);
        const identity = getDemoIdentity();
        if (identity.authMode === 'account') {
          setSyncState({
            mode: 'server',
            status: 'error',
            label: '계정 서버 연결 실패',
            detail: 'SaaS 서버 연결을 확인한 뒤 다시 로그인합니다.',
            tenantName: '',
            lastSavedAt: '',
          });
          setAccountState({
            authMode: 'account',
            status: 'error',
            requiresLogin: true,
            workspaceSlug: identity.workspaceSlug,
            error: '계정 서버에 연결하지 못했습니다.',
            notice: '',
          });
        } else {
          setSyncState({
            mode: 'local',
            status: 'saved',
            label: '브라우저 임시 저장',
            detail:
              error.code === 'API_UNAVAILABLE'
                ? '개발 서버에서는 이 브라우저에 저장합니다.'
                : 'SaaS 서버 연결에 실패해 이 브라우저에 임시 저장합니다.',
            tenantName: '',
            lastSavedAt: '',
          });
          setAccountState({
            authMode: 'demo',
            status: 'local',
            requiresLogin: false,
            workspaceSlug: identity.workspaceSlug,
            error: '',
            notice: '',
          });
        }
      }
    }

    connectServerStorage();
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  function enqueueServerOperation(operation) {
    writeQueueRef.current = writeQueueRef.current.catch(() => undefined).then(operation);
    return writeQueueRef.current;
  }

  function markAuditStale() {
    auditRevisionRef.current += 1;
    setAuditState((current) => ({ ...current, status: 'stale' }));
  }

  function mergeServerReview(candidateId, serverReview, { forceValidationStatus = false } = {}) {
    if (!serverReview) return;
    setReviews((current) => {
      const optimisticReview = current[candidateId] ?? {};
      const hasNewerOptimisticEdit =
        optimisticReview.updatedAt &&
        serverReview.updatedAt &&
        optimisticReview.updatedAt > serverReview.updatedAt;
      const nextReview = hasNewerOptimisticEdit
        ? { ...serverReview, ...optimisticReview }
        : { ...optimisticReview, ...serverReview };

      return {
        ...current,
        [candidateId]: {
          ...nextReview,
          primaryReviewEvidence:
            serverReview.primaryReviewEvidence ?? optimisticReview.primaryReviewEvidence,
          secondReviewEvidence:
            serverReview.secondReviewEvidence ?? optimisticReview.secondReviewEvidence,
          fieldVerificationEvidence:
            serverReview.fieldVerificationEvidence ?? optimisticReview.fieldVerificationEvidence,
          ...(forceValidationStatus
            ? { validationStatus: serverReview.validationStatus }
            : {}),
        },
      };
    });
  }

  function setReview(candidateId, patch) {
    const updatedAt = new Date().toISOString();
    const previousReview = reviewsRef.current[candidateId];
    const reviewPatch = {
      ...patch,
      feedbackOrigin: patch.feedbackOrigin ?? feedbackOriginRef.current,
    };
    setReviews((current) => ({
      ...current,
      [candidateId]: {
        ...current[candidateId],
        ...reviewPatch,
        updatedAt,
      },
    }));

    if (!sessionRef.current?.token) {
      return Promise.resolve({
        ok: true,
        mode: 'local',
        candidateId,
        updatedAt,
      });
    }
    pendingWritesRef.current += 1;
    setSyncState((current) => ({
      ...current,
      status: 'syncing',
      label: 'SaaS 서버 저장 중',
      detail: `${candidateId} 판정 변경을 저장하고 있습니다.`,
    }));

    return enqueueServerOperation(async () => {
      try {
        const saved = await requestJson(`/api/reviews/${candidateId}`, {
          method: 'PUT',
          headers: getAuthorizationHeaders(sessionRef.current?.token),
          body: JSON.stringify({
            patch: reviewPatch,
            expectedVersion: versionsRef.current[candidateId] ?? 0,
          }),
        });
        versionsRef.current[candidateId] = saved.version;
        mergeServerReview(candidateId, saved.review);
        if (saved.assignment) {
          setTeamState((current) => ({
            ...current,
            assignments: {
              ...current.assignments,
              [candidateId]: saved.assignment,
            },
          }));
        }
        if (saved.feedbackLearning) {
          setLearningState((current) => ({
            ...current,
            status: 'loaded',
            feedbackLearning: saved.feedbackLearning,
            actionReasonCode: '',
            error: '',
          }));
        }
        markAuditStale();
        pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
        setSyncState((current) => ({
          ...current,
          mode: 'server',
          status: pendingWritesRef.current > 0 ? 'syncing' : 'saved',
          label: pendingWritesRef.current > 0 ? 'SaaS 서버 저장 중' : 'SaaS 서버 저장됨',
          detail:
            pendingWritesRef.current > 0
              ? `남은 변경 ${pendingWritesRef.current}건을 저장하고 있습니다.`
              : `${candidateId} 판정과 감사 로그가 저장되었습니다.`,
          lastSavedAt: saved.updatedAt,
        }));
        return {
          ok: true,
          mode: 'server',
          candidateId,
          updatedAt: saved.updatedAt,
          review: saved.review,
        };
      } catch (error) {
        setReviews((current) => {
          if (current[candidateId]?.updatedAt !== updatedAt) return current;
          if (previousReview) {
            return {
              ...current,
              [candidateId]: previousReview,
            };
          }
          const next = { ...current };
          delete next[candidateId];
          return next;
        });
        pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
        setSyncState((current) => ({
          ...current,
          mode: 'server',
          status: error.code === 'REVIEW_VERSION_CONFLICT' ? 'conflict' : 'error',
          label: error.code === 'REVIEW_VERSION_CONFLICT' ? '다른 창의 변경 확인 필요' : '서버 저장 실패',
          detail:
            error.code === 'REVIEW_VERSION_CONFLICT'
              ? '새로고침해 최신 판정을 확인한 뒤 다시 저장합니다.'
              : '브라우저 임시 기록은 유지됩니다. 연결을 확인해 주세요.',
        }));
        return {
          ok: false,
          mode: 'server',
          candidateId,
          errorCode: error.code ?? 'SERVER_SAVE_FAILED',
          message: error.message || '서버에 저장하지 못했습니다.',
        };
      }
    });
  }

  function submitSupplementalEvidence(candidateId, action, payload) {
    if (!sessionRef.current?.token) {
      return Promise.reject(new Error('A server session is required to record human evidence.'));
    }

    pendingWritesRef.current += 1;
    setSyncState((current) => ({
      ...current,
      status: 'syncing',
      label: '사람 증거 저장 중',
      detail: `${candidateId}의 추가 검수 증거를 서버에 저장하고 있습니다.`,
    }));

    return enqueueServerOperation(async () => {
      try {
        const saved = await requestJson(`/api/reviews/${candidateId}/${action}`, {
          method: 'POST',
          headers: getAuthorizationHeaders(sessionRef.current?.token),
          body: JSON.stringify({
            ...payload,
            expectedVersion: versionsRef.current[candidateId] ?? 0,
          }),
        });
        versionsRef.current[candidateId] = saved.version;
        mergeServerReview(candidateId, saved.review, { forceValidationStatus: true });
        if (saved.feedbackLearning) {
          setLearningState((current) => ({
            ...current,
            status: 'loaded',
            feedbackLearning: saved.feedbackLearning,
            actionReasonCode: '',
            error: '',
          }));
        }
        markAuditStale();
        pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
        setSyncState((current) => ({
          ...current,
          mode: 'server',
          status: pendingWritesRef.current > 0 ? 'syncing' : 'saved',
          label: pendingWritesRef.current > 0 ? '사람 증거 저장 중' : '사람 증거 저장됨',
          detail: `${candidateId}의 추가 검수 증거와 감사 로그가 저장되었습니다.`,
          lastSavedAt: saved.updatedAt,
        }));
        return saved.review;
      } catch (error) {
        pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
        setSyncState((current) => ({
          ...current,
          mode: 'server',
          status: error.code === 'REVIEW_VERSION_CONFLICT' ? 'conflict' : 'error',
          label: '사람 증거 저장 실패',
          detail: error.message || '추가 검수 증거를 저장하지 못했습니다.',
        }));
        throw error;
      }
    });
  }

  function submitSecondReview(candidateId, payload) {
    return submitSupplementalEvidence(candidateId, 'second-review', payload);
  }

  function submitFieldVerification(candidateId, payload) {
    return submitSupplementalEvidence(candidateId, 'field-verification', payload);
  }

  function resetReviews() {
    setReviews({});
    if (!sessionRef.current?.token) {
      versionsRef.current = {};
      return;
    }

    pendingWritesRef.current += 1;
    setSyncState((current) => ({
      ...current,
      status: 'syncing',
      label: 'SaaS 서버 초기화 중',
      detail: '이 조직의 검수 기록을 초기화하고 있습니다.',
    }));
    enqueueServerOperation(async () => {
      try {
        const result = await requestJson('/api/reviews?confirm=RESET', {
          method: 'DELETE',
          headers: getAuthorizationHeaders(sessionRef.current?.token),
        });
        versionsRef.current = result.versions ?? {};
        if (result.team) {
          setTeamState((current) => ({
            ...current,
            memberships: result.team.memberships ?? current.memberships,
            assignments: result.team.assignments ?? current.assignments,
          }));
        }
        setLearningState({
          status: 'loaded',
          feedbackLearning: result.feedbackLearning ?? null,
          actionReasonCode: '',
          notice: '검수 기록과 승격 규칙을 함께 초기화했습니다.',
          error: '',
        });
        markAuditStale();
        pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
        setSyncState((current) => ({
          ...current,
          status: 'saved',
          label: 'SaaS 서버 저장됨',
          detail: '검수 초기화 이력이 감사 로그에 저장되었습니다.',
          lastSavedAt: new Date().toISOString(),
        }));
      } catch {
        pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
        setSyncState((current) => ({
          ...current,
          status: 'error',
          label: '서버 초기화 실패',
          detail: '브라우저 화면만 초기화되었습니다. 서버 연결을 확인해 주세요.',
        }));
      }
    });
  }

  function claimCandidate(candidateId) {
    if (!sessionRef.current?.token) return;
    setTeamState((current) => ({
      ...current,
      claimingCandidateId: candidateId,
      error: '',
    }));
    enqueueServerOperation(async () => {
      try {
        const result = await requestJson(`/api/assignments/${candidateId}/claim`, {
          method: 'POST',
          headers: getAuthorizationHeaders(sessionRef.current?.token),
        });
        setTeamState((current) => ({
          ...current,
          memberships: result.team?.memberships ?? current.memberships,
          assignments: result.team?.assignments ?? current.assignments,
          claimingCandidateId: '',
          error: '',
        }));
        markAuditStale();
      } catch (error) {
        setTeamState((current) => ({
          ...current,
          claimingCandidateId: '',
          error:
            error.code === 'ASSIGNMENT_CONFLICT'
              ? `${error.details?.assigneeDisplayName ?? '다른 검수자'} 담당 작업입니다.`
              : '작업 배정에 실패했습니다.',
        }));
      }
    });
  }

  function releaseCandidate(candidateId) {
    if (!sessionRef.current?.token) return;
    setTeamState((current) => ({
      ...current,
      claimingCandidateId: candidateId,
      error: '',
    }));
    enqueueServerOperation(async () => {
      try {
        const result = await requestJson(`/api/assignments/${candidateId}`, {
          method: 'DELETE',
          headers: getAuthorizationHeaders(sessionRef.current?.token),
        });
        setTeamState((current) => ({
          ...current,
          memberships: result.team?.memberships ?? current.memberships,
          assignments: result.team?.assignments ?? current.assignments,
          claimingCandidateId: '',
          error: '',
        }));
        markAuditStale();
      } catch {
        setTeamState((current) => ({
          ...current,
          claimingCandidateId: '',
          error: '작업 배정 해제에 실패했습니다.',
        }));
      }
    });
  }

  async function authenticateAccount(endpoint, input) {
    const workspaceSlug = String(input.workspaceSlug ?? '').trim().toLowerCase();
    setAccountState((current) => ({
      ...current,
      authMode: 'account',
      status: 'loading',
      requiresLogin: true,
      workspaceSlug,
      error: '',
      notice: '',
    }));
    try {
      const session = await requestJson(endpoint, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      const sessionStorageKey = `modu50m-account-session-v1:${session.tenant.slug}`;
      window.sessionStorage.setItem(sessionStorageKey, session.token);
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set('auth', 'account');
      nextUrl.searchParams.set('workspace', session.tenant.slug);
      nextUrl.searchParams.delete('actor');
      nextUrl.searchParams.delete('role');
      window.history.replaceState(null, '', nextUrl);
      const workspace = await requestJson('/api/workspace', {
        headers: getAuthorizationHeaders(session.token),
      });
      applyWorkspaceSession({
        workspace,
        token: session.token,
        identity: {
          authMode: 'account',
          workspaceSlug: session.tenant.slug,
          displayName: session.actor.displayName,
          role: session.actor.role,
        },
        sessionStorageKey,
      });
      return true;
    } catch (error) {
      const message =
        error.code === 'INVALID_CREDENTIALS'
          ? '기관 주소, 이메일 또는 비밀번호를 확인해 주세요.'
          : error.code === 'WORKSPACE_EXISTS'
            ? '이미 사용 중인 기관 주소입니다.'
            : error.code === 'USER_EXISTS'
              ? '이미 계정이 있는 이메일입니다.'
              : error.message || '계정 요청을 처리하지 못했습니다.';
      setAccountState((current) => ({
        ...current,
        status: 'error',
        requiresLogin: true,
        error: message,
      }));
      return false;
    }
  }

  function loginAccount(input) {
    return authenticateAccount('/api/auth/login', input);
  }

  function bootstrapAccount(input) {
    return authenticateAccount('/api/auth/bootstrap', input);
  }

  function logoutAccount() {
    if (sessionRef.current?.sessionStorageKey) {
      window.sessionStorage.removeItem(sessionRef.current.sessionStorageKey);
    }
    const workspaceSlug = sessionRef.current?.workspaceSlug ?? accountState.workspaceSlug;
    sessionRef.current = null;
    versionsRef.current = {};
    auditRevisionRef.current = 0;
    setReviews({});
    setTeamState(DEFAULT_TEAM_STATE);
    setAuditState(DEFAULT_AUDIT_STATE);
    setLearningState(DEFAULT_LEARNING_STATE);
    setSyncState({
      mode: 'server',
      status: 'auth_required',
      label: '계정 로그인 필요',
      detail: '로그아웃되었습니다.',
      tenantName: '',
      lastSavedAt: '',
    });
    setAccountState({
      authMode: 'account',
      status: 'idle',
      requiresLogin: true,
      workspaceSlug,
      error: '',
      notice: '',
    });
  }

  async function createMemberAccount(input) {
    if (!sessionRef.current?.token) return false;
    setAccountState((current) => ({ ...current, status: 'member_loading', error: '' }));
    try {
      const result = await requestJson('/api/members', {
        method: 'POST',
        headers: getAuthorizationHeaders(sessionRef.current.token),
        body: JSON.stringify(input),
      });
      setTeamState((current) => ({
        ...current,
        memberships: result.team?.memberships ?? current.memberships,
      }));
      setAccountState((current) => ({
        ...current,
        status: 'authenticated',
        error: '',
      }));
      markAuditStale();
      return true;
    } catch (error) {
      setAccountState((current) => ({
        ...current,
        status: 'error',
        error:
          error.code === 'USER_EXISTS'
            ? '이미 계정이 있는 이메일입니다.'
            : error.message || '멤버 계정을 만들지 못했습니다.',
      }));
      return false;
    }
  }

  async function changePassword(input) {
    if (!sessionRef.current?.token || !sessionRef.current?.sessionStorageKey) return false;
    setAccountState((current) => ({
      ...current,
      status: 'security_loading',
      error: '',
      notice: '',
    }));
    try {
      const result = await requestJson('/api/auth/change-password', {
        method: 'POST',
        headers: getAuthorizationHeaders(sessionRef.current.token),
        body: JSON.stringify(input),
      });
      sessionRef.current.token = result.token;
      window.sessionStorage.setItem(sessionRef.current.sessionStorageKey, result.token);
      setTeamState((current) => ({
        ...current,
        actor: result.actor ?? current.actor,
      }));
      setAccountState((current) => ({
        ...current,
        status: 'authenticated',
        error: '',
        notice: result.previousSessionsRevoked
          ? '비밀번호를 변경하고 이전 로그인 세션을 폐기했습니다.'
          : '비밀번호를 변경했습니다.',
      }));
      markAuditStale();
      return true;
    } catch (error) {
      setAccountState((current) => ({
        ...current,
        status: 'error',
        error:
          error.code === 'CURRENT_PASSWORD_INCORRECT'
            ? '현재 비밀번호가 맞지 않습니다.'
            : error.code === 'PASSWORD_UNCHANGED'
              ? '새 비밀번호는 현재 비밀번호와 달라야 합니다.'
              : error.message || '비밀번호를 변경하지 못했습니다.',
        notice: '',
      }));
      return false;
    }
  }

  function changeFeedbackRuleStage(reasonCode, action, expectedVersion = 0) {
    if (!sessionRef.current?.token) return;
    const normalizedReasonCode = String(reasonCode ?? '').trim().toUpperCase();
    setLearningState((current) => ({
      ...current,
      status: 'saving',
      actionReasonCode: normalizedReasonCode,
      notice: '',
      error: '',
    }));
    enqueueServerOperation(async () => {
      try {
        const result = await requestJson(
          `/api/feedback-rules/${encodeURIComponent(normalizedReasonCode)}/${action}`,
          {
            method: 'POST',
            headers: getAuthorizationHeaders(sessionRef.current?.token),
            body: JSON.stringify({ expectedVersion }),
          },
        );
        setLearningState({
          status: 'loaded',
          feedbackLearning: result.feedbackLearning ?? null,
          actionReasonCode: '',
          notice:
            action === 'promote'
              ? '감독 승격을 큐 우선순위에 반영했습니다.'
              : '규칙을 롤백하고 기존 큐 순서로 복원했습니다.',
          error: '',
        });
        markAuditStale();
      } catch (error) {
        setLearningState((current) => ({
          ...current,
          status: 'error',
          actionReasonCode: '',
          notice: '',
          error:
            error.code === 'FEEDBACK_RULE_VERSION_CONFLICT'
              ? '다른 창에서 규칙이 바뀌었습니다. 새로고침한 뒤 다시 결정합니다.'
              : error.code === 'FEEDBACK_RULE_NOT_SHADOW_ELIGIBLE'
                ? '아직 그림자 평가 조건을 충족하지 못했습니다.'
                : error.message || '규칙 상태를 바꾸지 못했습니다.',
        }));
      }
    });
  }

  function promoteFeedbackRule(reasonCode, expectedVersion) {
    changeFeedbackRuleStage(reasonCode, 'promote', expectedVersion);
  }

  function rollbackFeedbackRule(reasonCode, expectedVersion) {
    changeFeedbackRuleStage(reasonCode, 'rollback', expectedVersion);
  }

  async function loadAuditEvents(filters = {}) {
    if (!sessionRef.current?.token) {
      setAuditState((current) => ({
        ...current,
        status: 'error',
        error: '감사 이력을 보려면 서버 계정 또는 데모 세션이 필요합니다.',
      }));
      return false;
    }
    const query = new URLSearchParams({ limit: String(filters.limit ?? 200) });
    if (filters.candidateId) query.set('candidateId', filters.candidateId);
    if (filters.action) query.set('action', filters.action);
    if (filters.actorId) query.set('actorId', filters.actorId);
    const requestedRevision = auditRevisionRef.current;
    setAuditState((current) => ({ ...current, status: 'loading', error: '' }));
    try {
      const result = await requestJson(`/api/audit?${query}`, {
        headers: getAuthorizationHeaders(sessionRef.current.token),
      });
      setAuditState({
        status: requestedRevision === auditRevisionRef.current ? 'loaded' : 'stale',
        tenant: result.tenant ?? null,
        filters: result.filters ?? {},
        events: result.events ?? [],
        eventCount: result.eventCount ?? result.events?.length ?? 0,
        loadedAt: result.generatedAt ?? new Date().toISOString(),
        error: '',
      });
      return true;
    } catch (error) {
      setAuditState((current) => ({
        ...current,
        status: 'error',
        error: error.message || '기관 감사 이력을 불러오지 못했습니다.',
      }));
      return false;
    }
  }

  async function analyzeRoadview(candidateId, directionKey = 'focus') {
    if (!sessionRef.current?.token) {
      const error = new Error('온라인 서버 세션이 없어 로드뷰 이미지 분석을 시작할 수 없습니다.');
      error.code = 'ONLINE_VISION_REQUIRED';
      throw error;
    }
    return requestJson(`/api/roadview-vision/${encodeURIComponent(candidateId)}/analyze`, {
      method: 'POST',
      headers: getAuthorizationHeaders(sessionRef.current.token),
      body: JSON.stringify({ directionKey }),
    });
  }

  return [
    reviews,
    setReview,
    resetReviews,
    syncState,
    {
      ...teamState,
      claimCandidate,
      releaseCandidate,
      submitSecondReview,
      submitFieldVerification,
      analyzeRoadview,
      requestEntranceApi,
    },
    {
      ...accountState,
      loginAccount,
      bootstrapAccount,
      logoutAccount,
      createMemberAccount,
      changePassword,
    },
    {
      ...auditState,
      enabled: syncState.mode === 'server' && Boolean(sessionRef.current?.token),
      loadAuditEvents,
    },
    {
      ...learningState,
      promoteFeedbackRule,
      rollbackFeedbackRule,
    },
  ];
}
