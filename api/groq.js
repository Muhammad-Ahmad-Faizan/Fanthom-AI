export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!process.env.GROQ_API_KEY) {
    response.status(503).json({ error: 'Add GROQ_API_KEY to the deployment environment to enable Ask Rally.' })
    return
  }

  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify(request.body),
    })
    response.status(upstream.status).setHeader('Content-Type', 'application/json').send(await upstream.text())
  } catch {
    response.status(502).json({ error: 'Groq could not be reached.' })
  }
}