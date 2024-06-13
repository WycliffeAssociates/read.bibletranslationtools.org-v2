import type { IcfEnv } from "@customTypes/types";
import { getHeaders, aTagHandler, allParamsAreValid } from "@lib/api";
import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  const runtime = context.locals.runtime;
  const env = runtime.env as IcfEnv;
  const { url } = context;

  const user = url.searchParams?.get("user") as string;
  const repo = url.searchParams?.get("repo");
  const bookKey = url.searchParams?.get("book");
  const chapter = url.searchParams?.get("chapter");

  if (!allParamsAreValid([user, repo, bookKey, chapter])) {
    return new Response(null, {
      status: 400,
      statusText: "Missing parameters"
    });
  }
  try {
    const baseUrl = env.PIPELINE_API_URL_BASE;
    const finalUrl = `${baseUrl}/${user}/${repo}/${bookKey}/${chapter}.html`;
    console.log(`fetching ${finalUrl}`);
    const response = await fetch(finalUrl);
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const newResp = new Response(response.body, {
      headers: getHeaders()
    });
    // NOTE: TN AND BIBLE CHAP ARE BOTH CHAPTER/VERSE SCHEMAS, SO THE SAME API FETCHER FUNCTION IS HERE USED, BUT WE REWRITE ANY FOUND TN LINKS AS WELL HERE.
    const handler = new aTagHandler(user, "TN");
    console.log("chekcy");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let Rewriter: any =
      typeof HTMLRewriter == "undefined" ? null : HTMLRewriter;
    if (import.meta.env.DEV) {
      const htmlRewriteDevModule = await import("htmlrewriter");
      const module = htmlRewriteDevModule.HTMLRewriter;
      Rewriter = module;
    }

    return new Rewriter()
      .on("a[href*='tn-chunk-']", handler)
      .on("a[data-is-rc-link]", handler)
      .transform(newResp);
  } catch (error) {
    console.error("error in getHtmlForChap.ts", error);
    console.error(error);
    return new Response(null, {
      status: 404
    });
  }
};
