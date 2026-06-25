"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Reply,
  Forward,
  Trash2,
  Archive,
  MoreVertical,
  Star,
  Clock,
  Printer,
  ExternalLink,
  ChevronDown,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EmailBody } from "./EmailBody";
import { useTimezone } from "@/hooks/useTimezone";


interface CachedMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date?: string;
  createdAt?: Date | string | null;
  snippet: string;
  body: string;
  htmlBody?: string;
}

export default function MessageDetailClient({ message }: { message: CachedMessage }) {
  const userTimezone = useTimezone();
  const senderName = (message.from ?? "").replace(/<.*?>/, "").trim();
  const initials = senderName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  // Format in the user's actual timezone. First render uses the "Asia/Kolkata"
  // fallback (matches the server); the date node has suppressHydrationWarning so
  // the post-mount correction to the real timezone never trips React #418.
  const displayDate = message.date ?? (message.createdAt ? new Date(message.createdAt).toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: userTimezone,
  }) : "Unknown Date");

  return (
    <div className="flex-1 bg-zinc-950 text-zinc-100 h-full min-h-0 overflow-hidden flex flex-col">
      {/* Detail Header / Toolbar */}
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/gmail">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="h-4 w-px bg-zinc-800 mx-1" />
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger render={
                <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-white">
                  <Archive className="h-4 w-4" />
                </Button>
              } />
              <TooltipContent>Archive</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger render={
                <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </Button>
              } />
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger render={
                <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-blue-400">
                  <Clock className="h-4 w-4" />
                </Button>
              } />
              <TooltipContent>Snooze</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-xs text-zinc-500 hover:text-white gap-2 h-9 px-3">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-white">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 min-h-0">
        <main className="max-w-4xl mx-auto px-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Subject Line */}
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
                  {message.subject}
                </h1>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-zinc-900 text-zinc-500 border-zinc-800 text-[9px] uppercase font-bold tracking-wider">Inbox</Badge>
                  <Badge variant="outline" className="border-blue-500/20 bg-blue-500/5 text-blue-400 text-[9px] uppercase font-bold tracking-wider">Workspace Sync</Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-700 hover:text-amber-400 transition-colors">
                <Star className="h-5 w-5" />
              </Button>
            </div>

            {/* Sender Info Card */}
            <Card className="bg-zinc-900/30 border-zinc-800/50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border border-zinc-800">
                      <AvatarFallback className="bg-blue-600/10 text-blue-400 text-sm font-bold">
                        {initials || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-zinc-100">{senderName}</span>
                        <span className="text-xs text-zinc-500 font-medium truncate max-w-[200px] md:max-w-md opacity-70">
                          &lt;{message.from.match(/<(.*)>/)?.[1] ?? message.from}&gt;
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-zinc-500 font-medium">to {message.to.split('<')[0] || 'me'}</span>
                        <ChevronDown className="h-3 w-3 text-zinc-600" />
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p suppressHydrationWarning className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{displayDate}</p>
                    <div className="flex justify-end gap-1 mt-2">
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white rounded-lg">
                        <Reply className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white rounded-lg">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Message Body */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl relative group">
              {/* If HTML, we use the iframe. If plain, we wrap in a themed container */}
              <div className={message.htmlBody ? "" : "p-8 md:p-12"}>
                <EmailBody message={message} />
              </div>

              {/* Actions Footer */}
              <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex flex-wrap gap-3">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 font-semibold px-6 transition-all active:scale-95 shadow-lg shadow-blue-600/20">
                  <Reply className="h-4 w-4" />
                  Reply
                </Button>
                <Button variant="outline" className="border-zinc-200 text-zinc-700 hover:bg-zinc-100 rounded-xl gap-2 font-semibold px-6 transition-all">
                  <Forward className="h-4 w-4" />
                  Forward
                </Button>
              </div>
            </div>

            {/* AI Assistant Context Quick Actions */}
            <div className="pt-8 border-t border-zinc-900">
               <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">AI Quick Actions</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/50 transition-all text-left group">
                  <div>
                    <p className="text-xs font-semibold text-zinc-200 group-hover:text-blue-400 transition-colors">Summarize Thread</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Get the key points from this conversation</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-zinc-700 group-hover:text-zinc-500" />
                </button>
                <button className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-purple-500/50 transition-all text-left group">
                  <div>
                    <p className="text-xs font-semibold text-zinc-200 group-hover:text-purple-400 transition-colors">Create Calendar Event</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Schedule based on message content</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-zinc-700 group-hover:text-zinc-500" />
                </button>
              </div>
            </div>
          </motion.div>
        </main>
      </ScrollArea>
    </div>
  );
}