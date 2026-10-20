import { useState } from 'react';

export default function AccountSecurityPanel({ account }) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [localError, setLocalError] = useState('');
  const loading = account.status === 'security_loading';

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setLocalError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setLocalError('새 비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    const changed = await account.changePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
    if (changed) {
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setLocalError('');
    }
  }

  return (
    <section className="account-security-panel" aria-label="계정 보안">
      <div>
        <strong>비밀번호와 로그인 세션</strong>
        <p>비밀번호를 바꾸면 이 브라우저를 제외한 이전 로그인 세션이 즉시 만료됩니다.</p>
      </div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="security-current-password">현재 비밀번호</label>
        <input
          id="security-current-password"
          type="password"
          minLength={10}
          maxLength={128}
          value={form.currentPassword}
          onChange={(event) => updateField('currentPassword', event.target.value)}
          autoComplete="current-password"
          required
        />
        <label htmlFor="security-new-password">새 비밀번호</label>
        <input
          id="security-new-password"
          type="password"
          minLength={10}
          maxLength={128}
          value={form.newPassword}
          onChange={(event) => updateField('newPassword', event.target.value)}
          autoComplete="new-password"
          required
        />
        <label htmlFor="security-confirm-password">새 비밀번호 확인</label>
        <input
          id="security-confirm-password"
          type="password"
          minLength={10}
          maxLength={128}
          value={form.confirmPassword}
          onChange={(event) => updateField('confirmPassword', event.target.value)}
          autoComplete="new-password"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? '변경 중' : '비밀번호 변경'}
        </button>
      </form>
      {(localError || account.error) && (
        <p className="account-security-error" role="alert">{localError || account.error}</p>
      )}
      {account.notice && <p className="account-security-notice" role="status">{account.notice}</p>}
    </section>
  );
}
