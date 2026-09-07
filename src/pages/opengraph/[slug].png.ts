import { getCollection } from "astro:content";
import sharp from "sharp";

interface Props {
  readonly title: string;
}

const WIDTH = 1200;
const HEIGHT = 630;
const MAX_LINES = 4;

const escapeXml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const wrapTitle = (
  title: string,
  maxCharacters: number,
): ReadonlyArray<string> => {
  const words = title.trim().split(/\s+/);
  const lines: Array<string> = [];

  for (const word of words) {
    const currentLine = lines.at(-1);
    if (!currentLine || currentLine.length + word.length + 1 > maxCharacters) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${currentLine} ${word}`;
    }
  }

  if (lines.length <= MAX_LINES) return lines;

  const visibleLines = lines.slice(0, MAX_LINES);
  const lastLine = visibleLines[MAX_LINES - 1]!;
  visibleLines[MAX_LINES - 1] = `${lastLine.slice(0, maxCharacters - 1)}…`;
  return visibleLines;
};

const renderCard = async (title: string): Promise<ArrayBuffer> => {
  const lines = wrapTitle(title, 24);
  const fontSize = lines.length <= 2 ? 76 : lines.length === 3 ? 66 : 56;
  const lineHeight = Math.round(fontSize * 1.14);
  const titleHeight = lineHeight * lines.length;
  const firstBaseline = Math.round((HEIGHT - titleHeight) / 2 + fontSize);
  const titleLines = lines
    .map(
      (line, index) =>
        `<tspan x="76" y="${firstBaseline + index * lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  const svg = `
    <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#090b16" />
          <stop offset="0.55" stop-color="#15112b" />
          <stop offset="1" stop-color="#071d26" />
        </linearGradient>
        <radialGradient id="violet" cx="0" cy="0" r="1" gradientTransform="translate(1010 80) rotate(135) scale(520)">
          <stop stop-color="#8b5cf6" stop-opacity="0.5" />
          <stop offset="1" stop-color="#8b5cf6" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="cyan" cx="0" cy="0" r="1" gradientTransform="translate(180 620) rotate(-45) scale(500)">
          <stop stop-color="#22d3ee" stop-opacity="0.3" />
          <stop offset="1" stop-color="#22d3ee" stop-opacity="0" />
        </radialGradient>
        <pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse">
          <path d="M 42 0 L 0 0 0 42" fill="none" stroke="#ffffff" stroke-opacity="0.045" stroke-width="1" />
        </pattern>
      </defs>

      <rect width="${WIDTH}" height="${HEIGHT}" rx="30" fill="url(#background)" />
      <rect width="${WIDTH}" height="${HEIGHT}" rx="30" fill="url(#violet)" />
      <rect width="${WIDTH}" height="${HEIGHT}" rx="30" fill="url(#cyan)" />
      <rect width="${WIDTH}" height="${HEIGHT}" rx="30" fill="url(#grid)" />

      <rect x="76" y="68" width="54" height="8" rx="4" fill="#22d3ee" />
      <rect x="138" y="68" width="24" height="8" rx="4" fill="#8b5cf6" />
      <text x="76" y="116" fill="#a5b4c8" font-family="sans-serif" font-size="22" font-weight="600" letter-spacing="4">OH DEAR LORDY LORD · PROGRAMMING</text>

      <text fill="#f8fafc" font-family="sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="-1.5">
        ${titleLines}
      </text>

      <text x="76" y="572" fill="#94a3b8" font-family="sans-serif" font-size="24" font-weight="500">dearlordylord.com</text>
      <circle cx="1115" cy="550" r="34" fill="none" stroke="#22d3ee" stroke-opacity="0.8" stroke-width="3" />
      <path d="M1102 550h26m-10-10 10 10-10 10" fill="none" stroke="#22d3ee" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;

  const image = await sharp(Buffer.from(svg)).png().toBuffer();
  const bytes = new Uint8Array(image.byteLength);
  bytes.set(image);
  return bytes.buffer;
};

export async function getStaticPaths() {
  const posts = await getCollection("blog");

  return posts
    .filter((post) => !post.data.opengraphImage)
    .map((post) => ({
      params: { slug: post.id.replace(/\.(md|mdx)$/, "") },
      props: { title: post.data.title } satisfies Props,
    }));
}

export async function GET({ props }: { props: Props }): Promise<Response> {
  return new Response(await renderCard(props.title), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
