import type { Module } from "../../../lib/page";
import logoStripCss from "./logo-strip.css?raw";
import logoStripHtml from "./logo-strip.html?raw";

export const logoStrip: Module = { html: logoStripHtml, css: logoStripCss };
