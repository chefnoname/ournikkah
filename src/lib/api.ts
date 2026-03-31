// Shared API endpoint definitions
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const api = {
  auth: {
    register: { method: 'POST' as const, path: '/api/register' },
    login: { method: 'POST' as const, path: '/api/login' },
    logout: { method: 'POST' as const, path: '/api/logout' },
    me: { method: 'GET' as const, path: '/api/user' },
  },
  guest: {
    start: { method: 'POST' as const, path: '/api/guest/start' },
    workspace: { method: 'GET' as const, path: '/api/guest/workspace' },
    onboarding: { method: 'PUT' as const, path: '/api/guest/onboarding' },
  },
  workspaces: {
    list: { method: 'GET' as const, path: '/api/workspaces' },
    create: { method: 'POST' as const, path: '/api/workspaces' },
    get: { method: 'GET' as const, path: '/api/workspaces/:id' },
    update: { method: 'PUT' as const, path: '/api/workspaces/:id' },
    settings: { method: 'PATCH' as const, path: '/api/workspaces/:id/settings' },
    invite: { method: 'POST' as const, path: '/api/workspaces/:id/invite' },
    members: { method: 'GET' as const, path: '/api/workspaces/:id/members' },
    summary: { method: 'GET' as const, path: '/api/workspaces/:id/summary' },
  },
  directory: {
    list: { method: 'GET' as const, path: '/api/directory' },
    get: { method: 'GET' as const, path: '/api/directory/:id' },
    seed: { method: 'POST' as const, path: '/api/admin/seed-directory' },
  },
  savedVendors: {
    list: { method: 'GET' as const, path: '/api/workspaces/:id/saved-vendors' },
    save: { method: 'POST' as const, path: '/api/workspaces/:id/saved-vendors' },
    remove: { method: 'DELETE' as const, path: '/api/workspaces/:id/saved-vendors/:vendorId' },
    updateStatus: { method: 'PATCH' as const, path: '/api/workspaces/:id/saved-vendors/:vendorItemId/status' },
  },
  budget: {
    list: { method: 'GET' as const, path: '/api/workspaces/:id/budget' },
    create: { method: 'POST' as const, path: '/api/workspaces/:id/budget' },
    update: { method: 'PUT' as const, path: '/api/workspaces/:id/budget/:itemId' },
    delete: { method: 'DELETE' as const, path: '/api/workspaces/:id/budget/:itemId' },
  },
  guestInvites: {
    list: { method: 'GET' as const, path: '/api/workspaces/:id/guest-invites' },
    create: { method: 'POST' as const, path: '/api/workspaces/:id/guest-invites' },
    update: { method: 'PUT' as const, path: '/api/workspaces/:id/guest-invites/:inviteId' },
    delete: { method: 'DELETE' as const, path: '/api/workspaces/:id/guest-invites/:inviteId' },
  },
  invite: {
    validate: { method: 'GET' as const, path: '/api/invite/:code' },
    accept: { method: 'POST' as const, path: '/api/invite/:code/accept' },
  },
  notes: {
    list: { method: 'GET' as const, path: '/api/workspaces/:workspaceId/notes' },
    create: { method: 'POST' as const, path: '/api/notes' },
    update: { method: 'PUT' as const, path: '/api/notes/:id' },
    delete: { method: 'DELETE' as const, path: '/api/notes/:id' },
  },
  vendors: {
    list: { method: 'GET' as const, path: '/api/workspaces/:workspaceId/vendors' },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}

export function toAbsoluteUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
