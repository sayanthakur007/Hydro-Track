import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: process.env.NETLIFY ? undefined : "standalone",
	outputFileTracingRoot: process.cwd(),
	turbopack: {
		root: process.cwd(),
	},
};

export default nextConfig;
