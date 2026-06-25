"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  X,
  Paperclip,
  Image as ImageIcon,
  Type,
  Smile,
  MoreVertical,
  Trash2,
  Sparkles,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

export default function ComposeForm() {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSend() {
    if (!to || !subject || !body) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });
      if (!res.ok) throw new Error("Send failed");
      setStatus("sent");
      setTimeout(() => {
        router.push("/gmail/dashboard");
      }, 1500);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <div className="flex-1 bg-zinc-950 text-zinc-100 h-full overflow-hidden flex flex-col">
      {/* Compose Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/gmail/dashboard">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="h-4 w-px bg-zinc-800 mx-1" />
          <h1 className="text-sm font-semibold text-zinc-100">New Message</h1>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger render={
              <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </Button>
            } />
            <TooltipContent>Discard draft</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-white">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <main className="max-w-4xl mx-auto px-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-0 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Form Fields */}
            <div className="p-2 space-y-1">
              <div className="flex items-center px-4 py-3 border-b border-zinc-800/50 group">
                <span className="text-xs font-bold text-zinc-500 w-12 uppercase tracking-wider">To</span>
                <input
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-zinc-200 placeholder:text-zinc-700 outline-none"
                  placeholder="recipient@example.com"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
                <div className="flex items-center gap-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                  <span className="text-[10px] font-bold text-zinc-600 cursor-pointer hover:text-zinc-400">Cc</span>
                  <span className="text-[10px] font-bold text-zinc-600 cursor-pointer hover:text-zinc-400">Bcc</span>
                </div>
              </div>

              <div className="flex items-center px-4 py-3 border-b border-zinc-800/50">
                <span className="text-xs font-bold text-zinc-500 w-12 uppercase tracking-wider">Sub</span>
                <input
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-zinc-200 placeholder:text-zinc-700 outline-none"
                  placeholder="What's this about?"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
            </div>

            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/50">
              <Tooltip>
                <TooltipTrigger render={
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800">
                    <Type className="h-4 w-4" />
                  </Button>
                } />
                <TooltipContent>Text style</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger render={
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                } />
                <TooltipContent>Attach files</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger render={
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                } />
                <TooltipContent>Insert image</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger render={
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800">
                    <Smile className="h-4 w-4" />
                  </Button>
                } />
                <TooltipContent>Emoji</TooltipContent>
              </Tooltip>

              <div className="flex-1" />

              <Badge variant="outline" className="border-blue-500/20 bg-blue-500/5 text-blue-400 text-[9px] uppercase font-bold tracking-wider gap-1 px-2 py-0.5">
                <Sparkles className="h-3 w-3" /> AI Assistant Active
              </Badge>
            </div>

            {/* Body */}
            <div className="p-6">
              <textarea
                className="w-full bg-transparent border-none focus:ring-0 text-sm text-zinc-200 placeholder:text-zinc-700 resize-none min-h-[300px] outline-none leading-relaxed"
                placeholder="Write your message here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-zinc-900/50 border-t border-zinc-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSend}
                  disabled={status === "sending" || !to || !subject || !body}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 font-semibold px-8 h-11 transition-all active:scale-95 shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:active:scale-100"
                >
                  {status === "sending" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>

                <Tooltip>
                  <TooltipTrigger render={
                    <Button variant="ghost" size="icon" className="h-11 w-11 text-blue-500 hover:bg-blue-500/10 rounded-xl border border-blue-500/20">
                      <Sparkles className="h-5 w-5" />
                    </Button>
                  } />
                  <TooltipContent>Refine with AI</TooltipContent>
                </Tooltip>
              </div>

              <AnimatePresence>
                {status === "sent" && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-emerald-500 font-bold text-sm"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    Message Sent!
                  </motion.div>
                )}
                {status === "error" && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-red-400 font-bold text-sm"
                  >
                    <AlertCircle className="h-5 w-5" />
                    Failed to send
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* AI Tips */}
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-zinc-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Smart Tips</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-900/20 border border-zinc-800/50">
                <p className="text-xs font-medium text-zinc-400 leading-relaxed">
                  <span className="text-blue-400 font-bold">Pro-tip:</span> Use the Sparkle button to let AI fix your grammar or change the tone of your email.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/20 border border-zinc-800/50">
                <p className="text-xs font-medium text-zinc-400 leading-relaxed">
                  <span className="text-purple-400 font-bold">Quick Send:</span> Press <kbd className="kbd-inline">Cmd + Enter</kbd> to send quickly.
                </p>
              </div>
            </div>
          </div>
        </main>
      </ScrollArea>
    </div>
  );
}