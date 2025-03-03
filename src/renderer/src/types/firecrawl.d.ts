declare module '@mendable/firecrawl-js' {
  export interface ScrapeResponse {
    success: boolean;
    error?: string;
    markdown?: string;
    html?: string;
  }

  export default class FirecrawlApp {
    constructor(config: { apiKey: string | undefined });
    scrapeUrl(url: string, options: { formats: string[] }): Promise<ScrapeResponse>;
  }
}