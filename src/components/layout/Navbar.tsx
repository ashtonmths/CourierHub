"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSignedIn, user } = useUser();

  const [resolvedRole, setResolvedRole] = useState<string | undefined>(
    user?.publicMetadata?.role as string | undefined
  );

  useEffect(() => {
    if (!isSignedIn) return;

    const loadRole = async () => {
      try {
        const res = await fetch('/api/role-sync', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { role?: string | null };
        setResolvedRole(data.role || (user?.publicMetadata?.role as string | undefined));
      } catch {
        setResolvedRole(user?.publicMetadata?.role as string | undefined);
      }
    };

    loadRole();
  }, [isSignedIn, user?.publicMetadata]);

  const getDashboardUrl = () => {
    switch (isSignedIn ? resolvedRole : undefined) {
      case "ADMIN":
        return "/admin";
      case "AGENT":
        return "/agent";
      case "CUSTOMER":
      default:
        return "/customer";
    }
  };

  // Define all possible nav links
  const allNavLinks = [
    { label: "Home", path: "/", public: true },
    { label: "Create Shipment", path: "/create-shipment", public: true },
    { label: "Track", path: "/track", public: true },
    { label: "Dashboard", path: getDashboardUrl(), roles: ["CUSTOMER", "AGENT", "ADMIN"] },
  ];

  // Filter nav links based on authentication and role
  const navLinks = allNavLinks.filter((link) => {
    // Show public links to everyone
    if (link.public) return true;
    
    // Show protected links only to authenticated users with correct role
    if (isSignedIn && link.roles) {
      return link.roles.includes(resolvedRole || "");
    }
    
    return false;
  });

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Package className="h-5 w-5" />
          </div>
          CourierHub
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.path}
              href={l.path}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname === l.path
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
          
          <ThemeToggle />
          
          {/* Authentication buttons */}
          {isSignedIn ? (
            <div className="ml-2">
              <UserButton />
            </div>
          ) : (
            <div className="ml-2 flex gap-2">
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </SignInButton>
              <SignInButton mode="modal">
                <Button size="sm">
                  Sign Up
                </Button>
              </SignInButton>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 md:hidden">
          {isSignedIn && <UserButton />}
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-card px-4 pb-4 md:hidden">
          {navLinks.map((l) => (
            <Link
              key={l.path}
              href={l.path}
              onClick={() => setMobileOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname === l.path
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
          
          {/* Mobile authentication buttons */}
          {!isSignedIn && (
            <div className="mt-4 flex flex-col gap-2">
              <SignInButton mode="modal">
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </SignInButton>
              <SignInButton mode="modal">
                <Button className="w-full">
                  Sign Up
                </Button>
              </SignInButton>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
