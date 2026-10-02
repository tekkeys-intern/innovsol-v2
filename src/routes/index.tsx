import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { homePage } from "../pages/home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Innovsol | Innovate · Adopt · Transform" },
      {
        name: "description",
        content:
          "Innovsol delivers enterprise-grade product engineering, AI, and digital transformation services. Innovate. Adopt. Transform.",
      },
      { property: "og:title", content: "Innovsol | Innovate · Adopt · Transform" },
      { property: "og:url", content: "https://innovsol.ai/" },
      {
        property: "og:description",
        content: "Enterprise product engineering, AI, and digital transformation services.",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://innovsol.ai/#org",
              name: "Innovsol",
              url: "https://innovsol.ai",
              logo: "https://innovsol.ai/images/logo.png",
              email: "hello@innovsol.ai",
              telephone: "+91 95827 99988",
              slogan: "Innovate. Adopt. Transform.",
              contactPoint: [
                {
                  "@type": "ContactPoint",
                  contactType: "sales",
                  email: "hello@innovsol.ai",
                  telephone: "+91 95827 99988",
                  availableLanguage: ["English"],
                },
              ],
            },
            {
              "@type": "WebSite",
              "@id": "https://innovsol.ai/#website",
              url: "https://innovsol.ai",
              name: "Innovsol",
              publisher: { "@id": "https://innovsol.ai/#org" },
            },
          ],
        }),
      },
    ],
    links: [
      { rel: "canonical", href: "https://innovsol.ai/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
      },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    const el = document.createElement("script");
    el.type = "text/javascript";
    el.text = homePage.js;
    document.body.appendChild(el);
    // Body HTML is injected after load, so the browser can't scroll to a #hash on arrival
    const hash = window.location.hash.slice(1);
    let t: number | undefined;
    if (hash) {
      t = window.setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
    return () => {
      window.clearTimeout(t);
      el.remove();
      // Reset guard so the script re-initialises on remount
      (window as any).__reelInit = false;
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: homePage.css }} />
      <div dangerouslySetInnerHTML={{ __html: homePage.html }} />
    </>
  );
}
