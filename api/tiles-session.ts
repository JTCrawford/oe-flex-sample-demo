/**
 * Optional hard cap for Google Photorealistic 3D Tiles root sessions.
 *
 * A linked Vercel KV / Upstash REST store (KV_REST_API_URL + KV_REST_API_TOKEN,
 * or the UPSTASH_REDIS_REST_* names) counts at most 500 root sessions per UTC day.
 * Those variables are not in the repo. With no store, this route does not count
 * and reports that the hard cap is the Google Cloud quota instead.
 */

const SERVER_DAILY_CAP = 500;

interface KvRest {
  url: string;
  token: string;
}

function kvRest(): KvRest | null {
  const url = (process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? '').trim();
  const token = (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? '').trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ''), token };
}

function utcDay(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function secondsUntilUtcMidnight(now = Date.now()): number {
  const date = new Date(now);
  const next = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1);
  return Math.max(60, Math.ceil((next - now) / 1000));
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

async function redisCommand(kv: KvRest, command: string[]): Promise<number> {
  const response = await fetch(kv.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${kv.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error(`kv ${response.status}`);
  const body = (await response.json()) as { result?: unknown };
  const value = typeof body.result === 'number' ? body.result : Number(body.result);
  if (!Number.isFinite(value)) throw new Error('kv result');
  return value;
}

export async function POST(): Promise<Response> {
  const kv = kvRest();
  if (!kv) {
    return json({
      allowed: true,
      enforced: 'google-cloud-quota',
      limit: SERVER_DAILY_CAP,
    });
  }

  const key = `oe-flex:google-3d-roots:${utcDay()}`;
  try {
    const count = await redisCommand(kv, ['INCR', key]);
    if (count === 1) {
      await redisCommand(kv, ['EXPIRE', key, String(secondsUntilUtcMidnight()), 'NX']);
    }
    if (count > SERVER_DAILY_CAP) {
      await redisCommand(kv, ['DECR', key]);
      return json({ allowed: false, enforced: 'kv', limit: SERVER_DAILY_CAP });
    }
    return json({ allowed: true, enforced: 'kv', limit: SERVER_DAILY_CAP, count });
  } catch {
    return json({ allowed: false, enforced: 'kv', limit: SERVER_DAILY_CAP });
  }
}
