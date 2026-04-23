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
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <div className="text-base font-semibold">
                <span className="gradient-title">SQL Assistant</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {links.map((link) => (
                  <Link key={link.href} href={link.href} className="ghost-btn">
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-7xl p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
