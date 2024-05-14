const devUrl = import.meta.env.PUBLIC_FUNCTIONS_API_BASE;
let base: string | undefined;

interface getRepoHtmlType {
  user: string;
  repo: string;
  book: string;
  chapter: string;
}
interface getNonBibleRepoHtmlType {
  user: string;
  repo: string;
  navSection: string;
}

interface repo {
  user: string;
  repo: string;
}
interface commentaryIndividual extends repo {
  file: string;
}

// these names need to align with the names of files in the functions folder.  They are cloudflare workers.
export function setOriginUrl(origin: string) {
  // base =
  //   import.meta.env.MODE === "development"
  //     ? devUrl
  //     : mode === "test"
  //       ? devUrl
  //       : mode === "ci"
  //         ? devUrl
  //         : `${origin}/api`;
  base = `${origin}/api`;
}
function supplyBaseLocation(): string {
  if (base) return `${base}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }
  return "localhost:4321/api";
}

const FUNCTIONS_ROUTES = {
  getRepoIndex: ({ user, repo }: repo) => {
    return `${supplyBaseLocation()}/repoIndex?user=${user}&repo=${repo}`;
  },
  getRepoHtml: ({ user, repo, book, chapter }: getRepoHtmlType) => {
    // todo: try to migrate just this one route
    //
    // base = "http://localhost:4321/api";
    return `${supplyBaseLocation()}/getHtmlForChap?user=${user}&repo=${repo}&book=${book}&chapter=${chapter}`;
  },
  getHtmlForTw: ({ user, repo, navSection }: getNonBibleRepoHtmlType) => {
    return `${supplyBaseLocation()}/getHtmlForTw?user=${user}&repo=${repo}&navSection=${navSection}`;
  },
  getHtmlForTm: ({ user, repo, navSection }: getNonBibleRepoHtmlType) => {
    return `${supplyBaseLocation()}/getHtmlForTm?user=${user}&repo=${repo}&navSection=${navSection}`;
  },
  getHtmlForCommentaryIndividualSection: ({
    file,
    user,
    repo
  }: commentaryIndividual) => {
    return `${supplyBaseLocation()}/getHtmlForCommentaryIndividualSection?user=${user}&repo=${repo}&file=${file}`;
  },
  downloadUsfmSrc: ({
    user,
    repo,
    book
  }: repo & {
    book: string | undefined;
  }) => {
    if (!book) return;

    return `${supplyBaseLocation()}/getUsfmSrcDownload?user=${user}&repo=${repo}&book=${book}`;
  },

  getWholeBookJson: ({
    user,
    repo,
    book
  }: Pick<getRepoHtmlType, "book" | "repo" | "user">) => {
    return `${supplyBaseLocation()}/getWholeBookJson?user=${user}&repo=${repo}&book=${book}`;
  },
  getWholeRepoDownload: ({
    user,
    repo,
    method
  }: repo & {
    method: "GET" | "HEAD";
  }) => {
    return `${supplyBaseLocation()}/getWholeRepoDownload?user=${user}&repo=${repo}&method=${method}`;
  },

  printPdfRoute: () => {
    return `${supplyBaseLocation()}/getPdf`;
  }
};

export { FUNCTIONS_ROUTES };
