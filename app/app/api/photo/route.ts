import { bindings } from '@/lib/report-store';

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key');
  if (!key || !/^[0-9a-f-]{36}\.(jpg|png|webp|heic|heif)$/i.test(key)) {
    return new Response('Not found', { status: 404 });
  }

  const object = await bindings().REPORT_PHOTOS.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(object.body, { headers });
}
