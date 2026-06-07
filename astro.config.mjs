import sidebarData from "./sidebar.json"; // Sidebar navigation structure
import sitemap from "@astrojs/sitemap"; // Generates sitemap.xml for SEO
import starlight from "@astrojs/starlight"; // Documentation theme/framework
import starlightVideos from "starlight-videos"; // Video embedding plugin for Starlight
import tailwind from "@astrojs/tailwind"; // Tailwind CSS integration
import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";

// Production canonical host. Dev builds set PUBLIC_SITE_URL to the dev host so
// they never emit production canonicals (see anti-cannibalization controls).
const siteUrl = process.env.PUBLIC_SITE_URL || "https://simdocs.rconfig.com";
// Any host other than the production canonical is treated as non-indexable.
const isProd = siteUrl === "https://simdocs.rconfig.com";
// True under `astro dev` (the local plain-HTTP server); false for build/preview.
const isDevServer = process.argv.includes("dev");

// Analytics IDs are env-driven and OFF by default — the site ships clean until a
// dedicated GA4/GTM property is provisioned for the simulator. Do NOT reuse the
// core rConfig (docs.rconfig.com) GTM/GA properties here.
const googleTagManagerId = process.env.PUBLIC_GTM_CONTAINER_ID || "";
const analyticsEnabled = Boolean(googleTagManagerId);

// Content Security Policy. `frame-ancestors` is intentionally omitted — browsers
// ignore it when delivered via <meta>; enforce clickjacking protection at the
// Cloudflare response-header layer instead.
//
// `upgrade-insecure-requests` is included for built output (always served over
// https via Apache/Cloudflare) but OMITTED for the local `astro dev` server,
// which serves plain HTTP — otherwise the browser silently upgrades every
// in-page navigation to https://…:4321 and fails with ERR_SSL_PROTOCOL_ERROR.
const buildCsp = (upgradeInsecure) =>
	[
		"default-src 'self'",
		"base-uri 'self'",
		"object-src 'none'",
		"form-action 'self'",
		analyticsEnabled
			? "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://www.googletagmanager.com https://static.cloudflareinsights.com https://analytics.ahrefs.com"
			: "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://static.cloudflareinsights.com https://analytics.ahrefs.com",
		analyticsEnabled
			? "connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://region1.google-analytics.com https://stats.g.doubleclick.net https://cloudflareinsights.com https://static.cloudflareinsights.com https://analytics.ahrefs.com"
			: "connect-src 'self' https://cloudflareinsights.com https://static.cloudflareinsights.com https://analytics.ahrefs.com",
		"img-src 'self' https: data: blob:",
		"style-src 'self' 'unsafe-inline'",
		"font-src 'self' https: data:",
		"frame-src https://www.googletagmanager.com https://www.youtube.com https://www.youtube-nocookie.com",
		...(upgradeInsecure ? ["upgrade-insecure-requests"] : []),
	].join("; ");

// Head tags assembled conditionally so non-prod builds get noindex and the
// analytics scripts only load when an ID is configured. `upgradeInsecure` is
// false only for the local dev server (plain HTTP).
const buildHeadTags = (upgradeInsecure) => [
	{
		tag: "meta",
		attrs: {
			"http-equiv": "Content-Security-Policy",
			content: buildCsp(upgradeInsecure),
		},
	},
	// Social preview image (Open Graph + Twitter). Absolute URL so crawlers resolve it.
	{ tag: "meta", attrs: { property: "og:image", content: `${siteUrl}/og.png` } },
	{ tag: "meta", attrs: { property: "og:image:width", content: "1280" } },
	{ tag: "meta", attrs: { property: "og:image:height", content: "640" } },
	{ tag: "meta", attrs: { name: "twitter:card", content: "summary_large_image" } },
	{ tag: "meta", attrs: { name: "twitter:image", content: `${siteUrl}/og.png` } },
	// Ahrefs Web Analytics — production host only (keeps the noindex dev host out of stats).
	...(isProd
		? [
				{
					tag: "script",
					attrs: {
						src: "https://analytics.ahrefs.com/analytics.js",
						"data-key": "/19fCWTCKelr3HxkT6v8uQ",
						async: true,
					},
				},
			]
		: []),
	// Discoverability for search engines (prod only).
	...(isProd
		? [
				{
					tag: "link",
					attrs: {
						rel: "sitemap",
						type: "application/xml",
						title: "Sitemap",
						href: "/sitemap-index.xml",
					},
				},
			]
		: []),
	// Keep non-production hosts (e.g. simdocs.dev.rconfig.com) out of the index
	// so they never compete with the canonical site for the same content.
	...(!isProd
		? [
				{
					tag: "meta",
					attrs: { name: "robots", content: "noindex, nofollow" },
				},
			]
		: []),
	// Analytics — only emitted when a dedicated GTM container ID is provided.
	...(analyticsEnabled
		? [
				{
					tag: "link",
					attrs: {
						rel: "preconnect",
						href: "https://www.googletagmanager.com",
						crossorigin: "anonymous",
					},
				},
				{
					tag: "script",
					content: `
						window.dataLayer = window.dataLayer || [];
						function gtag(){dataLayer.push(arguments);}
						gtag('consent', 'default', {
							'ad_storage': 'granted',
							'ad_user_data': 'granted',
							'ad_personalization': 'granted',
							'analytics_storage': 'granted',
							'functionality_storage': 'granted',
							'personalization_storage': 'granted',
							'security_storage': 'granted',
							'wait_for_update': 500
						});
					`,
				},
				{
					tag: "script",
					content: `
						(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
						new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
						j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
						'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
						})(window,document,'script','dataLayer','${googleTagManagerId}');
					`,
				},
			]
		: []),
];

export default defineConfig({
	site: siteUrl,
	integrations: [
		sitemap(),
		starlight({
			title: "rcfg-sim",
			description:
				"rcfg-sim is an open-source, high-density Cisco IOS and multi-vendor SSH simulator for load-testing network automation and configuration tooling at 50,000+ devices on a single host.",
			disable404Route: false,
			tagline: "High-density network device SSH simulator",
			customCss: ["./src/assets/css/tailwind.css", "./src/assets/css/custom.css"],
			favicon: "/logo.png",
			// Official "Sim by rConfig" lockup. Gradient on the light theme, white on
			// dark. replacesTitle hides the text title in the header (the "rcfg-sim"
			// title is still used for <title>/SEO).
			logo: {
				light: "./src/assets/sim-logo-gradient.svg",
				dark: "./src/assets/sim-logo-white.svg",
				replacesTitle: true,
			},
			social: [
				{
					icon: "github",
					label: "GitHub",
					href: "https://github.com/rconfig/rconfig-sim",
				},
			],
			editLink: {
				baseUrl: "https://github.com/rconfig/rconfig-sim/edit/main/docs-site/",
			},
			head: buildHeadTags(!isDevServer),
			components: {
				SkipLink: "./src/components/starlight/SkipLink.astro",
				Footer: "./src/components/starlight/Footer.astro",
			},
			sidebar: sidebarData,
			plugins: [starlightVideos()],
		}),
		tailwind({ applyBaseStyles: false }),
	],
	vite: {
		resolve: {
			alias: {
				"@": fileURLToPath(new URL("./src", import.meta.url)),
			},
		},
	},
});
