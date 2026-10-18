type OriginRequest = {
  headers: Headers;
  nextUrl: { origin: string; protocol: string; host: string };
};

export function isSameOrigin(request: OriginRequest): boolean {
  const origin = request.headers.get("origin");
  if (origin === null) return true;

  // NextURL rewrites loopback IPs to localhost. Host retains the authority that
  // the browser actually contacted. Do not use client-supplied forwarded hosts.
  const host = request.headers.get("host") ?? request.nextUrl.host;
  if (!host || /[\s,/@\\?#]/.test(host)) return false;
  try {
    const expected = new URL(`${request.nextUrl.protocol}//${host}`);
    const supplied = new URL(origin);
    return (
      (supplied.protocol === "http:" || supplied.protocol === "https:") &&
      supplied.origin === origin &&
      supplied.origin === expected.origin
    );
  } catch {
    return false;
  }
}
