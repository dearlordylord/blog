
export const buildOGURL = (root: URL, slug: string | undefined) =>
  new URL(`/opengraph/${slug ?? "index"}.png`, root).toString();
