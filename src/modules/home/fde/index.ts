import type { Module } from "../../../lib/page";
import fdeCss from "./fde.css?raw";
import fdeHtml from "./fde.html?raw";

export const fde: Module = { html: fdeHtml, css: fdeCss };
