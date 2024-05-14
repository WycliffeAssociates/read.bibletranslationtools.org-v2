import type { IcfEnv } from "@customTypes/types";
import { getHeaders, allParamsAreValid } from "@lib/api";
import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  const runtime = context.locals.runtime;
  const env = runtime.env as IcfEnv;
  const { url } = context;

  const file = url.searchParams?.get("file");
  const user = url.searchParams?.get("user");
  const repo = url.searchParams?.get("repo");

  if (!allParamsAreValid([file, user, repo])) {
    return new Response(null, {
      status: 400,
      statusText: "Invalid parameters"
    });
  }

  try {
    // http://localhost/u/WA-Catalog/en_ulb/index.json;
    const baseUrl = env.PIPELINE_API_URL_BASE;
    const finalUrl = `${baseUrl}/${user}/${repo}/${file}`;
    const response = await fetch(finalUrl);
    // E[foo*="bar"]
    const newResp = new Response(response.body, {
      headers: getHeaders()
    });
    return newResp;
  } catch (error) {
    console.error(error);
    return new Response(null, {
      status: 404
    });
  }
};
