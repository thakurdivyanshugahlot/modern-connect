type Listener = (data: any) => void;

const tenantListeners = new Map<string, Set<Listener>>();

export function subscribeTenant(tenantId: string, listener: Listener) {
  if (!tenantListeners.has(tenantId)) {
    tenantListeners.set(tenantId, new Set());
  }
  tenantListeners.get(tenantId)!.add(listener);

  return () => {
    tenantListeners.get(tenantId)?.delete(listener);
  };
}

export async function notifyTenant(tenantId: string, payload: any) {
  const listeners = tenantListeners.get(tenantId);
  if (!listeners) return;
  for (const listener of listeners) {
    listener(payload);
  }
}