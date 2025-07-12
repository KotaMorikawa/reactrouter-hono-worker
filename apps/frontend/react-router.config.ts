import type { Config } from "@react-router/dev/config";

export default {
	// Server-side render by default, to enable SPA mode set this to `false`
	ssr: true,
	// Configure for Cloudflare Workers deployment
	buildEnd({ viteConfig }) {
		// Additional build configuration for Workers can be added here
	},
	// Cloudflare Workers specific configuration
	buildDirectory: "build",
} satisfies Config;
