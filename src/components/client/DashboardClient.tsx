"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mail,
  Send,
  FileText,
  Settings,
  Plus,
  Tag,
  Calendar as CalendarIcon,
  ChevronRight,
  Sparkles,
  ExternalLink
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NewMailBanner } from "./NewMailBanner";
import { useTimezone } from "@/hooks/useTimezone";

interface DashboardProps {
  userEmail: string;
  recentMessages: any[];
  unreadCount: number;
  sentToday: number;
  draftCount: number;
  labels: any[];
  todayEvents: any[];
}

// Format in the user's actual timezone (passed in from useTimezone). On the
// server / first client render this is the "Asia/Kolkata" fallback so the two
// renders match; the timestamp nodes carry suppressHydrationWarning so the
// post-mount correction to the real timezone never trips React #418.
function isSameDayInTz(a: Date, b: Date, tz: string): boolean {
  const key = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: tz });
  return key(a) === key(b);
}

function formatDate(dateStr: string, tz: string): string {
  try {
    const date = new Date(dateStr);
    const isToday = isSameDayInTz(date, new Date(), tz);
    if (isToday) {
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: tz,
      });
    }
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      timeZone: tz,
    });
  } catch {
    return dateStr;
  }
}

function formatEventTime(start: any, isAllDay: boolean, tz: string): string {
  if (isAllDay) return "All day";
  const date = new Date(start);
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
  });
}

export default function DashboardClient({ userEmail, recentMessages, unreadCount, sentToday, draftCount, labels, todayEvents }: DashboardProps) {
  const userTimezone = useTimezone();
  const stats = [
    { label: "Unread", value: unreadCount, sub: "in inbox", icon: Mail, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Sent Today", value: sentToday, sub: "messages", icon: Send, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "Drafts", value: draftCount, sub: "unsent", icon: FileText, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Sync Status", value: "Live", sub: "Gmail connected", icon: Sparkles, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex-1 bg-zinc-950 text-zinc-100 h-full min-h-0 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Settings className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-100">Workspace Dashboard</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{userEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/gmail/compose">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-9 px-4 font-semibold shadow-lg shadow-blue-900/20 gap-2">
              <Plus className="h-4 w-4" />
              Compose
            </Button>
          </Link>
        </div>
      </header>

      <NewMailBanner
        userEmail={userEmail}
        unreadCount={unreadCount}
        onMarkAsRead={() => {
          // This would be implemented with a server action or API route in a real app
          console.log("Mark as read clicked");
        }}
      />

      <ScrollArea className="flex-1 min-h-0">
        <main className="max-w-6xl mx-auto px-8 py-10">
          {/* Stats Grid */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {stats.map((stat, i) => (
              <motion.div key={i} variants={item}>
                <Card className="bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/60 transition-colors group">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <Badge variant="outline" className="border-zinc-800 text-zinc-500 text-[10px] uppercase font-bold tracking-tight">Realtime</Badge>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{stat.label}</p>
                      <h3 className="text-3xl font-bold text-white mt-1">{stat.value}</h3>
                      <p className="text-[10px] text-zinc-600 mt-1 font-medium">{stat.sub}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Recent Messages */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-8"
            >
              <Card className="bg-zinc-900/40 border-zinc-800 h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-800/50">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-400" />
                    Recent Messages
                  </CardTitle>
                  <Link href="/gmail">
                    <Button variant="ghost" size="sm" className="text-xs text-zinc-500 hover:text-white gap-1 h-8">
                      View Inbox <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  {recentMessages.length === 0 ? (
                    <div className="py-20 text-center">
                      <p className="text-sm text-zinc-500">Your inbox is clear.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-800/50">
                      {recentMessages.map((msg, i) => {
                        const senderName = (msg.from ?? "").replace(/<.*?>/, "").trim();
                        const initials = senderName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

                        return (
                          <Link key={msg.id} href={`/gmail/${msg.id}`} className="flex items-center gap-4 p-4 hover:bg-zinc-800/40 transition-all group">
                            <Avatar className="h-10 w-10 border border-zinc-800">
                              <AvatarFallback className="bg-zinc-800 text-zinc-400 group-hover:bg-blue-600/10 group-hover:text-blue-400 transition-colors text-xs font-bold">
                                {initials || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-sm font-semibold text-zinc-100 truncate">{senderName}</span>
                                <span suppressHydrationWarning className="text-[10px] text-zinc-600 font-medium">{formatDate(msg.createdAt, userTimezone)}</span>
                              </div>
                              <p className="text-xs text-zinc-400 truncate group-hover:text-zinc-300 transition-colors">{msg.subject}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Side Column: Events & Labels */}
            <div className="lg:col-span-4 space-y-6">
              {/* Today's Events */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="bg-zinc-900/40 border-zinc-800">
                  <CardHeader className="pb-4 border-b border-zinc-800/50">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-purple-400" />
                      Today's Agenda
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {todayEvents.length === 0 ? (
                      <p className="text-xs text-zinc-600 py-4 text-center">No meetings today.</p>
                    ) : (
                      <div className="space-y-3">
                        {todayEvents.map((event) => (
                          <div key={event.id} className="flex items-start gap-3 group cursor-pointer p-2 rounded-xl hover:bg-zinc-800/50 transition-colors">
                            <div className="h-2 w-2 rounded-full bg-purple-500 mt-1.5 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-zinc-200 group-hover:text-purple-400 transition-colors truncate">{event.summary}</p>
                              <p suppressHydrationWarning className="text-[10px] text-zinc-500 mt-0.5 font-medium">{formatEventTime(event.start, event.isAllDay, userTimezone)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <Link href="/calendar">
                      <Button variant="ghost" className="w-full justify-start text-[10px] text-zinc-500 h-8 hover:text-zinc-300 font-bold uppercase tracking-widest px-2 mt-2">
                        Open Calendar <ExternalLink className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Labels */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="bg-zinc-900/40 border-zinc-800">
                  <CardHeader className="pb-4 border-b border-zinc-800/50">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Tag className="h-4 w-4 text-amber-400" />
                      Workspace Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {labels.length === 0 ? (
                      <p className="text-xs text-zinc-600 py-4 text-center">No tags defined.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {labels.slice(0, 10).map((label) => (
                          <div
                            key={label.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700 transition-colors group cursor-default"
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-zinc-600 group-hover:bg-amber-400 transition-colors" />
                            <span className="text-[10px] font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors uppercase tracking-wider">{label.name}</span>
                            {label.messagesUnread > 0 && (
                              <span className="ml-1 text-[9px] font-bold text-amber-500/80">{label.messagesUnread}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </main>
      </ScrollArea>
    </div>
  );
}