// Cloudflare Pages Functions —— 和风天气代理
// 路径：/api/*  →  转发到和风天气，附 X-QW-Api-Key 头
// 替代原 server.js 的 L47-L77 逻辑，部署到 Cloudflare Pages 后无需 Node 服务器
//
// 环境变量（在 CF Pages dashboard → Settings → Environment variables 配）：
//   QWEATHER_KEY   - 你的和风 API Key
//   QWEATHER_HOST  - 自定义 Host（默认 devapi.qweather.com）
//
// 注意：CF Pages Functions 使用 [[path]].js 作为 catch-all 路由，
// 任何 /api/... 请求都会进入本文件。

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 处理 CORS 预检
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  const host = env.QWEATHER_HOST || "devapi.qweather.com";
  const apiKey = env.QWEATHER_KEY || "";

  let target;
  if (pathname.startsWith("/api/qweather/")) {
    const sub = pathname.replace("/api/qweather/", "");
    target = `https://${host}/v7/${sub}${url.search}`;
  } else if (pathname.startsWith("/api/geo/")) {
    const sub = pathname.replace("/api/geo/", "");
    target = `https://${host}/geo/v2/${sub}${url.search}`;
  } else {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const upstream = await fetch(target, {
      headers: { "X-QW-Api-Key": apiKey },
    });
    const body = await upstream.text();
    const headers = new Headers(corsHeaders());
    headers.set("Content-Type", "application/json; charset=utf-8");
    headers.set("Cache-Control", "no-store");
    return new Response(body, { status: upstream.status, headers });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: { title: "Upstream fetch failed", message: String(err) } }),
      { status: 502, headers: { ...corsHeaders(), "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
