import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { PeachBoot, BOOT_TICK_JS } from "@/components/kt/peach-boot";
import { PREFS_BOOT_JS } from "@/lib/i18n";
import appCss from "../styles.css?url";

const APP_NAME = "Leo Tree";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "description", content: "保存和整理个人知识树的本机应用。" },
      { name: "theme-color", content: "#8b3a2a" },
      { name: "apple-mobile-web-app-title", content: APP_NAME },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "preload", as: "image", href: "/theme/boot-cover.jpg" },
      { rel: "preload", as: "image", href: "/theme/shan-shui.jpg" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-180.png" },
    ],
  }),
  component: () => (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PeachBoot />
        <script
          dangerouslySetInnerHTML={{
            // Boot progress plus the saved font/locale preference, applied before
            // hydration so the first paint already matches the user's setting.
            __html: "window.__LEO_BOOT_AT=Date.now();" + BOOT_TICK_JS + PREFS_BOOT_JS,
          }}
        />
        <Outlet />
        <Scripts />
      </body>
    </html>
  ),
});
