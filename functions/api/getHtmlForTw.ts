import type { IcfEnv } from "@customTypes/types";
import { getHeaders, aTagHandler, allParamsAreValid } from "functions/shared";

export const onRequestGet: PagesFunction = async (context) => {
  const request: Request = context.request;
  const env = context.env as IcfEnv & typeof context.env;

  const url = new URL(request.url);
  const user = url.searchParams?.get("user") as string; //invariants are checked below
  const repo = url.searchParams?.get("repo");
  const navSection = url.searchParams?.get("navSection");

  if (!allParamsAreValid([user, repo, navSection])) {
    return new Response(null, {
      status: 400,
      statusText: "Missing parameters"
    });
  }

  class imgTagHandler {
    element(element: Element) {
      element.setAttribute("loading", "lazy");
    }
  }

  try {
    // http://localhost/u/WA-Catalog/en_ulb/index.json;
    const baseUrl = env.PIPELINE_API_URL_BASE;
    const finalUrl = `${baseUrl}/${user}/${repo}/${navSection}.html`;
    const response = await fetch(finalUrl);
    // E[foo*="bar"]
    const newResp = new Response(response.body, {
      headers: getHeaders()
    });
    const aHandler = new aTagHandler(user, "TW");
    return new HTMLRewriter()
      .on("a[data-is-rc-link]", aHandler)
      .on("a[href*='html']", aHandler)
      .on("img[src*='content.bibletranslationtools.org'", new imgTagHandler())
      .transform(newResp);
  } catch (error) {
    console.error(error);
    return new Response(null, {
      status: 404
    });
  }
};
