export const MAX_PAGES = 50;
export const MAX_ACTION_PAYLOAD_BYTES = 64_000; // 64 KB per css action payload
export const MAX_SCREENSHOT_UPLOAD_BYTES = 10_000_000; // 10 MB per uploaded PNG

export const HIDE_SIDEBAR_CSS = `
  aside[data-sidebar-open] { display: none !important; }
  .main-content { margin-left: 0 !important; }
`;
