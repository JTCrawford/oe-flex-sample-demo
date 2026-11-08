/**
 * Client spend guard for Google Photorealistic 3D Tiles root requests.
 * One claim per page load. The tileset object is cached separately so
 * toggling the layer does not claim again.
 */

export const CLIENT_DAILY_CAP = 3;
export const PHOTOREAL_DAILY_CAP_NOTE = 'Photoreal 3D paused (daily limit)';
const STORAGE_KEY = 'oe-flex-google-3d-root-sessions';

export interface CountStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

let claimedThisPage = false;

export function utcDay(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function readDailyCount(storage: CountStore, now = new Date()): number {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { day?: unknown; count?: unknown };
    if (parsed.day !== utcDay(now)) return 0;
    const count = typeof parsed.count === 'number' ? parsed.count : Number(parsed.count);
    if (!Number.isFinite(count) || count < 0) return 0;
    return Math.floor(count);
  } catch {
    return 0;
  }
}

/** True when this browser already used its root sessions for the UTC day. */
export function dailyCapReached(storage: CountStore, now = new Date()): boolean {
  if (claimedThisPage) return false;
  return readDailyCount(storage, now) >= CLIENT_DAILY_CAP;
}

/**
 * Record one root session for today. A repeat call in the same page returns
 * true without incrementing, so a cached tileset can be shown again.
 */
export function claimClientRootSession(storage: CountStore, now = new Date()): boolean {
  if (claimedThisPage) return true;
  const count = readDailyCount(storage, now);
  if (count >= CLIENT_DAILY_CAP) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ day: utcDay(now), count: count + 1 }));
  } catch {
    return false;
  }
  claimedThisPage = true;
  return true;
}

export class GoogleCapError extends Error {
  constructor() {
    super(PHOTOREAL_DAILY_CAP_NOTE);
    this.name = 'GoogleCapError';
  }
}

export interface ServerSessionDecision {
  allowed: boolean;
  enforced: 'kv' | 'google-cloud-quota';
}

/**
 * Ask the server before the first root request of this page.
 * The result is remembered so toggle and scenario changes do not POST again.
 * A transport failure fails open: the Google Cloud daily quota remains the hard cap.
 * An explicit refusal fails closed.
 */
let serverDecision: ServerSessionDecision | null = null;

export async function reserveServerSession(
  fetchImpl: typeof fetch = fetch,
): Promise<ServerSessionDecision> {
  if (serverDecision) return serverDecision;
  try {
    const response = await fetchImpl('/api/tiles-session', { method: 'POST' });
    if (!response.ok) {
      serverDecision = { allowed: true, enforced: 'google-cloud-quota' };
      return serverDecision;
    }
    const body = (await response.json()) as { allowed?: boolean; enforced?: string };
    const enforced = body.enforced === 'kv' ? 'kv' : 'google-cloud-quota';
    serverDecision = { allowed: body.allowed !== false, enforced };
    return serverDecision;
  } catch {
    serverDecision = { allowed: true, enforced: 'google-cloud-quota' };
    return serverDecision;
  }
}
