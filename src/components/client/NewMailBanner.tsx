"use client";


import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRealtimeUpdates } from "./useRealtimeUpdates";

interface NewMailBannerProps {
  userEmail: string;
  unreadCount: number;
  onMarkAsRead: () => void;
}

export function NewMailBanner({ userEmail, unreadCount, onMarkAsRead }: NewMailBannerProps) {
  const event = useRealtimeUpdates();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (event) setVisible(true);
  }, [event]);

  if (!visible || !event) return null;

  const message = event.type === "new_email" 
    ? `${unreadCount} new email${unreadCount !== 1 ? "s" : ""} in your inbox` 
    : "Calendar events have been updated";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        className="relative group mb-6 overflow-hidden"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
        <div className="relative bg-zinc-900/80 backdrop-blur-md border border-blue-500/20 rounded-2xl px-5 py-4 flex items-center justify-between shadow-xl shadow-blue-950/20">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Bell className="h-4 w-4 animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 font-bold">Realtime Notification</p>
              <p className="text-sm text-zinc-200 mt-0.5 font-medium">{message}</p>
              <p className="text-xs text-zinc-400 mt-1">{userEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {event.type === "new_email" && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  onMarkAsRead();
                  setVisible(false);
                }}
                className="bg-green-600 hover:bg-green-500 text-white border-none rounded-xl h-8 px-3 text-xs gap-1.5 font-semibold transition-all shadow-md shadow-green-900/20"
              >
                Mark as Read
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                router.refresh();
                setVisible(false);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white border-none rounded-xl h-8 px-3 text-xs gap-1.5 font-semibold transition-all shadow-md shadow-blue-900/20"
            >
              <RefreshCw className="h-3 w-3" />
              Sync Workspace
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setVisible(false)}
              className="h-8 w-8 text-zinc-500 hover:text-zinc-300 rounded-xl"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}