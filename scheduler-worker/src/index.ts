export interface Env {
  UPSTREAM_URLS: string
}

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    for (const raw of env.UPSTREAM_URLS.split(',')) {
      const url = raw.trim()
      if (url) ctx.waitUntil(checkUrl(url))
    }
  },

  async fetch(request: Request, env: Env) {
    const url = new URL(request.url)

    if (url.pathname === '/health') {
      return Response.json({ ok: true })
    }

    if (url.pathname === '/check') {
      const targets = env.UPSTREAM_URLS.split(',').map((s) => s.trim()).filter(Boolean)
      const results = await Promise.all(targets.map(checkUrl))
      return Response.json(results)
    }

    return new Response('Not Found', { status: 404 })
  },
}

async function checkUrl(url: string) {
  const started = Date.now()
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    return {
      url,
      status: res.status,
      ok: res.ok,
      latencyMs: Date.now() - started,
      at: new Date().toISOString(),
    }
  } catch (error) {
    return {
      url,
      status: 0,
      ok: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
      at: new Date().toISOString(),
    }
  }
}