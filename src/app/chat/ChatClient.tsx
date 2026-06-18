"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Mail, 
  Calendar as CalendarIcon, 
  Sparkles,
  RefreshCcw,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  {
    icon: Mail,
    text: "Summarize my unread emails",
    color: "text-blue-400",
    bg: "bg-blue-400/10"
  },
  {
    icon: CalendarIcon,
    text: "What's on my agenda today?",
    color: "text-purple-400",
    bg: "bg-purple-400/10"
  },
  {
    icon: Sparkles,
    text: "Draft a reply to the last email from HR",
    color: "text-amber-400",
    bg: "bg-amber-400/10"
  }
];

export default function ChatClient({
  userEmail,
  userName,
}: {
  userEmail: string;
  userName: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading]);

  async function send(text?: string) {
    const messageToSend = text ?? input;
    if (!messageToSend.trim() || loading) return;

    const userText = messageToSend.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, history }),
      });

      const data = await res.json();

      if (data.error) {
         setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response ?? "I couldn't process that request." },
        ]);
        setHistory(data.history ?? []);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please check your connection." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full w-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-100">AI Assistant</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Ready to help</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-400 font-normal">
              IST Timezone
            </Badge>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-8 pb-10">
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center mt-20"
              >
                <div className="h-16 w-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-6">
                  <Sparkles className="h-8 w-8 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">How can I help you today, {userName.split(' ')[0]}?</h2>
                <p className="text-zinc-500 max-w-md mb-12">
                  I'm your intelligent assistant for Gmail and Calendar. I can help you manage your inbox, schedule meetings, and more.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                  {suggestions.map((suggestion, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => send(suggestion.text)}
                      className="group p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-900 transition-all text-left"
                    >
                      <div className={`h-8 w-8 rounded-lg ${suggestion.bg} flex items-center justify-center mb-4`}>
                        <suggestion.icon className={`h-4 w-4 ${suggestion.color}`} />
                      </div>
                      <p className="text-xs font-medium text-zinc-300 group-hover:text-zinc-100 leading-snug">
                        {suggestion.text}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="popLayout">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <Avatar className={`h-8 w-8 border ${msg.role === "user" ? "border-zinc-700" : "border-blue-900/50"}`}>
                    {msg.role === "user" ? (
                      <AvatarFallback className="bg-zinc-800 text-[10px]"><User className="h-4 w-4" /></AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-blue-600/20 text-blue-500"><Bot className="h-4 w-4" /></AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`px-5 py-4 rounded-3xl text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-tr-sm shadow-lg shadow-blue-900/20"
                          : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm shadow-xl"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <Avatar className="h-8 w-8 border border-blue-900/50">
                  <AvatarFallback className="bg-blue-600/20 text-blue-500">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-zinc-900 border border-zinc-800 px-5 py-4 rounded-3xl rounded-tl-sm flex items-center gap-3 shadow-xl">
                  <div className="flex gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Thinking...</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 pt-0">
          <div className="max-w-3xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500" />
              <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl flex items-end p-2 transition-all group-focus-within:border-zinc-700">
                <div className="flex-1 flex flex-col p-2">
                  <textarea
                    rows={1}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm text-zinc-100 placeholder-zinc-500 resize-none max-h-40 py-2 px-2 outline-none"
                    placeholder="Ask about your emails or calendar..."
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    disabled={loading}
                  />
                  <div className="flex items-center justify-between mt-2 px-2">
                    <div className="flex items-center gap-2">
                       <Tooltip>
                        <TooltipTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10">
                            <Mail className="h-4 w-4" />
                          </Button>
                        } />
                        <TooltipContent side="top">Reference Emails</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-purple-400 hover:bg-purple-400/10">
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        } />
                        <TooltipContent side="top">Reference Calendar</TooltipContent>
                      </Tooltip>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => send()} 
                      disabled={loading || !input.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 px-4 transition-all active:scale-95"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-[10px] text-zinc-600 mt-4 uppercase tracking-[0.2em] font-bold">
              AI-Powered Workflow · Modern Connect
            </p>
          </div>
        </div>
      </div>

      {/* Context Sidebar (Desktop Only) */}
      <aside className="hidden lg:flex w-80 border-l border-zinc-800 flex-col bg-zinc-950">
        <header className="h-16 border-b border-zinc-800 flex items-center px-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Workspace Insight</h2>
        </header>
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-zinc-400 flex items-center gap-2">
                  <CalendarIcon className="h-3 w-3" /> Upcoming Today
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 group cursor-pointer">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                  <div>
                    <p className="text-xs font-medium text-zinc-200 group-hover:text-blue-400 transition-colors">Project Sync</p>
                    <p className="text-[10px] text-zinc-500">2:30 PM - 3:30 PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 group cursor-pointer">
                  <div className="h-2 w-2 rounded-full bg-purple-500 mt-1.5" />
                  <div>
                    <p className="text-xs font-medium text-zinc-200 group-hover:text-purple-400 transition-colors">Design Review</p>
                    <p className="text-[10px] text-zinc-500">4:00 PM - 5:00 PM</p>
                  </div>
                </div>
                <Button variant="ghost" className="w-full justify-start text-[10px] text-zinc-500 h-8 hover:text-zinc-300">
                  View full calendar <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-zinc-400 flex items-center gap-2">
                  <Mail className="h-3 w-3" /> Recent Unread
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-zinc-200 line-clamp-1">Alex Rivier</p>
                  <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">Regarding the feedback on the latest PR, I think we should...</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-zinc-200 line-clamp-1">GitHub Notifications</p>
                  <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">[Merged] feat: Add AI chat context providers</p>
                </div>
                <Button variant="ghost" className="w-full justify-start text-[10px] text-zinc-500 h-8 hover:text-zinc-300">
                  Check inbox <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </aside>
    </div>
  );
}
