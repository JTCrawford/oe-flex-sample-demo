/**
 * Same-origin proxy for Mapzen/AWS terrarium elevation tiles.
 * The public bucket does not send CORS headers, so the browser cannot decode
 * pixels directly. This function only fetches that fixed host and path.
 */

const TILE_HOST = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium';

function tileParams(url: string): { z: number; x: number; y: number } | null {
  const params = new URL(url).searchParams;
  const z = Number(params.get('z'));
  const x = Number(params.get('x'));
  const y = Number(params.get('y'));
  if (!Number.isInteger(z) || z < 0 || z > 15) return null;
  const n = 2 ** z;
  if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
  if (x < 0 || y < 0 || x >= n || y >= n) return null;
  return { z, x, y };
}

export async function GET(request: Request): Promise<Response> {
  const tile = tileParams(request.url);
  if (!tile) {
    return new Response('bad tile', { status: 400 });
  }
  const upstream = await fetch(`${TILE_HOST}/${tile.z}/${tile.x}/${tile.y}.png`, {
    headers: { 'User-Agent': 'ThreatTec-OEFlex-demo/1.0' },
  });
  if (!upstream.ok) {
    return new Response('tile missing', {
      status: upstream.status,
      headers: { 'Cache-Control': 'public, max-age=300' },
    });
  }
  const bytes = await upstream.arrayBuffer();
  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=604800',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
