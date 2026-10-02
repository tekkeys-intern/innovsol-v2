import type { Module } from "../../../lib/page";
import footerCss from "./footer.css?raw";
import footerHtml from "./footer.html?raw";

export const footer = (base = ""): Module => ({
  html: footerHtml.replaceAll('href="#', `href="${base}#`),
  css: footerCss,
});
