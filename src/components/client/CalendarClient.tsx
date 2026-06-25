"use client";

import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Users,
  Video,
  MoreHorizontal,
  Clock,
  Sparkles,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { type ParsedEvent } from "@/server/lib/calendar-utils";
import { CreateEventButton } from "./CreateEventButton";

interface CalendarProps {
  userId: string;
  groupedEvents: Record<string, ParsedEvent[]>;
  totalCount: number;
}

function formatEventTime(start: string, isAllDay: boolean): string {
  if (isAllDay) return "All day";
  const date = new Date(start);
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

export default function CalendarClient({ userId, groupedEvents, totalCount }: CalendarProps) {
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
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex-1 bg-zinc-950 text-zinc-100 h-full min-h-0 overflow-hidden flex flex-col">
      {/* Calendar Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-950/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-purple-500" />
            <h1 className="text-sm font-semibold text-zinc-100">Calendar</h1>
            <Badge variant="secondary" className="bg-purple-600/10 text-purple-400 border-none font-bold text-[10px] px-2 h-5">
              Next 7 Days
            </Badge>
          </div>
          <div className="h-4 w-px bg-zinc-800 mx-2" />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-3">
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <Tooltip>
            <TooltipTrigger render={
              <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-white">
                <Search className="h-4 w-4" />
              </Button>
            } />
            <TooltipContent>Search Events</TooltipContent>
          </Tooltip>
          <CreateEventButton userId={userId} />
        </div>
      </header>

      <ScrollArea className="flex-1 min-h-0">
        <main className="max-w-4xl mx-auto px-8 py-10">
          {totalCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="h-20 w-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
                <CalendarIcon className="h-10 w-10 text-zinc-700" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-200">No upcoming events</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-xs mx-auto leading-relaxed">Your schedule is currently clear for the next 7 days. Use the AI to schedule a new meeting!</p>
              <Button className="mt-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl gap-2 font-semibold">
                <Sparkles className="h-4 w-4 text-purple-400" />
                Schedule with AI
              </Button>
            </div>
          ) : (
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-12"
            >
              {Object.entries(groupedEvents).map(([date, dayEvents], i) => {
                const dateObj = new Date(date);
                const isToday = dateObj.toDateString() === new Date().toDateString();

                return (
                  <motion.div key={date} variants={item} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-xl flex flex-col items-center justify-center border ${isToday ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/20' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400'}`}>
                        <span className="text-[10px] font-bold uppercase leading-none opacity-80">{dateObj.toLocaleDateString("en-IN", { weekday: "short" })}</span>
                        <span className="text-lg font-bold leading-none mt-0.5">{dateObj.getDate()}</span>
                      </div>
                      <div className="flex-1">
                        <h2 className={`text-sm font-bold uppercase tracking-widest ${isToday ? 'text-purple-400' : 'text-zinc-500'}`}>
                          {isToday ? "Today" : dateObj.toLocaleDateString("en-IN", { month: "long", day: "numeric" })}
                        </h2>
                        <div className="h-px flex-1 bg-zinc-800/50 mt-2" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 pl-14">
                      {dayEvents.map((event) => (
                        <Card key={event.id} className="bg-zinc-900/30 border-zinc-800/50 hover:bg-zinc-900/60 transition-all group border-l-2 border-l-purple-500/50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-purple-400 transition-colors truncate">
                                    {event.summary}
                                  </h3>
                                  {event.hangoutLink && (
                                    <Badge variant="outline" className="h-5 px-1.5 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-[9px] uppercase font-bold tracking-tight gap-1">
                                      <Video className="h-2.5 w-2.5" /> Meet
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-zinc-500">
                                  <div className="flex items-center gap-1.5 font-medium">
                                    <Clock className="h-3.5 w-3.5 opacity-70" />
                                    {event.isAllDay ? "All Day" : `${formatEventTime(event.start, false)} – ${formatEventTime(event.end, false)}`}
                                  </div>
                                  {event.location && (
                                    <div className="flex items-center gap-1.5 truncate">
                                      <MapPin className="h-3.5 w-3.5 opacity-70" />
                                      {event.location}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {event.hangoutLink && (
                                  <a href={event.hangoutLink} target="_blank" rel="noopener noreferrer">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10 rounded-lg">
                                      <Video className="h-4 w-4" />
                                    </Button>
                                  </a>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white rounded-lg">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {event.attendees.length > 0 && (
                              <div className="mt-4 flex items-center justify-between">
                                <div className="flex -space-x-2">
                                  {event.attendees.slice(0, 4).map((a, idx) => (
                                    <Tooltip key={idx}>
                                      <TooltipTrigger render={
                                        <Avatar className="h-7 w-7 border-2 border-zinc-900 ring-1 ring-zinc-800">
                                          <AvatarFallback className="bg-zinc-800 text-[8px] font-bold text-zinc-400">
                                            {(a.name ?? a.email)[0].toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                      } />
                                      <TooltipContent>{a.name ?? a.email}</TooltipContent>
                                    </Tooltip>
                                  ))}
                                  {event.attendees.length > 4 && (
                                    <div className="h-7 w-7 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-[8px] font-bold text-zinc-500 ring-1 ring-zinc-800">
                                      +{event.attendees.length - 4}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                                  <Users className="h-3 w-3" />
                                  {event.attendees.length} Attendees
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </main>
      </ScrollArea>
    </div>
  );
}