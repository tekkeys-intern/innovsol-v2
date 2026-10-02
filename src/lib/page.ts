/** A self-contained piece of the site. Every field is optional. */
export interface Module {
  html?: string;
  css?: string;
  js?: string;
}

export interface Page {
  html: string;
  css: string;
  js: string;
}

/**
 * Joins modules into one page. HTML and JS follow the order of `modules`;
 * CSS follows it too unless `css` is given (cascade order can matter).
 */
export function composePage(modules: Module[], opts: { css?: Module[] } = {}): Page {
  const join = (list: Module[], k: keyof Module) => list.map((m) => m[k] ?? "").join("");
  return {
    html: join(modules, "html"),
    css: join(opts.css ?? modules, "css"),
    js: join(modules, "js"),
  };
}
