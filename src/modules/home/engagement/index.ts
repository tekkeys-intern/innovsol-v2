import type { Module } from "../../../lib/page";
import engagementCss from "./engagement.css?raw";
import engagementHtml from "./engagement.html?raw";
import engagementJs from "./engagement.js?raw";

export const engagement: Module = { html: engagementHtml, css: engagementCss, js: engagementJs };
