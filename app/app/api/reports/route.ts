import { bindings, extensionFor, isCategory, validCoordinates } from '@/lib/report-store';

type ReportRow = {
  id: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  place: string;
  status: string;
  photo_key: string | null;
  created_at: number;
};

function serialize(row: ReportRow) {
  return {
    id: row.id,
    category: row.category,
    description: row.description,
    lat: row.latitude,
    lng: row.longitude,
    place: row.place,
    status: row.status,
    image: row.photo_key ? `/api/photo?key=${encodeURIComponent(row.photo_key)}` : undefined,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function sameOrigin(request: Request) {
  const origin = request.headers.get('Origin');
  return !origin || origin === new URL(request.url).origin;
}

async function clientHash(request: Request) {
  const source = request.headers.get('cf-connecting-ip') ?? 'local-preview';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function GET() {
  try {
    const { DB } = bindings();
    const result = await DB.prepare(`
      SELECT id, category, description, latitude, longitude, place, status, photo_key, created_at
      FROM reports
      ORDER BY created_at DESC
      LIMIT 200
    `).all<ReportRow>();
    return Response.json({ reports: (result.results ?? []).map(serialize) }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return Response.json({ error: '현장 기록을 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: '허용되지 않은 요청입니다.' }, { status: 403 });
  }

  try {
    const contentType = request.headers.get('Content-Type') ?? '';
    let category: unknown;
    let description: unknown;
    let latitude: unknown;
    let longitude: unknown;
    let place: unknown;
    let photo: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      category = form.get('category');
      description = form.get('description');
      latitude = form.get('lat');
      longitude = form.get('lng');
      place = form.get('place');
      const uploaded = form.get('photo');
      photo = uploaded instanceof File && uploaded.size > 0 ? uploaded : null;
    } else {
      const body = await request.json() as Record<string, unknown>;
      category = body.category;
      description = body.description;
      latitude = body.lat;
      longitude = body.lng;
      place = body.place;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!isCategory(category) || !validCoordinates(lat, lng)) {
      return Response.json({ error: '신고 유형과 위치를 확인해 주세요.' }, { status: 400 });
    }
    if (typeof place !== 'string' || !place.trim() || place.length > 120) {
      return Response.json({ error: '위치 이름을 120자 이내로 입력해 주세요.' }, { status: 400 });
    }
    const safeDescription = typeof description === 'string' ? description.trim().slice(0, 500) : '';

    const { DB, REPORT_PHOTOS } = bindings();
    const id = crypto.randomUUID();
    const now = Date.now();
    const requester = await clientHash(request);
    const recent = await DB.prepare(
      'SELECT COUNT(*) AS count FROM reports WHERE client_hash = ? AND created_at >= ?',
    ).bind(requester, now - 3_600_000).first<{ count: number }>();
    if ((recent?.count ?? 0) >= 10) {
      return Response.json({ error: '한 시간에 현장 기록은 10건까지 저장할 수 있습니다.' }, { status: 429 });
    }
    let photoKey: string | null = null;
    let photoContentType: string | null = null;

    if (photo) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      if (!allowedTypes.includes(photo.type) || photo.size > 10 * 1024 * 1024) {
        return Response.json({ error: 'JPG, PNG, WEBP, HEIC 사진은 10MB 이하만 저장할 수 있습니다.' }, { status: 400 });
      }
      photoContentType = photo.type;
      photoKey = `${id}.${extensionFor(photo.type)}`;
      await REPORT_PHOTOS.put(photoKey, await photo.arrayBuffer(), {
        httpMetadata: { contentType: photo.type },
        customMetadata: { reportId: id },
      });
    }

    try {
      await DB.prepare(`
        INSERT INTO reports (
          id, category, description, latitude, longitude, place, status,
          photo_key, photo_content_type, client_hash, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, '접수', ?, ?, ?, ?, ?)
      `).bind(
        id, category, safeDescription, lat, lng, place.trim(),
        photoKey, photoContentType, requester, now, now,
      ).run();
    } catch (error) {
      if (photoKey) await REPORT_PHOTOS.delete(photoKey);
      throw error;
    }

    return Response.json({
      report: serialize({
        id,
        category,
        description: safeDescription,
        latitude: lat,
        longitude: lng,
        place: place.trim(),
        status: '접수',
        photo_key: photoKey,
        created_at: now,
      }),
    }, { status: 201 });
  } catch {
    return Response.json({ error: '현장 기록을 저장하지 못했습니다.' }, { status: 500 });
  }
}
