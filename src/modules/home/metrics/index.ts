import type { Module } from "../../../lib/page";
import metricsCss from "./metrics.css?raw";
import metricsHtml from "./metrics.html?raw";

export const metrics: Module = { html: metricsHtml, css: metricsCss };
