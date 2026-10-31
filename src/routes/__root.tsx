import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "OthersPe — Scan any UPI QR & send a payment link · by Sannan (Mohammed Sannan V S)";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: APP_NAME },
      {
        name: "description",
        content: "OthersPe by Sannan (Mohammed Sannan V S): scan any UPI QR, set an amount, and share a zero-server pay page with CRED and UPI deep links.",
      },
      { name: "theme-color", content: "#c7e941" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "format-detection", content: "telephone=no" },
      { property: "og:title", content: "OthersPe — Scan any UPI QR & send a payment link · by Sannan (Mohammed Sannan V S)" },
      { property: "og:type", content: "website" },
      {
        property: "og:description",
        content:
          "Scan a merchant UPI QR, set an amount, share a pay page so someone else can pay — CRED, any UPI app, or scan the QR.",
      },
      { property: "og:url", content: "https://otherspe.vercel.app/" },
      { property: "og:image", content: "https://otherspe.vercel.app/og.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://otherspe.vercel.app/og.jpg" },
    ],
    links: [
      { rel: "canonical", href: "https://otherspe.vercel.app/" },
      { rel: "icon", href: "/favicon.ico?v=2", sizes: "any" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png?v=2" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg?v=2" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png?v=2" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: "{\"@context\": \"https://schema.org\", \"@type\": \"SoftwareApplication\", \"name\": \"OthersPe\", \"applicationCategory\": \"FinanceApplication\", \"operatingSystem\": \"Web, Android, iOS\", \"url\": \"https://otherspe.vercel.app/\", \"image\": \"https://otherspe.vercel.app/og.jpg\", \"description\": \"Scan any merchant or personal UPI QR, set an exact rupee amount, and share a zero-server pay page with CRED and Android UPI intent deep links. Built by Sannan (Mohammed Sannan V S).\", \"offers\": {\"@type\": \"Offer\", \"price\": \"0\", \"priceCurrency\": \"INR\"}, \"author\": {\"@type\": \"Person\", \"@id\": \"https://msannan.vercel.app/#sannan\", \"name\": \"Mohammed Sannan V S\", \"givenName\": \"Sannan\", \"additionalName\": \"Mohammed\", \"alternateName\": [\"Sannan\", \"Mohammed Sannan\", \"Mohammed Sannan V S\", \"Sannan V S\", \"m-sannan\", \"sannanvs\"], \"description\": \"Sannan (Mohammed Sannan V S) is a Product Manager at Alyve Health and builder in Bangalore.\", \"jobTitle\": \"Product Manager\", \"url\": \"https://msannan.vercel.app/\", \"sameAs\": [\"https://msannan.vercel.app/\", \"https://www.linkedin.com/in/mohammedsannan/\", \"https://github.com/m-sannan\", \"https://m-sannan.github.io/\", \"https://x.com/sannanvs\", \"https://www.producthunt.com/@sannan\", \"https://www.figma.com/@mohammedsannanv\", \"https://chromewebstore.google.com/detail/staycheck/mjgdchcpacfmgocenlemmbecmcbiahkb\", \"https://otherspe.vercel.app/\", \"https://ps5-shelf.vercel.app/\"]}}",
          }}
        />
        <script
          defer
          data-website-id="3d222m043m3a5e1f"
          src="https://minilytics.msannan121.workers.dev/js/script.js"
        />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
          <Toaster
            theme="light"
            position="top-center"
            toastOptions={{
              style: {
                background: "#111111",
                border: "none",
                color: "#c7e941",
              },
            }}
          />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
