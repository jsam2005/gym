/**
 * Normalize rows from the local middleware API so /clients, dashboard, and billing
 * use the same filter + dedupe rules. Rows missing id fields still get a stable key
 * (name + phone + email, or row index) so they are not dropped from the count.
 */
export function normalizeLocalApiClientsForList(clients: any[]): any[] {
  if (!Array.isArray(clients)) return [];

  // Keep sparse entries; only drop null / non-objects so “empty” clients still count.
  const rows = clients.filter((c) => c != null && typeof c === 'object');

  const filtered = rows.filter((c: any) => {
    const fullName = `${c?.firstName ?? ''} ${c?.lastName ?? ''}`;
    const name = String(c?.employeeName ?? c?.name ?? fullName).trim();
    const statusValue = String(c?.status ?? '').toLowerCase().trim();
    return !name.toLowerCase().startsWith('del_') && statusValue !== 'deleted' && statusValue !== 'delete';
  });

  const byKey = new Map<string, any>();
  filtered.forEach((c, index) => {
    const primary =
      String(c?.id ?? c?._id ?? c?.employeeId ?? '').trim() ||
      String(c?.employeeCodeInDevice ?? c?.esslUserId ?? c?.employeeCode ?? '').trim();

    const fullName = `${c?.firstName ?? ''} ${c?.lastName ?? ''}`;
    const name = String(c?.employeeName ?? c?.name ?? fullName).trim().toLowerCase();
    const phone = String(c?.phone ?? c?.contactNo ?? '').trim();
    const email = String(c?.email ?? '').trim().toLowerCase();

    const key =
      primary ||
      (name || phone || email ? `nk:${name}|${phone}|${email}` : `nk:row:${index}`);

    if (!byKey.has(key)) byKey.set(key, c);
  });

  return Array.from(byKey.values());
}
