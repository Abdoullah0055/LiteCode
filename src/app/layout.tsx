import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "LiteCode — Le code change tout",
    template: "%s · LiteCode",
  },
  description: "Apprends JavaScript pas à pas avec 80 activités originales.",
  applicationName: "LiteCode",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "LiteCode" },
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#58d92c",
  interactiveWidget: "resizes-content",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <div className="brand-strip" aria-hidden="true">
          <span>{"{ }"}</span>LiteCode
        </div>
        {children}
      </body>
    </html>
  );
}
