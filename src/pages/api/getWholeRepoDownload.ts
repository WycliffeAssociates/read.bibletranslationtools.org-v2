import type { IcfEnv } from "@customTypes/types";
import type { APIRoute } from "astro";
import { getHeaders, allParamsAreValid } from "@lib/api";

export const GET: APIRoute = async (context) => {
  const runtime = context.locals.runtime;
  const env = runtime.env as IcfEnv;
  const { url } = context;

  const user = url.searchParams?.get("user") as string;
  const repo = url.searchParams?.get("repo");
  const method = url.searchParams?.get("method")?.toUpperCase() as string; //type guard in if statement beneath; Cast here to satisfy typescript that I'm going to ensure that they are valid params
  if (!["HEAD", "GET"].includes(method))
    return new Response(null, {
      status: 400,
      statusText: "Unsupported verb"
    });
  if (!allParamsAreValid([user, repo])) {
    return new Response(null, {
      status: 400,
      statusText: "Missing parameters"
    });
  }
  try {
    // http://localhost/u/WA-Catalog/en_ulb/index.json;
    const baseUrl = env.PIPELINE_API_URL_BASE;
    const finalUrl = `${baseUrl}/${user}/${repo}/download.json`;
    const response = await fetch(finalUrl, {
      method: method == "GET" ? "GET" : "HEAD"
    });
    if (!response.ok || response.status == 404) {
      return new Response(null, {
        status: 404
      });
    }
    return new Response(response.body, {
      headers: {
        ...getHeaders(),
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error(error);
    return new Response(null, {
      status: 404
    });
  }
};
