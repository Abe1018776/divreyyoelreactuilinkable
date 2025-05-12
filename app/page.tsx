"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// Types
interface PassageContent { passage_id: string; passage_content: string; }
interface DvarTorahItem { dvar_torah_id: string; title: string; summary: string; contents: PassageContent[]; }

export default function Page() {
  // Data & selection state (replace fetch logic as in your existing effects)
  const [summaryText, setSummaryText] = useState<string>("תקציר דוגמה...");
  const [fullText, setFullText] = useState<string>("כולל טקסט מלא של דבר התורה בפונט רשי...");
  const [showFull, setShowFull] = useState(false);

  const [availableTypes, setAvailableTypes] = useState<string[]>(["Torah", "Moadim"]);
  const [selectedType, setSelectedType] = useState<string>("Torah");

  const [availableSedarim, setAvailableSedarim] = useState<string[]>([]);
  const [selectedSeder, setSelectedSeder] = useState<string>("");

  const [availableItems, setAvailableItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>("");

  const [book, setBook] = useState<DvarTorahItem[]>([]);
  const [selectedDvar, setSelectedDvar] = useState<DvarTorahItem | undefined>();

  // TODO: Insert your useEffect data-fetching logic here to populate summaryText, fullText, availableSedarim, availableItems, book, etc.

  return (
    <div className="bg-background text-foreground">
      {/* Banner */}
      <header className="bg-gray-100 py-6 mb-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-3xl font-bold">
            ספר דברי יואל – אוסף דברי תורה
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            דברי תורה מאת רב"ק מסאטמאר זי"ע
          </p>
        </div>
      </header>

      {/* Main + Sidebar Grid */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-[1fr,250px] gap-6 mb-8">
        {/* LEFT: Summary / Full Text */}
        <main className="space-y-6">
          <article className={cn("prose max-w-none p-4 bg-white rounded-lg shadow", showFull ? "prose-rtl font-rashi" : "")}>
            {showFull ? fullText : summaryText}
          </article>
          <div className="text-center">
            <Button variant="outline" onClick={() => setShowFull((f) => !f)}>
              {showFull ? "הצג תקציר" : <><FileText className="ml-2 h-4 w-4" />קרא את כל דבר התורה</>}
            </Button>
          </div>
        </main>

        {/* RIGHT: Filters & Navigation */}
        <aside className="space-y-5">
          {/* Type Selector */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">סוג</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full"><SelectValue placeholder="בחר סוג" /></SelectTrigger>
              <SelectContent>
                {availableTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t === "Torah" ? "תורה" : "מועדים"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seder (if Torah) or first-level items */}
          {selectedType === "Torah" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">ספר</label>
              <Select value={selectedSeder} onValueChange={setSelectedSeder}>
                <SelectTrigger className="w-full"><SelectValue placeholder="בחר ספר" /></SelectTrigger>
                <SelectContent>
                  {availableSedarim.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Parsha/Moed selector */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {selectedType === "Torah" ? "פרשה" : "מועד"}
            </label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger className="w-full"><SelectValue placeholder={`בחר ${selectedType === "Torah" ? "פרשה" : "מועד"}`} /></SelectTrigger>
              <SelectContent>
                {availableItems.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* List of Dvar Torah Titles */}
          <div className="text-xs font-medium text-muted-foreground">דברי תורה</div>
          <ScrollArea className="h-[calc(100vh-420px)] overflow-y-auto">
            <div className="space-y-1">
              {book.map((d) => (
                <Button
                  key={d.dvar_torah_id}
                  variant={selectedDvar?.dvar_torah_id === d.dvar_torah_id ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full text-right"
                  onClick={() => setSelectedDvar(d)}
                >
                  {d.title}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}
