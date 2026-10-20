import { useState } from 'react';

export default function AccountAccessPanel({ account }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    workspaceSlug: account.workspaceSlug || 'codefair-judge',
    organizationName: '',
    displayName: '',
    email: '',
    password: '',
  });
  const loading = account.status === 'loading';

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (mode === 'login') {
      await account.loginAccount({
        workspaceSlug: form.workspaceSlug,
        email: form.email,
        password: form.password,
      });
      return;
    }
    await account.bootstrapAccount(form);
  }

  function openJudgeDemo() {
    const url = new URL(window.location.href);
    url.searchParams.delete('auth');
    url.searchParams.set('workspace', 'codefair-judge');
    url.searchParams.set('actor', '코드페어 심사위원');
    url.searchParams.delete('role');
    window.location.assign(url);
  }

  return (
    <main className="account-access-shell">
      <section className="account-access-panel" aria-label="모두의 50m 기관 계정">
        <header>
          <p>모두의 50m</p>
          <h1>{mode === 'login' ? '기관 검수함 로그인' : '새 기관 만들기'}</h1>
          <span>사람 행동 인박스</span>
        </header>

        <div className="account-mode-tabs" role="tablist" aria-label="계정 시작 방식">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            로그인
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'bootstrap'}
            className={mode === 'bootstrap' ? 'active' : ''}
            onClick={() => setMode('bootstrap')}
          >
            기관 만들기
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'bootstrap' && (
            <>
              <label htmlFor="account-organization-name">기관 이름</label>
              <input
                id="account-organization-name"
                value={form.organizationName}
                onChange={(event) => updateField('organizationName', event.target.value)}
                autoComplete="organization"
                required
              />
            </>
          )}

          <label htmlFor="account-workspace-slug">기관 주소</label>
          <div className="account-slug-input">
            <span>/</span>
            <input
              id="account-workspace-slug"
              value={form.workspaceSlug}
              onChange={(event) => updateField('workspaceSlug', event.target.value.toLowerCase())}
              pattern={'[a-z0-9][a-z0-9\\-]{2,47}'}
              autoComplete="organization-title"
              required
            />
          </div>

          {mode === 'bootstrap' && (
            <>
              <label htmlFor="account-display-name">이름</label>
              <input
                id="account-display-name"
                value={form.displayName}
                onChange={(event) => updateField('displayName', event.target.value)}
                autoComplete="name"
                required
              />
            </>
          )}

          <label htmlFor="account-email">이메일</label>
          <input
            id="account-email"
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="account-password">비밀번호</label>
          <input
            id="account-password"
            type="password"
            minLength={10}
            maxLength={128}
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />

          {account.error && <p className="account-form-error" role="alert">{account.error}</p>}

          <button className="account-submit" type="submit" disabled={loading}>
            {loading ? '확인 중' : mode === 'login' ? '검수함 열기' : '기관 생성하고 시작'}
          </button>
        </form>

        <button className="account-demo-link" type="button" onClick={openJudgeDemo}>
          코드페어 심사 데모 열기
        </button>
      </section>
    </main>
  );
}
