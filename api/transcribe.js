export const config = { api: { bodyParser: false } }

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!process.env.GROQ_API_KEY) {
    response.status(503).json({ error: 'Add GROQ_API_KEY to the deployment environment to enable transcription.' })
    return
  }

  try {
    const chunks = []
    for await (const chunk of request) chunks.push(Buffer.from(chunk))
    const form = new FormData()
    form.append('file', new Blob([Buffer.concat(chunks)], { type: request.headers['content-type'] || 'audio/webm' }), 'rally-recording.webm')
    form.append('model', 'whisper-large-v3-turbo')
    form.append('response_format', 'json')
    const upstream = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: form })
    response.status(upstream.status).setHeader('Content-Type', 'application/json').send(await upstream.text())
  } catch {
    response.status(502).json({ error: 'Transcription could not be completed.' })
  }
}