import { useState } from 'react';
import AccountSecurityPanel from './AccountSecurityPanel';

const ROLE_LABELS = {
  supervisor: '감독',
  reviewer: '검수자',
  read_only: '읽기 전용',
};

export default function TeamMemberManager({ account, team }) {
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    role: 'reviewer',
  });
  const canCreateMember =
    team.actor?.accountType === 'password' && team.actor?.role === 'supervisor';

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const created = await account.createMemberAccount(form);
    if (created) {
      setForm({ displayName: '', email: '', password: '', role: 'reviewer' });
    }
  }

  return (
    <details className="team-member-manager">
      <summary>
        팀 멤버
        <span>{team.memberships?.length ?? 0}명</span>
      </summary>
      <div className="team-member-list" aria-label="현재 팀 멤버">
        {(team.memberships ?? []).map((member) => (
          <div key={member.actorId}>
            <strong>{member.displayName}</strong>
            <span>{ROLE_LABELS[member.role] ?? member.role}</span>
          </div>
        ))}
      </div>

      {canCreateMember && (
        <form className="team-member-form" onSubmit={handleSubmit}>
          <label htmlFor="member-display-name">이름</label>
          <input
            id="member-display-name"
            value={form.displayName}
            onChange={(event) => updateField('displayName', event.target.value)}
            autoComplete="off"
            required
          />
          <label htmlFor="member-email">이메일</label>
          <input
            id="member-email"
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            autoComplete="off"
            required
          />
          <label htmlFor="member-role">역할</label>
          <select
            id="member-role"
            value={form.role}
            onChange={(event) => updateField('role', event.target.value)}
          >
            <option value="reviewer">검수자</option>
            <option value="supervisor">감독</option>
            <option value="read_only">읽기 전용</option>
          </select>
          <label htmlFor="member-password">임시 비밀번호</label>
          <input
            id="member-password"
            type="password"
            minLength={10}
            maxLength={128}
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
            autoComplete="new-password"
            required
          />
          <button type="submit" disabled={account.status === 'member_loading'}>
            {account.status === 'member_loading' ? '추가 중' : '멤버 계정 추가'}
          </button>
        </form>
      )}

      {account.error && <p className="team-member-error" role="alert">{account.error}</p>}
      {team.actor?.accountType === 'password' && <AccountSecurityPanel account={account} />}
    </details>
  );
}
