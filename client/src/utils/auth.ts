export type JwtPayload = {
  sub?: string;
  email?: string;
  role?: string | string[];
  [key: string]: unknown;
};

export function parseJwt(token: string | null): JwtPayload | null {
  if (!token) return null;

  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;

    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );

    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isAdminToken(token: string | null): boolean {
  const payload = parseJwt(token);
  if (!payload) return false;

  const roleClaim =
    (payload[
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
    ] as string | string[] | undefined) ?? payload.role;

  if (Array.isArray(roleClaim)) return roleClaim.includes('Admin');
  return roleClaim === 'Admin';
}