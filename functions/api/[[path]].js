export async function onRequest(context) {
  try {
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

    return await fetch(backendUrl, init);
  } catch (err) {
    console.error("[PAGES_GATEWAY_PROXY_ERR]", err);
    return new Response(JSON.stringify({ error: `Proxy Gateway Error: ${err.message}` }), {
      status: 502,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
