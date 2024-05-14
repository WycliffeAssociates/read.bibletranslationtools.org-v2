import type { IcfEnv } from "@customTypes/types";
import type { APIRoute } from "astro";
import { getHeaders, aTagHandler, allParamsAreValid } from "@lib/api";

export const GET: APIRoute = async (context) => {
  const runtime = context.locals.runtime;
  const env = runtime.env as IcfEnv;
  const { url } = context;

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let Rewriter: any =
      typeof HTMLRewriter == "undefined" ? null : HTMLRewriter;
    if (import.meta.env.DEV) {
      const htmlRewriteDevModule = await import("htmlrewriter");
      const module = htmlRewriteDevModule.HTMLRewriter;
      Rewriter = module;
    }

    return new Rewriter()
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
