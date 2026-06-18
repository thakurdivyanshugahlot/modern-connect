import Link from "next/link";
import { auth } from "@/server/lib/auth";
import { headers } from "next/headers";
import { SignInButton } from "@/component/SignInButton";
import { SignOutButton } from "@/component/SignOutButton";
import { Sparkles, Mail, Calendar, Shield, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Mail,
    title: "AI-Powered Inbox",
    desc: "Read, summarize, and prioritize your messages seamlessly through an intelligent chat interface.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Calendar,
    title: "Autonomous Scheduling",
    desc: "Manage your meetings, discover agenda insights, and create events using natural language.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    desc: "Credentials are fully encrypted by Corsair. Your private data is never stored on our servers.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
];

export default async function LandingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      {/* Decorative Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Logo Mark */}
      <div className="w-14 h-14 rounded-2xl border border-zinc-800 bg-zinc-900 flex items-center justify-center mb-8 shadow-xl relative z-10">
        <Sparkles className="h-6 w-6 text-blue-500 animate-pulse" />
      </div>

      {/* Heading */}
      <div className="text-center max-w-2xl relative z-10 mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          Your Workspace, Accelerated
        </h1>
        <p className="text-base sm:text-lg text-zinc-400 max-w-lg mx-auto leading-relaxed">
          An AI-native dashboard connecting Gmail and Calendar into one fluid, conversation-forward assistant.
        </p>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        {session ? (
          <div className="flex flex-col items-center gap-4 bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl backdrop-blur-md shadow-2xl">
            <p className="text-sm text-zinc-400">
              Authenticated as <span className="text-zinc-200 font-medium">{session.user.email}</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Link
                href="/chat"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <SignOutButton />
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/30 border border-zinc-800/80 p-4 rounded-2xl backdrop-blur-sm">
            <SignInButton />
          </div>
        )}
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 w-full max-w-4xl relative z-10">
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-6 backdrop-blur-sm hover:border-zinc-800 transition-colors group"
          >
            <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <f.icon className={`h-5 w-5 ${f.color}`} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-2">{f.title}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer Branding */}
      <div className="mt-24 text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-bold z-10">
        Powered by Gemini & Corsair
      </div>
    </main>
  );
}
