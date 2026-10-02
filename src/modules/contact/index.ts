import type { Module } from "../../lib/page";
import contactCss from "./contact.css?raw";
import contactHtml from "./contact.html?raw";
import contactJs from "./contact.js?raw";

export const contact: Module = { html: contactHtml, css: contactCss, js: contactJs };
