const categories = [
  '폐비닐',
  '폐농약 용기',
  '폐농자재',
  '과수 전정가지',
  '볏짚',
  '고춧대',
  '불법소각',
  '불법투기',
  '기타 농업부산물',
] as const;

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Gemini API가 설정되지 않았습니다.' }, { status: 503 });
    }

    const body = await request.json() as { image?: string };
    const match = body.image?.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
    if (!match) {
      return Response.json({ error: '지원하지 않는 이미지 형식입니다.' }, { status: 400 });
    }

    const [, mimeType, data] = match;
    if (data.length > 14_000_000) {
      return Response.json({ error: '이미지는 10MB 이하만 분석할 수 있습니다.' }, { status: 413 });
    }

    const prompt = [
      '이 사진은 경북 안동시 농촌 환경 신고 앱에 접수된 현장 사진이다.',
      `반드시 다음 유형 중 하나로만 분류하라: ${categories.join(', ')}.`,
      '사진에 여러 대상이 있으면 환경 위험이 가장 큰 대상을 우선한다.',
      'confidence는 0부터 100 사이의 정수로 작성하고, reason은 한국어 한 문장으로 간결하게 작성하라.',
    ].join('\n');

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data } }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                category: { type: 'STRING', enum: categories },
                confidence: { type: 'INTEGER', minimum: 0, maximum: 100 },
                reason: { type: 'STRING' },
              },
              required: ['category', 'confidence', 'reason'],
            },
          },
        }),
      },
    );

    if (!response.ok) {
      return Response.json({ error: 'AI 분석을 완료하지 못했습니다.' }, { status: 502 });
    }

    const gemini = await response.json() as GeminiResponse;
    const text = gemini.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
    if (!text) {
      return Response.json({ error: 'AI 분석 결과가 비어 있습니다.' }, { status: 502 });
    }

    const result = JSON.parse(text) as { category?: string; confidence?: number; reason?: string };
    if (!result.category || !categories.includes(result.category as typeof categories[number])) {
      return Response.json({ error: 'AI가 신고 유형을 확정하지 못했습니다.' }, { status: 502 });
    }

    return Response.json({
      category: result.category,
      confidence: Math.max(0, Math.min(100, Math.round(Number(result.confidence) || 0))),
      reason: String(result.reason || '사진 속 주요 대상을 기준으로 분류했습니다.'),
    });
  } catch {
    return Response.json({ error: '이미지 분석 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
