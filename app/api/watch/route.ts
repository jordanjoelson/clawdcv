import path from 'path'
import chokidar from 'chokidar'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const dir = process.cwd()
  const filePath = path.join(dir, 'resume.yaml')
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Watch the directory, not the single file: atomic saves (write temp +
      // rename over resume.yaml) replace the inode, which breaks a single-file
      // watch and fires add/unlink instead of change. Watching the dir and
      // reacting to add+change for resume.yaml survives atomic replaces.
      const watcher = chokidar.watch(dir, {
        ignoreInitial: true,
        depth: 0,
        awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 20 },
      })

      const onChange = (changed: string) => {
        if (path.resolve(changed) === path.resolve(filePath)) {
          controller.enqueue(encoder.encode('data: reload\n\n'))
        }
      }
      watcher.on('change', onChange)
      watcher.on('add', onChange)

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
