import type { Module } from "../../../lib/page";
import heroCss from "./hero.css?raw";
import heroHtml from "./hero.html?raw";
import heroJs from "./hero.js?raw";

export const hero: Module = { html: heroHtml, css: heroCss, js: heroJs };
