import { getHeaders, allParamsAreValid } from "@lib/api";
import { bibleBookSortOrder } from "@lib/contants";
import type { IcfEnv } from "@customTypes/types";
import type { APIRoute } from "astro";

export const POST: APIRoute = async (context) => {
  const runtime = context.locals.runtime;
  const env = runtime.env as IcfEnv;
  const { url } = context;

  const user = url.searchParams?.get("user") as string;
  const repo = url.searchParams?.get("repo");
  const book = url.searchParams?.get("book") as string; //type guard in if statement beneath; Cast here to satisfy typescript that I'm going to ensure that they are valid params

  if (!allParamsAreValid([user, repo, book])) {
    return new Response(null, {
      status: 400,
      statusText: "Missing parameters"
    });
  }

  try {
    // http://localhost/u/WA-Catalog/en_ulb/index.json;
    const baseUrl = env.PIPELINE_API_URL_BASE;
    const finalUrl = `${baseUrl}/${user}/${repo}/source.usfm`;
    const response = await fetch(finalUrl);

    // @ NOTE! There is a convention in bible translation world (at least told to me) of NT matthew starting at 41 instead of 40:  So, if the bibleBookSortOrder[book?.toUpperCase()] is > = 40, we need to plus 1 it.
    let sortOrder = bibleBookSortOrder[book?.toUpperCase()];
    if (sortOrder >= 40) {
      sortOrder = sortOrder += 1;
    }
    const fileName = `${sortOrder}-${book?.toUpperCase()}`;
    const newResp = new Response(response.body, {
      headers: {
        ...getHeaders(),
        "Content-Type": "application/octet-stream",
        "content-disposition": `attachment; filename=${fileName}.usfm`
      }
    });
    return newResp;
  } catch (error) {
    console.error(error);
    return new Response(null, {
      status: 404
    });
  }
};
