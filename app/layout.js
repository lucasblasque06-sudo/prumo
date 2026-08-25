export const metadata = {
  title: "Prumo — Casa Dona Maria Cândida",
  description: "Controle financeiro de obra",
  manifest: "/manifest.json",
  robots: "noindex, nofollow",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Prumo",
  },
};

export const viewport = {
  themeColor: "#1E2A32",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap"
        />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
