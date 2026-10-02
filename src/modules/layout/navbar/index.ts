import type { Module } from "../../../lib/page";
import activeLinkJs from "./active-link.js?raw";
import navbarCss from "./navbar.css?raw";
import navbarHtml from "./navbar.html?raw";
import navbarJs from "./navbar.js?raw";

/** `base` prefixes in-page anchors: "" on the home page, "/" on other pages. */
export const navbar = (base = ""): Module => ({
  html: navbarHtml.replaceAll('href="#', `href="${base}#`),
  css: navbarCss,
  js: navbarJs,
});

/** Highlights the current section in the nav (home page only). */
export const navActiveLink: Module = { js: activeLinkJs };
