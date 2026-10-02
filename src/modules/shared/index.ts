import type { Module } from "../../lib/page";
import baseCss from "./base.css?raw";
import effectsJs from "./effects.js?raw";
import componentsCss from "./components.css?raw";
import clickableJs from "./clickable.js?raw";
import responsiveCss from "./responsive.css?raw";

export const base: Module = { css: baseCss };
export const responsive: Module = { css: responsiveCss };
export const effects: Module = { js: effectsJs };
/** Reusable interactive states + data-href / data-topic click handling. */
export const components: Module = { css: componentsCss, js: clickableJs };
