import { defineConfig } from "vite";

export default defineConfig({
    root: ".",
    publicDir: "public",
    build: {
	outDir: "../dist",
	emptyOutDir: true,
    },
    server: {
	port: 1337,
	proxy: {
	    "/api": "http://localhost:6969"
	}
    }
});
