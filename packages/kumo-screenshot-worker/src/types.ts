export interface Env {
  BROWSER: Fetcher;
  API_KEY: string;
  SCREENSHOTS: R2Bucket;
}

export interface PageAction {
  type: "click" | "wait" | "hover" | "css";
  selector?: string;
  // For "wait": how long to pause (ms). For other types: extra delay after the action (ms).
  waitAfter?: number;
  css?: string;
  timeout?: number;
}

export interface PageConfig {
  url: string;
  actions?: PageAction[];
  fullPage?: boolean;
  selector?: string;
  viewport?: { width: number; height: number };
  hideSidebar?: boolean;
  captureSections?: boolean;
  sectionSelector?: string;
}

export interface StorageConfig {
  prefix: string;
  includeImage?: boolean;
}

export interface BatchRequest {
  baseUrl: string;
  pages: PageConfig[];
  viewport?: { width: number; height: number };
  hideSidebar?: boolean;
  storage?: StorageConfig;
}

export interface ScreenshotResult {
  url: string;
  sectionId?: string;
  sectionTitle?: string;
  image?: string;
  imageKey?: string;
  imageUrl?: string;
  error?: string;
  debug?: {
    dimensions?: { width: number; height: number };
    viewport?: { width: number; height: number };
  };
}
