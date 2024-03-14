import type { IcfEnv } from "@customTypes/types";
import { getHeaders, allParamsAreValid } from "functions/shared";

export const onRequestGet: PagesFunction = async (context) => {
  const request: Request = context.request;
  const env = context.env as IcfEnv & typeof context.env;

  const url = new URL(request.url);
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
