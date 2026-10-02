import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-slate-900">
      <a href="/" aria-label="Innovsol home">
        <img
          src="/images/logo.png"
          alt="Innovsol"
          width={168}
          height={70}
          className="h-14 w-auto"
        />
      </a>
      <main className="mt-8 max-w-lg text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-blue-700">Error 404</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">We can't find that page</h1>
        <p className="mt-3 text-slate-600">
          The page may have moved or the address may be mistyped. Here are some places to start:
        </p>
        <nav
          aria-label="Helpful links"
          className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-semibold"
        >
          <a className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700" href="/">
            Home
          </a>
          <a
            className="rounded-md border border-slate-300 bg-white px-4 py-2 hover:bg-slate-100"
            href="/services.html"
          >
            Services
          </a>
          <a
            className="rounded-md border border-slate-300 bg-white px-4 py-2 hover:bg-slate-100"
            href="/#industries"
          >
            Industries
          </a>
          <a
            className="rounded-md border border-slate-300 bg-white px-4 py-2 hover:bg-slate-100"
            href="/careers"
          >
            Careers
          </a>
          <a
            className="rounded-md border border-slate-300 bg-white px-4 py-2 hover:bg-slate-100"
            href="/#contact-form"
          >
            Contact us
          </a>
        </nav>
      </main>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Innovsol | Enterprise AI Engineering & Digital Transformation" },
      {
        name: "description",
        content:
          "Innovsol delivers enterprise-grade AI, product engineering and forward-deployed engineering for banking, healthcare, retail, telecom, insurance, GCCs and startups.",
      },
      { name: "author", content: "Innovsol" },
      { name: "theme-color", content: "#3f6cb5" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:site_name", content: "Innovsol" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { property: "og:image", content: "https://innovsol.ai/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://innovsol.ai/og-image.jpg" },
    ],
    scripts: [{ src: "/shell/site-extras.js", defer: true }],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
