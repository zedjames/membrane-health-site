# Membrane Health · Search discovery

The live website is a static GitHub Pages site. Its educational resources live at `/understand/`.

## Adding a public page

1. Create a real, indexable HTML page; avoid thin or duplicated keyword pages.
2. Include a descriptive unique `<title>`, meta description, canonical URL, H1, and matching social preview metadata.
3. Add visible context, accessible internal links, and verifiable evidence/limitations for scientific claims.
4. If adding `Article` or `BreadcrumbList` JSON-LD, ensure every structured claim matches visible page content.
5. Run `python3 scripts/build-sitemap.py` to refresh the canonical sitemap.
6. Run `python3 scripts/check-site.py`. CI fails if the sitemap or page metadata is inconsistent.
7. Add the page to the hub and relevant neighboring pages.

## Measurement and scientific claim policy

- **Observed**: Apple Health metrics actually authorized and available to the user.
- **Derived**: Mathematical functions of specified input measurements and user baseline.
- **Formal**: Properties proven within stated model assumptions, not clinical validation.
- **Empirical**: Specific biological claims supported by appropriate testing.
- Do not present Go / Caution / Recover as commands or as medical diagnoses.
- Do not invent evidence levels, publication citations, current product features, or clinical validation.

## Discovery checks

- Google Search Console: indexing, page impressions, clicks, and query discovery.
- Bing Webmaster Tools: indexing and search query performance.
- Website analytics: educational landing-page usage and outbound App Store clicks where instrumented and privacy-appropriate.
- App Store installs require separate attribution; website clicks are not installation counts.
- No rankings, AI assistant mentions, or indexing guarantees are implied by markup.

Search Console reporting is account-dependent and is **not** part of this repository.

## Foundational reading paths

- `/understand/physiological-timing.html`: timing, phase, and observation order.
- `/understand/physiological-coherence.html`: relationships among sampled signals and inference limits.
- `/understand/personal-baselines.html`: rolling personal reference and missing data.
- `/understand/health-as-capacity.html`: response, adaptation, recovery, and boundaries.
- `/understand/measurements-and-inference.html`: observed / calculated / interpreted / formally checked / empirically tested.

Use the same labels and scoped evidence statements in future updates. All public pages remain under `/understand/` with canonical URLs on membrane-health.com.
