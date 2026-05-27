import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const SYSTEM_INSTRUCTION = `당신은 한국어 메모 요약 전문가입니다.
주어진 메모를 간결하고 명확하게 3~5문장의 마크다운 형식으로 요약하세요.
핵심 포인트는 불릿으로 정리하고, 원문의 의도를 왜곡하지 마세요.
요약 외 부가 설명이나 머리말은 작성하지 마세요.`

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY가 설정되지 않았습니다.' },
      { status: 500 },
    )
  }

  let title: string | undefined
  let content: string | undefined
  try {
    const body = await req.json()
    title = body.title
    content = body.content
  } catch {
    return NextResponse.json(
      { error: '요청 본문을 파싱할 수 없습니다.' },
      { status: 400 },
    )
  }

  if (!content?.trim()) {
    return NextResponse.json(
      { error: '본문이 비어있습니다.' },
      { status: 400 },
    )
  }

  try {
    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `제목: ${title ?? '(제목 없음)'}\n\n본문:\n${content}`,
      config: { systemInstruction: SYSTEM_INSTRUCTION },
    })
    return NextResponse.json({ summary: response.text ?? '' })
  } catch (e) {
    console.error('Gemini 요약 실패:', e)
    return NextResponse.json(
      { error: '요약 생성에 실패했습니다.' },
      { status: 500 },
    )
  }
}
