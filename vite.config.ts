import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '')

	return {
		plugins: [
			react(),
			{
				name: 'groq-proxy',
				configureServer(server) {
					server.middlewares.use('/api/groq', async (request, response) => {
						if (request.method !== 'POST') {
							response.statusCode = 405
							response.end('Method not allowed')
							return
						}

						let body = ''
						request.on('data', (chunk) => { body += chunk })
						request.on('end', async () => {
							if (!env.GROQ_API_KEY) {
								response.statusCode = 503
								response.setHeader('Content-Type', 'application/json')
								response.end(JSON.stringify({ error: 'Add GROQ_API_KEY to .env to enable Ask Rally.' }))
								return
							}

							try {
								const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
									method: 'POST',
									headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.GROQ_API_KEY}` },
									body,
								})
								response.statusCode = groqResponse.status
								response.setHeader('Content-Type', 'application/json')
								response.end(await groqResponse.text())
							} catch {
								response.statusCode = 502
								response.setHeader('Content-Type', 'application/json')
								response.end(JSON.stringify({ error: 'Groq could not be reached.' }))
							}
						})
					})
					server.middlewares.use('/api/transcribe', async (request, response) => {
						if (request.method !== 'POST') {
							response.statusCode = 405
							response.end('Method not allowed')
							return
						}

						if (!env.GROQ_API_KEY) {
							response.statusCode = 503
							response.setHeader('Content-Type', 'application/json')
							response.end(JSON.stringify({ error: 'Add GROQ_API_KEY to .env to enable transcription.' }))
							return
						}

						const chunks: Buffer[] = []
						request.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
						request.on('end', async () => {
							try {
								const audioBytes = Buffer.concat(chunks)
								const audio = new Blob([audioBytes.buffer as ArrayBuffer], { type: request.headers['content-type'] || 'audio/webm' })
								const form = new FormData()
								form.append('file', audio, 'rally-recording.webm')
								form.append('model', 'whisper-large-v3-turbo')
								form.append('response_format', 'json')
								const transcription = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
									method: 'POST',
									headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` },
									body: form,
								})
								response.statusCode = transcription.status
								response.setHeader('Content-Type', 'application/json')
								response.end(await transcription.text())
							} catch {
								response.statusCode = 502
								response.setHeader('Content-Type', 'application/json')
								response.end(JSON.stringify({ error: 'Transcription could not be completed.' }))
							}
						})
					})
				},
			},
		],
	}
})
