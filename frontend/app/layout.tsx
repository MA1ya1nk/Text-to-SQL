import "./globals.css";
import Link from "next/link";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const links = [
    { href: "/", label: "Assistant" },
    { href: "/schema", label: "Schema" },
    { href: "/history", label: "History" },
    { href: "/favorites", label: "Favorites" }
  ];

  return (
    <html lang="en">
      <body>
        <div className="page-shell">
          <header className="sticky top-0 z-30 border-b border-white/50 bg-white/60 backdrop-blur-xl">
            <nav className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
              <div className="text-base font-semibold sm:text-lg">
                <span className="gradient-title">SQL Assistant</span>
              </div>
              <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 text-sm sm:w-auto sm:overflow-visible sm:pb-0">
                {links.map((link) => (
                  <Link key={link.href} href={link.href} className="ghost-btn shrink-0 whitespace-nowrap">
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>
          </header>
          <main className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
