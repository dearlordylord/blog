# Astro 7 upgrade research

Research date: 2026-09-05

Implementation status (2026-09-06): completed in this repository. The implementation uses Astro 7's native Sätteri processor after correcting all 42 malformed code-fence language identifiers, removes the dormant Mermaid/Puppeteer stack, migrates Tailwind through its Vite plugin while retaining the JavaScript config via `@config`, and includes pnpm's scoped audit overrides. The final production audit has zero findings. `astro check` reports zero diagnostics, the production build generates all 13 pages and auxiliary outputs, and local preview smoke tests return HTTP 200 for the home page, blog index, RSS feed, and a generated Open Graph PNG.

Follow-up status (2026-09-06): React, React DOM, and their type packages were upgraded to 19.2.x, and TypeScript was upgraded to 6.0.3. TypeScript 6 exposed several previously missed strictness and deprecation diagnostics; those were corrected in the content schema, header icons, page imports, comment-script attributes, and Open Graph response code. Both `tsc --noEmit` and the complete Astro build now pass with zero diagnostics. This follow-up has not been deployed.

## Recommendation

Upgrade the site from Astro 6.1.1 to Astro 7.3.1 and update the official integrations in the same change. This is a one-major-version migration. The project already meets Astro's package-manager requirement, but its Node declaration should be tightened from `>=22` to `>=22.12.0`, which is the minimum declared by Astro 7.3.1 and the current React and MDX integrations. Astro's official path is `pnpm dlx @astrojs/upgrade`, which upgrades Astro and official integrations together. ([Astro v7 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v7/), [Astro 7.3.1 npm metadata](https://registry.npmjs.org/astro/latest))

Two repository-specific migrations need deliberate work:

1. Replace the deprecated Tailwind 3 Astro integration with Tailwind 4's Vite plugin, and convert the Tailwind entry stylesheet from SCSS to CSS. The current `@astrojs/tailwind@6.0.2` package declares support only for Astro 3, 4, and 5, while Astro now recommends `@tailwindcss/vite` for Tailwind 4. Tailwind 4 does not support Sass as its preprocessing layer. ([`@astrojs/tailwind` npm metadata](https://registry.npmjs.org/%40astrojs%2Ftailwind/latest), [Astro Tailwind migration instructions](https://docs.astro.build/en/guides/styling/#upgrade-from-tailwind-3), [Tailwind v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide))
2. Remove the dormant Mermaid rendering stack, then choose the Markdown compatibility path deliberately. `astro.config.mjs` registers `astro-diagram/remark-mermaid`, but the current content contains no Mermaid code fences and no imports of `mdx-mermaid`. Separately, 42 existing code fences in three posts use language identifiers such as `typescript=` and `rust=`. Astro 7's Sätteri processor treats those as unknown languages, while the old unified pipeline tolerated them. Either fix those 42 fences and adopt Sätteri, or add `@astrojs/markdown-remark` and `processor: unified()` temporarily to preserve current rendering. ([Astro v7 Markdown migration](https://docs.astro.build/en/guides/upgrade-to/v7/#new-default-markdown-processor-s%C3%A4tteri), [`@astrojs/mdx` changelog](https://github.com/withastro/astro/blob/main/packages/integrations/mdx/CHANGELOG.md#800))

Estimated effort is roughly half a day for the framework, Tailwind, Markdown, and local verification work, because the isolated migration already builds without component rewrites. Allow up to a full day if the same change also cleans up all audit findings and includes a careful Vercel preview and visual comparison. The largest uncertainty is validation rather than implementation: Astro 7 changes whitespace serialization, and Tailwind 4 changes generated CSS and its browser baseline.

## Current and target dependency set

Versions in the “current” column are the resolved root versions in `pnpm-lock.yaml`. “Target” is the latest stable npm release on the research date unless the notes recommend holding a compatible version.

| Package                    |    Current |  Target | Required action                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------- | ---------: | ------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `astro`                    |      6.1.1 |   7.3.1 | Upgrade. Astro 7 uses Vite 8, the Rust compiler, Sätteri, and JSX-style HTML whitespace by default. ([npm](https://registry.npmjs.org/astro/latest), [migration guide](https://docs.astro.build/en/guides/upgrade-to/v7/))                                                                                                                                                    |
| `@astrojs/check`           |      0.9.8 |  0.9.10 | Upgrade. 0.9.9 added TypeScript 6 support; 0.9.10 is current. ([changelog](https://github.com/withastro/astro/blob/main/packages/language-tools/astro-check/CHANGELOG.md))                                                                                                                                                                                                    |
| `@astrojs/mdx`             |      5.0.3 |   8.0.0 | Upgrade. 8.0.0 requires Astro `^7.2.6` and delegates MDX processing to the configured Markdown processor. ([npm](https://registry.npmjs.org/%40astrojs%2Fmdx/latest), [changelog](https://github.com/withastro/astro/blob/main/packages/integrations/mdx/CHANGELOG.md#800))                                                                                                   |
| `@astrojs/react`           |      5.0.2 |   6.0.5 | Upgrade for Vite 8. It still supports React 17, 18, and 19, so React itself need not be upgraded in this change. ([npm](https://registry.npmjs.org/%40astrojs%2Freact/latest), [changelog](https://github.com/withastro/astro/blob/main/packages/integrations/react/CHANGELOG.md#600))                                                                                        |
| `@astrojs/rss`             |     4.0.18 |  4.0.19 | Upgrade; the patch hardens escaping of RSS `source` and `enclosure` fields. ([changelog](https://github.com/withastro/astro/blob/main/packages/astro-rss/CHANGELOG.md#4019))                                                                                                                                                                                                  |
| `@astrojs/sitemap`         |      3.7.2 |   3.7.4 | Upgrade; only patch fixes since the current version. ([changelog](https://github.com/withastro/astro/blob/main/packages/integrations/sitemap/CHANGELOG.md#374))                                                                                                                                                                                                               |
| `@astrojs/vercel`          |     10.0.3 | 11.0.10 | Upgrade. v11 requires Astro 7 and Vite 8; the existing `webAnalytics` configuration remains documented. ([npm](https://registry.npmjs.org/%40astrojs%2Fvercel/latest), [changelog](https://github.com/withastro/astro/blob/main/packages/integrations/vercel/CHANGELOG.md#11010), [adapter docs](https://docs.astro.build/en/guides/integrations-guide/vercel/#webanalytics)) |
| `@astrojs/tailwind`        |      6.0.2 |  remove | Deprecated; replace with `@tailwindcss/vite`. ([Astro docs](https://docs.astro.build/en/guides/integrations-guide/tailwind/))                                                                                                                                                                                                                                                 |
| `@tailwindcss/vite`        |     absent |   4.3.3 | Add to `vite.plugins`; it supports Vite 5 through 8. ([npm](https://registry.npmjs.org/%40tailwindcss%2Fvite/latest), [Tailwind guide](https://tailwindcss.com/docs/upgrade-guide#using-vite))                                                                                                                                                                                |
| `tailwindcss`              |      3.4.3 |   4.3.3 | Upgrade with the Tailwind migration. ([npm](https://registry.npmjs.org/tailwindcss/latest), [upgrade guide](https://tailwindcss.com/docs/upgrade-guide))                                                                                                                                                                                                                      |
| `@tailwindcss/typography`  |     0.5.13 |  0.5.20 | Upgrade; current release supports Tailwind 3 and 4. ([npm](https://registry.npmjs.org/%40tailwindcss%2Ftypography/latest))                                                                                                                                                                                                                                                    |
| `@astrojs/markdown-remark` | transitive |   7.3.0 | Add directly only if retaining `remarkMermaid`; configure `processor: unified()`. Astro and MDX require this version range for unified processing. ([Astro guide](https://docs.astro.build/en/guides/upgrade-to/v7/#new-default-markdown-processor-s%C3%A4tteri), [npm](https://registry.npmjs.org/%40astrojs%2Fmarkdown-remark/latest))                                      |
| `vite-plugin-wasm`         |      3.3.0 |   3.6.0 | Upgrade because this site imports a wasm-pack module. The current release explicitly supports Vite 2–8. ([upstream README](https://github.com/Menci/vite-plugin-wasm#readme), [npm](https://registry.npmjs.org/vite-plugin-wasm/latest))                                                                                                                                      |
| `prettier-plugin-astro`    |     0.13.0 |  0.14.1 | Upgrade the Astro formatter; 0.14.1 is the latest official release. ([official releases](https://github.com/withastro/prettier-plugin-astro/releases/tag/v0.14.1))                                                                                                                                                                                                            |
| `markdown-it`              |     14.1.0 |  15.0.1 | Upgrade and verify RSS rendering; it is used directly by `src/pages/rss.xml.js`. ([npm](https://registry.npmjs.org/markdown-it/latest))                                                                                                                                                                                                                                       |
| `sanitize-html`            |     2.13.0 |  2.17.7 | Upgrade and verify RSS rendering; it is used directly by `src/pages/rss.xml.js`. ([npm](https://registry.npmjs.org/sanitize-html/latest))                                                                                                                                                                                                                                     |
| `sharp`                    |     0.34.5 |  0.35.4 | Upgrade and verify the three generated Open Graph image routes. The isolated build generated all three successfully. ([npm](https://registry.npmjs.org/sharp/latest))                                                                                                                                                                                                         |
| `@phosphor-icons/react`    |      2.1.5 |  2.1.10 | Safe patch-level companion update; verify the header icons. ([npm](https://registry.npmjs.org/%40phosphor-icons%2Freact/latest))                                                                                                                                                                                                                                              |
| `astro-color-scheme`       |      1.1.4 |   1.1.6 | Safe patch-level companion update; verify the theme switch. ([npm](https://registry.npmjs.org/astro-color-scheme/latest))                                                                                                                                                                                                                                                     |

The other formatter packages can be upgraded in the same lockfile refresh (`prettier` 3.9.6 and `prettier-plugin-tailwindcss` 0.8.1 are current), but they are not Astro 7 prerequisites. ([Prettier npm metadata](https://registry.npmjs.org/prettier/latest), [Tailwind Prettier plugin npm metadata](https://registry.npmjs.org/prettier-plugin-tailwindcss/latest))

The existing Prettier configuration names `prettier-plugin-organize-import`, a package that does not exist in npm, and the formatter currently fails before checking any files. If import organization is wanted, change the configuration to `prettier-plugin-organize-imports` and add version 4.3.0; otherwise remove that plugin entry. ([npm](https://registry.npmjs.org/prettier-plugin-organize-imports/latest))

## Required source/config changes

### Tailwind 4

The current site has one SCSS entrypoint, `src/styles/global.scss`, imported by `src/components/Head.astro`. It consists only of Tailwind directives and Radix CSS imports, so the conversion should be contained:

- Rename it to `global.css` and update the import in `Head.astro`.
- Replace the three `@tailwind` directives with `@import "tailwindcss";`.
- Keep the Radix imports as CSS imports, preferably with explicit `.css` suffixes.
- For the smallest first migration, keep `tailwind.config.mjs` and load it from the new CSS entrypoint with `@config "../../tailwind.config.mjs";`. Tailwind 4 supports legacy JavaScript config through this explicit directive, and an isolated build confirmed that this project's fonts, colors, dark variant, Typography plugin, and representative utilities are generated. A later cleanup can move custom fonts/colors to `@theme`, `darkMode: "class"` to `@custom-variant dark`, and Typography to `@plugin "@tailwindcss/typography"`; the current `content` glob can then be dropped because Tailwind 4 detects sources automatically. ([Tailwind directives reference](https://tailwindcss.com/docs/functions-and-directives#config-directive))
- Remove `tailwind()` from Astro's `integrations` array, import `tailwindcss` from `@tailwindcss/vite`, and add `tailwindcss()` beside `wasm()` under `vite.plugins`.
- Remove `sass` after confirming there are no remaining `.scss` imports or `<style lang="scss">` blocks; the repository scan found none besides `global.scss`.

The official `npx @tailwindcss/upgrade` tool can migrate dependencies, the JavaScript configuration, and templates, but its output still needs visual review. Tailwind 4 also raises the browser baseline to Safari 16.4, Chrome 111, and Firefox 128. ([Tailwind v4 upgrade tool and browser requirements](https://tailwindcss.com/docs/upgrade-guide))

### Markdown and MDX

Recommended default: remove `remarkMermaid` from `astro.config.mjs` and remove `astro-diagram`, `mdx-mermaid`, `mermaid`, and the apparently unused direct `puppeteer` dependency. The repository scan found no Mermaid fences/components, while `astro-diagram@0.7.0` has not published a new npm release since 2023 and declares `mermaid@^9.1.6` even though this project resolves Mermaid 11.2.1. The current graph installs three different Puppeteer versions through these direct and transitive dependencies, so this cleanup also removes the largest avoidable maintenance burden. ([`astro-diagram` npm metadata](https://registry.npmjs.org/astro-diagram/latest))

If Mermaid support is intentional, retain the plugin temporarily by adding `@astrojs/markdown-remark@7.3.0` and configuring:

```js
import { unified } from "@astrojs/markdown-remark";

export default defineConfig({
  markdown: {
    processor: unified(),
    remarkPlugins: [remarkMermaid],
  },
});
```

This preserves the old unified behavior. Astro marks `markdown.remarkPlugins` as deprecated, so porting or replacing the plugin should remain a follow-up rather than the long-term endpoint. ([Astro v7 migration guide](https://docs.astro.build/en/guides/upgrade-to/v7/#new-default-markdown-processor-s%C3%A4tteri))

Even after removing Mermaid, `processor: unified()` is a useful short-term compatibility setting for this repository. An isolated Sätteri build warned about 42 `typescript=`, `rust=`, and `javascript=` fences in `50-shades-of-rust.mdx`, `graph-property-based.mdx`, and `negative-space-is-misunderstood.md`; those blocks would lose syntax highlighting. An isolated unified build reduced the output to the same pre-existing `htmlbars` warning as Astro 6. The cleaner long-term path is to remove the trailing `=` from those 42 fences and then use Sätteri.

## Isolated migration result

A disposable copy of the repository was upgraded to the recommended Astro 7 and official integration versions, migrated to Tailwind 4 through `@tailwindcss/vite`, changed from SCSS to CSS, loaded the existing Tailwind config with `@config`, removed the dormant Mermaid/Puppeteer stack, and used the unified Markdown compatibility processor.

`pnpm build` completed under Node 22.22.2 with zero `astro check` diagnostics. Astro generated the same 13 pages plus RSS, sitemap, Open Graph images, Vercel output, and static assets. Representative Tailwind utilities and the Typography rules were present in the generated CSS. This establishes that the migration is technically viable without application component rewrites. It does not replace the browser and Vercel preview checks because Astro 7 changes inline whitespace and Tailwind 4 changes its CSS baseline.

### Astro 7 behavior checks

The following Astro 7 changes apply to this repository and should be checked after the dependency/config update:

- **Vite 8 / Rolldown:** `vite-plugin-wasm` is the only custom Vite plugin. Its current release supports Vite 8, but the wasm-backed component should be exercised in the browser. Astro says most projects need no code changes, while Vite plugins that depend on internals are the main risk. ([Astro migration guide](https://docs.astro.build/en/guides/upgrade-to/v7/#vite-8), [plugin support statement](https://github.com/Menci/vite-plugin-wasm#readme))
- **Rust `.astro` compiler:** unclosed tags now fail, and invalid nesting is no longer corrected during compilation. `pnpm run build` will expose syntax failures; a browser pass should catch layout changes caused by invalid nesting. ([Astro migration guide](https://docs.astro.build/en/guides/upgrade-to/v7/#rust-compiler))
- **Whitespace:** the default changes from HTML-aware compression to `compressHTML: "jsx"`. Newlines between adjacent inline elements no longer create a space. Check navigation, headings, post metadata, and inline icon/text combinations. Add an explicit `{" "}` where necessary, or temporarily set `compressHTML: true` to preserve Astro 6 behavior. ([Astro migration guide](https://docs.astro.build/en/guides/upgrade-to/v7/#new-default-whitespace-handling-compresshtml-jsx))
- **Reserved route file:** Astro 7 reserves `src/fetch.ts`/`.js`; this repository currently has neither, so no action is required. ([Astro migration guide](https://docs.astro.build/en/guides/upgrade-to/v7/#reserved-file-name-srcfetchts))
- **Removed/deprecated APIs:** the repository does not use `@astrojs/db`, removed `astro:transitions` internals, experimental Astro 7 flags, or `getContainerRenderer()`, so those guide items do not require changes. ([Astro migration guide](https://docs.astro.build/en/guides/upgrade-to/v7/#deprecated))

## Related dependencies that should stay separate

- **React 19:** Astro's current React integration supports React 19. The initial Astro migration retained React 18 to isolate framework risk; the subsequent requested follow-up upgraded React and its types to 19.2.x and passed the direct TypeScript check, Astro check, build, and preview smoke test for the article containing the hydrated React island and its generated client chunk. ([`@astrojs/react` npm metadata](https://registry.npmjs.org/%40astrojs%2Freact/latest))
- **TypeScript:** `@astrojs/check@0.9.10` supports TypeScript 5 and 6, not TypeScript 7. The follow-up upgraded this project to TypeScript 6.0.3. Do not select npm's `typescript@latest` while it points to 7.0.2; Astro's language server reports that TypeScript 7's native compiler does not provide the programmatic API used by `astro check`. ([`@astrojs/check` npm metadata](https://registry.npmjs.org/%40astrojs%2Fcheck/latest), [language-server changelog](https://github.com/withastro/astro/blob/main/packages/language-tools/language-server/CHANGELOG.md#21612))
- **Vercel Analytics:** the site does not import its direct `@vercel/analytics@1.2.2` dependency. `@astrojs/vercel@11.0.10` already depends on Analytics 2.0.1 and provides the configured `webAnalytics` option, so the direct dependency can be removed unless an unscanned external entrypoint consumes it. ([Vercel adapter changelog](https://github.com/withastro/astro/blob/main/packages/integrations/vercel/CHANGELOG.md#1109), [adapter docs](https://docs.astro.build/en/guides/integrations-guide/vercel/#webanalytics))
- **Sharp:** Astro 7 can continue with the site's direct image dependency during the framework upgrade. Updating Sharp from 0.34.5 to 0.35.4 is independent and should be tested separately if desired. ([Sharp npm metadata](https://registry.npmjs.org/sharp/latest))
- **pnpm:** the pinned pnpm 9.6.0 satisfies Astro 7's `>=7.1.0` requirement. A pnpm major update is unnecessary for this work. ([Astro npm metadata](https://registry.npmjs.org/astro/latest))
- **WASM:** `src/components/town.tsx` imports the checked-in wasm-pack module, but no page or content imports `town.tsx`, so the current production build emits no town/WASM chunk. Keep and update `vite-plugin-wasm` if this parked component is intentional; otherwise the component, generated WASM package, Vite plugin, and dependency are another cleanup candidate.
- **Direct `tslib`:** no source file imports it. Its only observed use is transitive, so the direct declaration can be removed.

## Dependency audit note

`pnpm audit --prod` on the upgraded graph still reported advisories in transitive packages, including a critical `tar` advisory reached through `@astrojs/vercel` → `@vercel/nft` → `@mapbox/node-pre-gyp`. At the implementation date, the latest direct Astro/Vercel packages still resolve the affected transitive versions. `pnpm audit --fix` generated 35 scoped overrides; installing those overrides reduced the audit to zero findings, and the full build still passed. Because those overrides reach inside framework and adapter dependency trees, remove them as upstream releases absorb the patched versions. ([critical `tar` advisory](https://github.com/advisories/GHSA-23hp-3jrh-7fpw))

## Suggested implementation order and verification

1. Run the current build once to preserve a baseline and capture representative screenshots/pages.
2. Run `pnpm dlx @astrojs/upgrade`, then set the exact target set above and regenerate `pnpm-lock.yaml`.
3. Perform the Tailwind 4 CSS/Vite migration. The official Astro docs recommend adding Tailwind 4 support first, then removing `@astrojs/tailwind`. ([Astro styling guide](https://docs.astro.build/en/guides/styling/#upgrade-from-tailwind-3))
4. Remove the unused Mermaid path. Either fix the 42 malformed language identifiers and adopt Sätteri, or add the unified compatibility processor for the first release.
5. Refresh the directly used RSS/image/helper dependencies listed above, fix the Prettier plugin name, and review the audit-generated transitive overrides.
6. Run `pnpm run build` (`astro check && astro build`) and address strict compiler or type errors.
7. Run the preview and compare the home page, blog index, several Markdown and MDX posts, RSS output, sitemap output, dark-mode switch, and the wasm-backed page/component. Specifically inspect inline whitespace and Tailwind Typography output.
8. Deploy a Vercel preview and verify Analytics plus static asset/image delivery before production promotion.

The upgrade should be moderate rather than broad: the Astro integration updates are mechanically aligned, while Tailwind's SCSS-to-CSS/config migration and the legacy Mermaid remark hook account for most of the project-specific work.
