import path from 'path'
import chokidar from 'chokidar'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const filePath = path.join(process.cwd(), 'resume.yaml')
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const watcher = chokidar.watch(filePath, { ignoreInitial: true })

      watcher.on('change', () => {
        controller.enqueue(encoder.encode('data: reload\n\n'))
      })

      request.signal.addEventListener('abort', () => {
        watcher.close()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  })
}
