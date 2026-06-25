import type { Metadata } from "next";
import Image from "next/image";
import {
  Sparkles,
  Inbox,
  Calendar,
  ArrowRight,
  Zap,
  Lock,
  Globe,
  Check,
  Link,
} from "lucide-react";


import { headers } from "next/headers";
import { auth } from "@/server/lib/auth";
import { Reveal } from "./_components/reveal";
import { GetStartedButton } from "./_components/get-started-button";
import { UserMenu } from "./_components/user-menu";

type SessionUser = { name?: string | null; email?: string | null } | null;


export const metadata: Metadata = {
  title: "Modern Connect — Your AI-Powered Workspace, Unified",
  description:
    "Manage Gmail and Google Calendar with an AI assistant that reads, sends, and organizes — all in one place.",
  openGraph: {
    title: "Modern Connect — Your AI-Powered Workspace, Unified",
    description:
      "Manage Gmail and Google Calendar with an AI assistant that reads, sends, and organizes — all in one place.",
    type: "website",
    url: "https://your-domain.com",
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "https://your-domain.com" },
};



function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-7 w-7 place-items-center rounded-md bg-(--gradient-brand) shadow-(--shadow-glow)">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <span className="text-sm font-semibold tracking-tight">Modern Connect</span>
    </div>
  );
}

function Nav({ user }: { user: SessionUser }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#" className="transition-colors hover:text-foreground">GitHub</a>
        </nav>
        {user ? (
          <UserMenu name={user.name} email={user.email} />
        ) : (
          <GetStartedButton className="inline-flex h-8 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90">
            Get Started
          </GetStartedButton>
        )}
      </div>
    </header>
  );
}

function Hero({ user }: { user: SessionUser }) {
  return (
    <section className="relative overflow-hidden pt-32 pb-20">
      <div className="absolute inset-0 bg-grid mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
      <div
        className="absolute inset-0"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="relative mx-auto max-w-6xl px-6 text-center">
        <a
          href="#"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_8px_var(--brand)]" />
          Now in public beta
          <ArrowRight className="h-3 w-3" />
        </a>
        <h1 className="mx-auto mt-6 max-w-3xl text-balance text-5xl font-bold tracking-tight text-gradient sm:text-6xl md:text-7xl">
          Your AI-Powered Workspace, Unified
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
          Manage Gmail and Google Calendar with an AI assistant that reads, sends,
          and organizes — all in one place.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <a
              href="/gmail/dashboard"
              className="group inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-medium text-primary-foreground shadow-(--shadow-glow) transition-transform hover:scale-[1.02]"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          ) : (
            <GetStartedButton className="group inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-medium text-primary-foreground shadow-(--shadow-glow) transition-transform hover:scale-[1.02]">
              Get Started Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </GetStartedButton>
          )}
          <a
            href="#features"
            className="inline-flex h-11 items-center rounded-lg border border-border bg-card/40 px-5 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-card"
          >
            View Demo
          </a>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl" data-reveal>
          <div className="absolute inset-x-10 -top-10 h-40 rounded-full bg-brand/30 blur-3xl" />
          <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-(--shadow-card)">
            <Image
              src="/dashboard-mockup.jpg"
              alt="Modern Connect dashboard showing Gmail, AI chat and Google Calendar"
              width={1600}
              height={1024}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Sparkles,
    title: "AI Chat Assistant",
    desc: "Ask it to send emails, summarize threads, or find meetings. It just works.",
  },
  {
    icon: Inbox,
    title: "Real-Time Inbox",
    desc: "Live Gmail sync via webhooks. New emails appear instantly, no refresh needed.",
  },
  {
    icon: Calendar,
    title: "Smart Calendar",
    desc: "See today's agenda alongside your inbox. Never miss a meeting.",
  },
];

function Features() {
  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center" data-reveal>
          <p className="text-sm font-medium text-brand">Features</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Everything in one window
          </h2>
          <p className="mt-4 text-muted-foreground">
            Stop juggling tabs. Modern Connect brings Gmail, Calendar and AI together.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              data-reveal
              style={{ transitionDelay: `${i * 80}ms` }}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-(--shadow-card) transition-colors hover:border-brand/40"
            >
              <div className="absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-brand/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-accent">
                <f.icon className="h-5 w-5 text-brand" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  { n: "01", title: "Connect your Google account", desc: "One-click OAuth. We never store your password." },
  { n: "02", title: "Your inbox and calendar sync instantly", desc: "Real-time webhooks keep everything fresh." },
  { n: "03", title: "Chat with your AI assistant", desc: "Just ask. Send mail, schedule meetings, summarize threads." },
];

function HowItWorks() {
  return (
    <section id="how" className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center" data-reveal>
          <p className="text-sm font-medium text-brand">How it works</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Three steps to a calmer inbox
          </h2>
        </div>

        <div className="relative mt-14 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.n}
              data-reveal
              style={{ transitionDelay: `${i * 80}ms` }}
              className="relative rounded-xl border border-border bg-card p-6 shadow-(--shadow-card)"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">{s.n}</span>
                <Check className="h-4 w-4 text-brand" />
              </div>
              <h3 className="mt-6 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const stats = [
  { icon: Zap, label: "Real-time sync" },
  { icon: Sparkles, label: "AI-powered" },
  { icon: Lock, label: "Zero ads" },
  { icon: Globe, label: "Open source" },
];

function Stats() {
  return (
    <section className="border-y border-border bg-card/30 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4" data-reveal>
          {stats.map((s) => (
            <div key={s.label} className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <s.icon className="h-4 w-4 text-brand" />
              <span className="font-medium text-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA({ user }: { user: SessionUser }) {
  return (
    <section id="cta" className="relative py-28">
      <div className="mx-auto max-w-4xl px-6">
        <div
          className="relative overflow-hidden rounded-2xl border border-border bg-card p-12 text-center shadow-(--shadow-card)"
          data-reveal
        >
          <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
          <div className="relative">
            <h2 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Ready to take back your inbox?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              Join the early users building a calmer, faster way to work.
            </p>
            {user ? (
              <a
                href="/gmail/dashboard"
                className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-6 text-sm font-medium text-primary-foreground shadow-(--shadow-glow) transition-transform hover:scale-[1.02]"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </a>
            ) : (
              <GetStartedButton className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-6 text-sm font-medium text-primary-foreground shadow-(--shadow-glow) transition-transform hover:scale-[1.02]">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </GetStartedButton>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
        <div>
          <Logo />
          <p className="mt-2 text-xs text-muted-foreground">
            The AI workspace for Gmail and Calendar.
          </p>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
            <Link className="h-4 w-4" /> GitHub
          </a>
          <a href="#" className="transition-colors hover:text-foreground">Privacy</a>
          <a href="#" className="transition-colors hover:text-foreground">Contact</a>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Modern Connect. All rights reserved.
      </p>
    </footer>
  );
}



export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user: SessionUser = session?.user
    ? { name: session.user.name, email: session.user.email }
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Reveal /> {/* mounts the IntersectionObserver, renders nothing */}
      <Nav user={user} />
      <main>
        <Hero user={user} />
        <Features />
        <HowItWorks />
        <Stats />
        <CTA user={user} />
      </main>
      <Footer />
    </div>
  );
}