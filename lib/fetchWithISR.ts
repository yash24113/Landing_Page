// lib/fetchWithISR.ts
export const dynamic = 'force-static';
export const revalidate = 2592000; // 30 days

const DEFAULT_REVALIDATE = 2592000;

export function fetchWithISR(
  url: string,
  options: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {}
) {
  const { next: nextOpt, ...rest } = options || {};

  if (rest.headers) {
    const headers = { ...rest.headers } as Record<string, any>;
    delete headers['cache-control'];
    delete headers['Cache-Control'];
    rest.headers = headers;
  }

  return fetch(url, {
    cache: 'force-cache', // ensures ISR cache
    ...rest,
    next: {
      revalidate: nextOpt?.revalidate ?? DEFAULT_REVALIDATE,
      ...(nextOpt?.tags ? { tags: nextOpt.tags } : {}),
    },
  });
}
