import type { Module } from "../../../lib/page";
import widgetsCss from "./widgets.css?raw";
import widgetsHtml from "./widgets.html?raw";

export const widgets: Module = { html: widgetsHtml, css: widgetsCss };
