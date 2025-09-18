import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { problem, keyword, metaphor } = await request.json()

    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
      prompt: `다음 세 요소를 창의적으로 조합하여 혁신적인 아이디어나 해결책을 한국어로 2-3문장으로 제안해주세요:

문제: ${problem}
키워드: ${keyword}  
메타포: ${metaphor}

창의적이고 실용적인 관점에서 이 세 요소가 어떻게 연결될 수 있는지 설명해주세요.`,
      maxTokens: 200,
    })

    return Response.json({ description: text })
  } catch (error) {
    console.error("Error generating description:", error)
    return Response.json({ error: "Failed to generate description" }, { status: 500 })
  }
}
