export async function onRequest(context) {
  const url = new URL(context.request.url);
  const backendUrl = "https://jeemocklab-backend.yashawachar101.workers.dev" + url.pathname + url.search;

  const headers = new Headers(context.request.headers);
  headers.delete("host");

  const init = {
    method: context.request.method,
    headers,
    redirect: "follow",
  };

  if (context.request.method !== "GET" && context.request.method !== "HEAD") {
    init.body = context.request.body;
    init.duplex = "half";
  }

  return fetch(backendUrl, init);
}
