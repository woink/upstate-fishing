# CORS Research for Fresh on Deno Deploy

## Summary

No explicit CORS configuration is needed. The app uses a same-origin architecture where Fresh serves
both the UI and API from a single origin, so browsers never enforce CORS restrictions.

## Deno Deploy Behavior

Deno Deploy does not inject any CORS headers automatically. It serves exactly what the Fresh app
returns — no middleware, no proxy headers, no implicit `Access-Control-Allow-Origin`. This means
CORS behavior is entirely determined by the application code.

## Current Architecture: Same-Origin

Fresh serves both server-rendered pages and API routes from the same origin:

```
https://upstate-fishing.deno.dev/           -> Fresh route (SSR)
https://upstate-fishing.deno.dev/api/streams -> Fresh API route
https://upstate-fishing.deno.dev/api/hatches -> Fresh API route
```

All island `fetch()` calls use relative URLs (e.g., `/api/streams`), which the browser resolves to
the same origin. Same-origin requests bypass CORS entirely — no preflight, no
`Access-Control-Allow-Origin` header required.

## When CORS Would Be Needed

CORS configuration would only become necessary if:

- A **separate frontend** (e.g., a mobile web app on a different domain) calls the API
- A **mobile app** or **desktop client** makes direct HTTP requests (native apps aren't subject to
  CORS, but a companion web view might be)
- A **third-party site** embeds or consumes the API from a different origin

None of these scenarios apply to the current architecture.

## Future Recommendation

If cross-origin API consumers are ever needed, add a Fresh middleware at
`frontend/routes/api/_middleware.ts`:

```ts
import { FreshContext } from '$fresh/server.ts';

export async function handler(req: Request, ctx: FreshContext) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const resp = await ctx.next();
  resp.headers.set('Access-Control-Allow-Origin', '*');
  return resp;
}
```

Using `*` is appropriate since all data served by this API is public (USGS water data, Weather.gov
forecasts, hatch predictions). No authentication or private data is involved.

## References

- [MDN: Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Deno Deploy docs](https://docs.deno.com/deploy/manual/)
- [Fresh middleware](https://fresh.deno.dev/docs/concepts/middleware)
