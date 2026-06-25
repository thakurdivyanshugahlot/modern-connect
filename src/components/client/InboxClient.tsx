"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  archiveMessageAction,
  trashMessageAction,
  getInboxMessagesAction,
} from "@/app/actions/gmail";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Search,
  Filter,
  MoreHorizontal,
  Star,
  Paperclip,
  Inbox as InboxIcon,
  Archive,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTimezone } from "@/hooks/useTimezone";

interface CachedMessage {
  id: string;
  subject: string;
  from: string;
  to: string;
  snippet: string;
  body: string;
  htmlBody?: string;
  createdAt: string;
  labelIds: string[];
}

// Format in the user's actual timezone (passed in from useTimezone). On the
// server / first client render this is the "Asia/Kolkata" fallback so the two
// renders match; the timestamp node carries suppressHydrationWarning so the
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

export default function InboxClient({
  messages: initialMessages,
}: {
  messages: CachedMessage[];
}) {
  const userTimezone = useTimezone();
  const queryClient = useQueryClient();
  const QUERY_KEY = ["inbox"] as const;

  // Seed the cache with the server-rendered list so there's no loading flash.
  const { data: messages = [] } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getInboxMessagesAction,
    initialData: initialMessages,
    staleTime: 30_000,
  });

  // Shared optimistic-removal lifecycle for both archive and delete.
  const removeOptimistically = {
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<CachedMessage[]>(QUERY_KEY);
      queryClient.setQueryData<CachedMessage[]>(QUERY_KEY, (old) =>
        (old ?? []).filter((m) => m.id !== id)
      );
      return { previous };
    },
    onError: (
      _err: unknown,
      _id: string,
      context: { previous?: CachedMessage[] } | undefined
    ) => {
      // Roll the row back if the server call failed.
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    // No onSettled refetch: the read path hits the corsair DB cache which can
    // lag the live Gmail API, so refetching could resurrect a just-removed row.
    // Optimistic state stays authoritative until the next full navigation /
    // 30s revalidation / SSE refresh reconciles.
  };

  const archive = useMutation({
    mutationFn: archiveMessageAction,
    ...removeOptimistically,
  });

  const trash = useMutation({
    mutationFn: trashMessageAction,
    ...removeOptimistically,
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className="flex-1 bg-zinc-950 text-zinc-100 h-full min-h-0 overflow-hidden flex flex-col">
      {/* Inbox Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-md">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <InboxIcon className="h-5 w-5 text-blue-500" />
            <h1 className="text-sm font-semibold text-zinc-100">Inbox</h1>
            <Badge variant="secondary" className="bg-blue-600/10 text-blue-400 border-none font-bold text-[10px] px-2 h-5">
              {messages.length}
            </Badge>
          </div>

          <div className="max-w-md w-full ml-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <Input
                className="bg-zinc-900/50 border-zinc-800 h-9 pl-9 text-xs placeholder:text-zinc-600 focus-visible:ring-blue-500/20 rounded-xl"
                placeholder="Search messages..."
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger render={
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
                <Filter className="h-4 w-4" />
              </Button>
            } />
            <TooltipContent>Filter</TooltipContent>
          </Tooltip>
          <div className="h-4 w-px bg-zinc-800 mx-1" />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="h-12 border-b border-zinc-800/50 flex items-center px-6 bg-zinc-950/30 gap-2 shrink-0">
        <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 h-8 px-2">
          Select All
        </Button>
        <div className="h-3 w-px bg-zinc-800 mx-2" />
        <Tooltip>
          <TooltipTrigger render={
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-300">
              <Archive className="h-4 w-4" />
            </Button>
          } />
          <TooltipContent>Archive</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-400">
              <Trash2 className="h-4 w-4" />
            </Button>
          } />
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-blue-400">
              <Clock className="h-4 w-4" />
            </Button>
          } />
          <TooltipContent>Snooze</TooltipContent>
        </Tooltip>
      </div>

      {/* Message List */}
      <ScrollArea className="flex-1 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="h-16 w-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
              <InboxIcon className="h-8 w-8 text-zinc-700" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-300">Your inbox is clear</h3>
            <p className="text-xs text-zinc-500 mt-1">Great job! You've reached inbox zero.</p>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="divide-y divide-zinc-800/40"
          >
            {messages.map((msg) => {
              const senderName = (msg.from ?? "").replace(/<.*?>/, "").trim();
              const initials = senderName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
              const isUnread = msg.labelIds?.includes("UNREAD");

              return (
                <motion.div key={msg.id} variants={item}>
                  <Link
                    href={`/gmail/${msg.id}`}
                    className={`flex items-center gap-4 px-6 py-4 hover:bg-zinc-900/40 transition-all group relative ${isUnread ? 'bg-blue-600/[0.02]' : ''}`}
                  >
                    {isUnread && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500" />
                    )}

                    <div className="flex items-center gap-3 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-700 group-hover:text-zinc-500 transition-colors">
                        <Star className="h-4 w-4" />
                      </Button>
                      <Avatar className="h-9 w-9 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                        <AvatarFallback className={`text-[10px] font-bold ${isUnread ? 'bg-blue-600/10 text-blue-400' : 'bg-zinc-900 text-zinc-500'}`}>
                          {initials || "?"}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className={`md:col-span-3 truncate text-sm ${isUnread ? 'font-bold text-zinc-100' : 'text-zinc-400'}`}>
                        {senderName}
                      </div>

                      <div className="md:col-span-7 flex items-center gap-2 min-w-0">
                        <div className={`truncate text-sm ${isUnread ? 'text-zinc-200' : 'text-zinc-500'}`}>
                          <span className={isUnread ? 'font-semibold' : ''}>{msg.subject}</span>
                          <span className="text-zinc-600 mx-1">—</span>
                          <span className="text-zinc-600">{msg.snippet}</span>
                        </div>
                        {msg.snippet?.includes('attach') && (
                          <Paperclip className="h-3 w-3 text-zinc-700 shrink-0" />
                        )}
                      </div>

                      <div className="md:col-span-2 text-right">
                        <span suppressHydrationWarning className={`text-[10px] font-medium tracking-tight ${isUnread ? 'text-blue-400' : 'text-zinc-600'}`}>
                          {formatDate(msg.createdAt, userTimezone)}
                        </span>
                      </div>
                    </div>

                    <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800 shadow-xl">
                       <Button
                        variant="ghost"
                        size="icon"
                        disabled={archive.isPending}
                        onClick={(e) => {
                          // Buttons sit inside the row <Link>; stop navigation.
                          e.preventDefault();
                          e.stopPropagation();
                          archive.mutate(msg.id);
                        }}
                        className="h-7 w-7 text-zinc-500 hover:text-white"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={trash.isPending}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          trash.mutate(msg.id);
                        }}
                        className="h-7 w-7 text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </ScrollArea>
    </div>
  );
}