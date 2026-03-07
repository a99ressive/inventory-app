import type { Inventory } from '../types';
import { isAdminToken, parseJwt } from './auth';

const NAME_IDENTIFIER_CLAIM =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

export type InventoryRole = 'owner' | 'admin' | 'writer' | 'reader';

export interface InventoryPermissions {
  role: InventoryRole;
  isAuthenticated: boolean;
  canWriteItems: boolean;
  canEditGeneral: boolean;
  canEditCustomId: boolean;
  canManageAccess: boolean;
  canEditFields: boolean;
  canPostDiscussion: boolean;
}

function getCurrentUserId(token: string | null): string | null {
  const payload = parseJwt(token);
  if (!payload) return null;

  const fromNameIdentifier = payload[NAME_IDENTIFIER_CLAIM];
  if (typeof fromNameIdentifier === 'string' && fromNameIdentifier.length > 0) {
    return fromNameIdentifier;
  }

  if (typeof payload.sub === 'string' && payload.sub.length > 0) {
    return payload.sub;
  }

  return null;
}

export function resolveInventoryPermissions(
  inventory: Inventory,
  token: string | null
): InventoryPermissions {
  const currentUserId = getCurrentUserId(token);
  const isAuthenticated = Boolean(token && currentUserId);
  const isAdmin = isAdminToken(token);

  let role: InventoryRole = 'reader';
  if (isAdmin) {
    role = 'admin';
  } else if (isAuthenticated && currentUserId === inventory.OwnerId) {
    role = 'owner';
  } else if (isAuthenticated && inventory.CanWrite) {
    role = 'writer';
  }

  const canManageInventory = role === 'owner' || role === 'admin';

  return {
    role,
    isAuthenticated,
    canWriteItems: role !== 'reader',
    canEditGeneral: canManageInventory,
    canEditCustomId: canManageInventory,
    canManageAccess: canManageInventory,
    canEditFields: canManageInventory,
    canPostDiscussion: isAuthenticated,
  };
}
