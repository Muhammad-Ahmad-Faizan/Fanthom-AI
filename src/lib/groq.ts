export async function askGroq(question: string, meetingContext: string) {
  const response = await fetch('/api/groq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 260,
      messages: [
        { role: 'system', content: 'You are Rally, a concise meeting intelligence assistant. Answer only from the supplied meeting context. If the answer is not in the context, say that clearly.' },
        { role: 'user', content: `Meeting context:\n${meetingContext}\n\nQuestion: ${question}` },
      ],
    }),
  })

  const data = await response.json() as { choices?: { message?: { content?: string } }[]; error?: string }
  if (!response.ok) throw new Error(data.error || 'Groq request failed')
  return data.choices?.[0]?.message?.content || 'Rally could not find an answer in this meeting.'
}