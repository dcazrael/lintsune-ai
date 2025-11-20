import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [sveltekit(), tailwindcss()],
    test: {
        // Required for SvelteKit with Vite 7+
        // Ensures that SvelteKit's virtual modules ($app, __sveltekit) are properly resolved
        server: {
            deps: {
                inline: [/@sveltejs\/kit/],
            },
        },
    },
});
