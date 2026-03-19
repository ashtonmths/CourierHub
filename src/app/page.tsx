"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Package, MapPin, Shield, Zap, ArrowRight, Truck, Globe, Mail, Phone, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";

const features = [
  { icon: <Zap className="h-6 w-6" />, title: "Fast Delivery", desc: "Same-day and next-day delivery options available for urgent packages." },
  { icon: <MapPin className="h-6 w-6" />, title: "Real-time Tracking", desc: "Track your shipment at every step with live status updates." },
  { icon: <Shield className="h-6 w-6" />, title: "Secure Shipping", desc: "End-to-end package protection with insurance coverage." },
];

const pricing = [
  { name: "Standard", price: "₹249", time: "3-5 business days", features: ["Up to 10kg", "Basic tracking", "Email notifications"] },
  { name: "Express", price: "₹499", time: "1-2 business days", features: ["Up to 25kg", "Real-time tracking", "SMS + Email alerts", "Priority handling"], popular: true },
  { name: "Premium", price: "₹999", time: "Same day", features: ["Up to 50kg", "Live GPS tracking", "Dedicated agent", "Insurance included"] },
];

const Index = () => {
  const { isSignedIn, user } = useUser();
  
  // Get user role from Clerk metadata
  const userRole = user?.publicMetadata?.role as string | undefined;
  
  // Get dashboard URL based on role
  const getDashboardUrl = () => {
    switch (userRole) {
      case 'ADMIN':
        return '/admin';
      case 'AGENT':
        return '/agent';
      case 'CUSTOMER':
        return '/customer';
      default:
        return '/customer';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[image:var(--gradient-hero)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(25_95%_53%/0.08),transparent_60%)]" />
        <div className="relative mx-auto flex min-h-[85vh] max-w-7xl flex-col items-center justify-center px-4 py-20 text-center lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm text-primary-foreground">
              <Truck className="h-4 w-4" />
              Trusted by 10,000+ businesses across India
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl md:text-7xl">
              Fast & Reliable
              <br />
              <span className="text-gradient">Courier Service</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/70">
              Ship packages across India with real-time tracking, secure handling, and guaranteed delivery times.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              {isSignedIn ? (
                // Show dashboard button for authenticated users
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow">
                  <Link href={getDashboardUrl()}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                // Show create shipment button for non-authenticated users
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow">
                  <Link href="/create-shipment">
                    Send a Package <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="lg" className="border-primary-foreground/20 text-black dark:text-white hover:bg-primary-foreground/10">
                <Link href="/track">Track Shipment</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Why Choose CourierHub?</h2>
            <p className="mt-4 text-muted-foreground">Everything you need for seamless package delivery</p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="group rounded-2xl border bg-card p-8 shadow-card transition-all hover:shadow-elevated"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  {f.icon}
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold">{f.title}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-muted-foreground">Choose the delivery speed that works for you</p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {pricing.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`relative rounded-2xl border p-8 ${
                  plan.popular
                    ? "border-accent bg-card shadow-elevated ring-2 ring-accent/20"
                    : "bg-card shadow-card"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                    Most Popular
                  </div>
                )}
                <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.time}</p>
                <p className="mt-4 font-display text-4xl font-bold">{plan.price}</p>
                <p className="text-sm text-muted-foreground">per package</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className={`mt-8 w-full ${plan.popular ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`} variant={plan.popular ? "default" : "outline"}>
                  <Link href="/create-shipment">Get Started</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-4 lg:px-8">
          <div>
            <div className="flex items-center gap-2 font-display text-xl font-bold">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Package className="h-5 w-5" />
              </div>
              CourierHub
            </div>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Your trusted partner for fast, reliable, and secure courier services across India.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Quick Links</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/create-shipment" className="hover:text-foreground">Send Package</Link></li>
              <li><Link href="/track" className="hover:text-foreground">Track Shipment</Link></li>
              <li>
                <Link
                  href={isSignedIn ? getDashboardUrl() : "/sign-in?redirect_url=/customer"}
                  className="hover:text-foreground"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Contact</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +91-1800-120-2233</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> support@courierhub.in</li>
              <li className="flex items-center gap-2"><Globe className="h-4 w-4" /> courierhub.in</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Follow Us</h4>
            <div className="mt-4 flex gap-3">
              {["Twitter", "LinkedIn", "Facebook"].map((s) => (
                <div key={s} className="flex h-10 w-10 items-center justify-center rounded-lg border text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer">
                  {s[0]}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-7xl border-t px-4 pt-8 text-center text-sm text-muted-foreground lg:px-8">
          © 2024 CourierHub. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
