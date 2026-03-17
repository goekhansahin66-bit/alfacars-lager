export const metadata = {
  title: 'ALFACARS ERP',
  description: 'Reifen & Felgen Management System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#06060B" />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
