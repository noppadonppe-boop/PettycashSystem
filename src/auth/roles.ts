export const USER_ROLES = [
  // Existing roles already used in this project
  'MD',
  'GM',
  'PM',
  'AccountPay',
  'SiteAdmin',
  'CM',

  'Staff',
  'ppeTeam',
  'ppeLeader',
  'ppeManager',
  'Requestors',
  'Eng',
  'SenEng',
  'Arch',
  'SenArch',
  'ppeAdmin',
  'MasterAdmin',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function normalizeRoles(input: unknown): UserRole[] {
  if (Array.isArray(input)) {
    return input.filter((r): r is UserRole => USER_ROLES.includes(r as UserRole));
  }
  if (typeof input === 'string' && USER_ROLES.includes(input as UserRole)) return [input as UserRole];
  return [];
}

export function hasAnyRole(userRoles: UserRole[] | undefined | null, required?: UserRole[]) {
  if (!required || required.length === 0) return true;
  const set = new Set(userRoles ?? []);
  return required.some((r) => set.has(r));
}
