import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
  const geometry = await request.json()
  fs.writeFileSync(
    path.join(process.cwd(), 'geometry.json'),
    JSON.stringify(geometry, null, 2)
  )
  return new Response('ok')
}
