import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

/**
 * OpenNext for Cloudflare Workers.
 *
 * ColorCraft har ingen database og ingen innlogging. Alle sidene gjengis ferdig
 * ved bygg, og alt annet skjer i nettleseren. Derfor den skrivebeskyttede
 * cachen: den serverer de forhåndsgjengitte sidene rett fra workerens egne
 * assets, uten R2, D1 eller revalideringskø. Mal: jobbsokerassistenten.
 */
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
