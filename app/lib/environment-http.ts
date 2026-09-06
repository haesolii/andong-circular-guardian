const fieldOrigin = 'https://deulnyeok-field.roy919491.chatgpt.site';
export function allowedOrigin(request: Request) {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  const url = new URL(request.url);
  return (
    origin === url.origin ||
    origin === fieldOrigin ||
    (['localhost', '127.0.0.1'].includes(url.hostname) &&
      ['http://localhost:3001', 'http://localhost:3000'].includes(origin))
  );
}
export function corsHeaders(request: Request) {
  const headers: Record<string, string> = {
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };
  const origin = request.headers.get('Origin');
  if (origin && allowedOrigin(request)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
  }
  return headers;
}
export function jsonResponse(request: Request, body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders(request) });
}
export function preflight(request: Request) {
  return new Response(null, {
    status: allowedOrigin(request) ? 204 : 403,
    headers: corsHeaders(request),
  });
}
