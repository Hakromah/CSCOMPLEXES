/**
 * Generates a structured 9-character user ID in the format:
 *   [FirstInitial][LastInitial][YY][NNNNN]
 *
 * Examples:
 *   Amara Camara  (2026) → AC2600001
 *   Fatumata Bamba (2026) → FB2600001
 *   (second Fatumata Bamba same year) → FB2600002
 *
 * Uses a raw DB LIKE query to reliably find the next sequence number,
 * regardless of the Strapi field type (uid / string).
 */
export async function generateUserId(
  firstName: string,
  lastName: string,
  registrationYear?: number
): Promise<string> {
  const year = registrationYear ?? new Date().getFullYear();

  // Build the 4-char prefix: [FI][LI][YY]  e.g. "HK26"
  const fi = (firstName?.[0] ?? 'X').toUpperCase().replace(/[^A-Z]/g, 'X');
  const li = (lastName?.[0] ?? 'X').toUpperCase().replace(/[^A-Z]/g, 'X');
  const yy = String(year).slice(-2);
  const prefix = `${fi}${li}${yy}`;

  // Use strapi.db.query so we get full SQL LIKE support,
  // which works reliably on 'uid' field types too.
  const existing = await strapi.db.query('plugin::users-permissions.user').findMany({
    where: { userId: { $startsWith: prefix } },
    select: ['userId'],
  }) as Array<{ userId: string }>;

  // Find the highest existing sequence for this prefix+year
  let maxSeq = 0;
  for (const user of existing) {
    const tail = user.userId?.slice(4); // everything after the 4-char prefix
    const seq = parseInt(tail ?? '0', 10);
    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
  }

  const nextSeq = maxSeq + 1;
  return `${prefix}${String(nextSeq).padStart(5, '0')}`;
}
