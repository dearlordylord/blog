
export const buildOGURL = (root: URL, _slug: string | undefined) => {
  return new URL("/opengraph.png", root).toString();
  // TODO implement this
  // const url = new URL("https://image.memp.dev/api");
  // slug && url.searchParams.set("title", `/${slug}`);
  // return url.toString();
};