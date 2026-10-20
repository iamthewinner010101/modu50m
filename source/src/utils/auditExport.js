function csvCell(value) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

export function buildAuditExportPayload(audit) {
  const events = Array.isArray(audit?.events) ? audit.events : [];
  return {
    schema: 'modu50m.tenant_audit_export.v1',
    exportedAt: new Date().toISOString(),
    tenant: audit?.tenant ?? null,
    filters: audit?.filters ?? {},
    eventCount: events.length,
    events,
  };
}

export function buildAuditExportJson(audit) {
  return `${JSON.stringify(buildAuditExportPayload(audit), null, 2)}\n`;
}

export function buildAuditExportCsv(audit) {
  const events = Array.isArray(audit?.events) ? audit.events : [];
  const rows = [
    [
      'event_id',
      'created_at',
      'actor_id',
      'actor_name',
      'action',
      'candidate_id',
      'before_json',
      'after_json',
    ],
    ...events.map((event) => [
      event.id,
      event.createdAt,
      event.actorId,
      event.actorDisplayName,
      event.action,
      event.candidateId,
      event.before == null ? '' : JSON.stringify(event.before),
      event.after == null ? '' : JSON.stringify(event.after),
    ]),
  ];
  return `\ufeff${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}
