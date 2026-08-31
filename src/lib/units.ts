export interface UnitLike {
  unit_id: number;
  nama: string;
  unit_tampil: string;
}

/**
 * Matching string user.role dengan nama / unit_alias dari b_ms_unit.
 */
export function findUnitByRole<T extends UnitLike>(units: T[], role: string): T | null {
  if (!role) return null;
  const lowerRole = role.toLowerCase().trim().replace(/^poli\s+/i, "");

  // 1. Match persis (tanpa prefiks 'poli ')
  const direct = units.find((u) => {
    const uName = u.nama.toLowerCase().replace(/^poli\s+/i, "").trim();
    const uAlias = u.unit_tampil.toLowerCase().replace(/^poli\s+/i, "").trim();
    return uName === lowerRole || uAlias === lowerRole;
  });
  if (direct) return direct;

  // 2. Match substring / fuzzy
  return (
    units.find((u) => {
      const uName = u.nama.toLowerCase();
      const uAlias = u.unit_tampil.toLowerCase();
      return (
        uName.includes(lowerRole) ||
        lowerRole.includes(uName) ||
        uAlias.includes(lowerRole) ||
        lowerRole.includes(uAlias)
      );
    }) ?? null
  );
}
