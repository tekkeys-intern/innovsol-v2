import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { careersPage } from "../pages/careers";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers | Innovsol — Build AI That Actually Ships" },
      {
        name: "description",
        content:
          "Join the Innovsol FDE team. Build enterprise AI that ships to production. View open roles in AI engineering, ML, data engineering, strategy and more.",
      },
      { property: "og:title", content: "Careers | Innovsol" },
      { property: "og:url", content: "https://innovsol.ai/careers" },
      {
        property: "og:description",
        content:
          "Embed inside Fortune 500s. Write code that hits production. See your AI running in the real world, fast.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://innovsol.ai/careers" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
      },
    ],
  }),
  component: Careers,
});

function Careers() {
  useEffect(() => {
    const el = document.createElement("script");
    el.type = "text/javascript";
    el.text = careersPage.js;
    document.body.appendChild(el);
    // Fallback dialog when a mailto: link can't open an email app
    const fb = document.createElement("script");
    fb.src = "/mailto-fallback.js";
    document.body.appendChild(fb);
    return () => {
      el.remove();
      fb.remove();
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: careersPage.css }} />
      <div dangerouslySetInnerHTML={{ __html: careersPage.html }} />
    </>
  );
}
