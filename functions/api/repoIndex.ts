import type { IcfEnv } from "@customTypes/types";
import { getHeaders } from "functions/shared";

export const onRequestGet: PagesFunction = async (context) => {
  const request: Request = context.request;
  const env = context.env as IcfEnv & typeof context.env;

  const url = new URL(request.url);
  const user = url.searchParams?.get("user");
  const repo = url.searchParams?.get("repo");
  if (!user || !repo || user == "undefined" || repo == "undefined") {
    return new Response(null, {
      status: 400,
      statusText: "Missing parameters"
    });
  }

  let returnValue;

  const baseUrl = env.PIPELINE_API_URL_BASE;
  const finalUrl = `${baseUrl}/${user}/${repo}/index.json`;
  try {
    // http://localhost/u/WA-Catalog/en_ulb/index.json;
    const response = await fetch(finalUrl, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    returnValue = response.body;
    return new Response(returnValue, {
      headers: getHeaders()
    });
  } catch (error) {
    console.error(error);
    return new Response(null, {
      status: 404,
      statusText: `Fetch for ${finalUrl} failed.`
    });
  }
};
