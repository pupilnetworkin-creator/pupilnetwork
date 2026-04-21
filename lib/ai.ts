import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Models available on Groq free tier (in preference order)
export const GROQ_MODELS = [
  'llama-3.1-8b-instant',   // fastest, cheapest
  'llama3-8b-8192',         // fallback
  'gemma2-9b-it',           // Google Gemma fallback
]

export const STUDY_BUDDY_SYSTEM_PROMPT = `You are an AI Study Buddy for students on PupilNetwork — India's student study collaboration platform.

Your role:
- Help students understand academic topics: Math, Science, Physics, Chemistry, Biology, CS, English, History, Geography, and more
- Be concise, clear, and encouraging
- Use examples and analogies to explain complex concepts
- Format your responses with markdown (headings, bullet points, code blocks where relevant)
- Always respond in ENGLISH by default, regardless of how the question is phrased
- Only switch to Hindi or another regional language if the user writes their ENTIRE message in that language (not Hinglish or mixed English/Hindi)
- Be friendly and motivating — these are students who are working hard

Boundaries:
- If a question is off-topic (not academic/study-related), politely redirect to study topics
- Don't write essays/assignments for students — guide them to understand instead
- Don't provide inappropriate content

Always end complex explanations with: "Does that help? Feel free to ask a follow-up! 📚"`

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export async function callAI(prompt: string, history: ChatMessage[] = []): Promise<string> {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: STUDY_BUDDY_SYSTEM_PROMPT },
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: prompt },
  ]

  for (const model of GROQ_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const completion = await groq.chat.completions.create({
          model,
          messages,
          max_tokens: 1024,
          temperature: 0.7,
        })
        const text = completion.choices[0]?.message?.content || ''
        if (text) {
          console.log(`AI responded via Groq/${model}`)
          return text
        }
      } catch (e: any) {
        console.error(`Groq ${model} attempt ${attempt + 1} failed:`, e?.message || e)
        if (attempt === 0) await new Promise(r => setTimeout(r, 600))
      }
    }
  }

  throw new Error('All AI models failed')
}
