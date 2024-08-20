import type { IcfEnv } from "@customTypes/types";
import {
  getRepoIndexLocal,
  getHeaders,
  allParamsAreValid,
  aTagHandler
} from "@lib/api";
import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  const runtime = context.locals.runtime;
  const env = runtime.env as IcfEnv;
  const { url } = context;

  const user = url.searchParams?.get("user") as string;
  const repo = url.searchParams?.get("repo") as string;
  const navSection = url.searchParams?.get("navSection");

  if (!allParamsAreValid([user, repo, navSection])) {
    return new Response(null, {
      status: 400,
      statusText: "Missing parameters"
    });
  }
  // Used to rewrite A links via files Names
  const repoIndex = await getRepoIndexLocal(env, user, repo);
  const possibleFiles =
    repoIndex && repoIndex.navigation?.map((navOb) => navOb.File);

  try {
    // http://localhost/u/WA-Catalog/en_ulb/index.json;
    const baseUrl = env.PIPELINE_API_URL_BASE;
    const finalUrl = `${baseUrl}/${user}/${repo}/${navSection}.html`;
    const response = await fetch(finalUrl);
    const newResp = new Response(response.body, {
      headers: getHeaders()
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let Rewriter: any =
      typeof HTMLRewriter == "undefined" ? null : new HTMLRewriter();
    if (import.meta.env.DEV) {
      const htmlRewriteDevModule = await import("htmlrewriter");
      Rewriter = new htmlRewriteDevModule.HTMLRewriter();
    }

    const handler = new aTagHandler(user, "TM");
    // This line is to transform Hrefs inside the manual from absolute whatever.html into query parameters on the same origin such as
    // <a href="?section=intro#translate-terms">Terms to Know</a>
    possibleFiles &&
      possibleFiles.forEach((possible) => {
        Rewriter.on(`a[href*='${possible}']`, handler);
      });
    return Rewriter.transform(newResp);
  } catch (error) {
    console.error(error);
    return new Response(null, {
      status: 404
    });
  }
};
