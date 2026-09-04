type KakaoAddressResponse = {
  documents?: Array<{
    road_address?: { address_name?: string } | null;
    address?: { address_name?: string } | null;
  }>;
};

export async function GET(request: Request) {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    return Response.json({ error: '카카오 위치 API가 설정되지 않았습니다.' }, { status: 503 });
  }

  const url = new URL(request.url);
  const lat = Number(url.searchParams.get('lat'));
  const lng = Number(url.searchParams.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return Response.json({ error: '올바른 좌표가 필요합니다.' }, { status: 400 });
  }

  try {
    const kakaoUrl = new URL('https://dapi.kakao.com/v2/local/geo/coord2address.json');
    kakaoUrl.searchParams.set('x', String(lng));
    kakaoUrl.searchParams.set('y', String(lat));
    kakaoUrl.searchParams.set('input_coord', 'WGS84');
    const response = await fetch(kakaoUrl, {
      headers: { Authorization: `KakaoAK ${apiKey}` },
    });
    if (!response.ok) {
      return Response.json({ place: '현재 위치' });
    }

    const data = await response.json() as KakaoAddressResponse;
    const document = data.documents?.[0];
    const place = document?.road_address?.address_name || document?.address?.address_name || '현재 위치';
    return Response.json({ place });
  } catch {
    return Response.json({ place: '현재 위치' });
  }
}
