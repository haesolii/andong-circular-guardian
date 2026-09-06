import { bindings, isStatus } from '@/lib/report-store';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: '허용되지 않은 요청입니다.' }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json() as { status?: unknown };
    if (!id || !isStatus(body.status)) {
      return Response.json({ error: '올바른 처리 상태가 필요합니다.' }, { status: 400 });
    }
    const { DB } = bindings();
    const result = await DB.prepare(
      'UPDATE reports SET status = ?, updated_at = ? WHERE id = ?',
    ).bind(body.status, Date.now(), id).run();
    if (!result.meta.changes) {
      return Response.json({ error: '현장 기록을 찾지 못했습니다.' }, { status: 404 });
    }
    return Response.json({ id, status: body.status });
  } catch {
    return Response.json({ error: '처리 상태를 변경하지 못했습니다.' }, { status: 500 });
  }
}
