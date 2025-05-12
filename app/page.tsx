"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { FileText, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// --- Types ---
interface PassageContent {
  passage_id: string;
  passage_content: string;
}
interface DvarTorahItem {
  dvar_torah_id: string;
  title: string;
  summary: string;
  contents: PassageContent[];
}
interface SearchResultItem {
  dvar: DvarTorahItem;
  parsha: string;
  seder: string;
  type: string;
}

// --- Component ---
export default function Page() {
  const isMobile = useIsMobile();

  // Sidebar open on desktop, collapsed on mobile by default
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  // Filters state
  const [availableTypes] = useState<string[]>(["Torah", "Moadim"]);
  const [selectedType, setSelectedType] = useState<string>("Torah");

  const [availableSedarim, setAvailableSedarim] = useState<string[]>([]);
  const [selectedSeder, setSelectedSeder] = useState<string>("");

  const [availableItems, setAvailableItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>("");

  // Dvar Torah list + selection
  const [book, setBook] = useState<DvarTorahItem[]>([]);
  const [selectedDvar, setSelectedDvar] = useState<DvarTorahItem | undefined>();

  // Content loading state
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ------------------------------------------------------------------------
  // 1) Fetch Sedarim or Moadim list whenever selectedType changes
  useEffect(() => {
    setAvailableSedarim([]);
    setSelectedSeder("");
    setAvailableItems([]);
    setSelectedItem("");
    setBook([]);
    setSelectedDvar(undefined);

    if (selectedType === "Torah") {
      fetch("/api/sedarim")
        .then((r) => r.json())
        .then((data) => {
          setAvailableSedarim(data.sedarim || []);
          if (data.sedarim?.length) setSelectedSeder(data.sedarim[0]);
        });
    } else {
      fetch("/api/parshiot?type=Moadim")
        .then((r) => r.json())
        .then((data) => {
          setAvailableItems(data.parshiot || []);
          if (data.parshiot?.length) setSelectedItem(data.parshiot[0]);
        });
    }
  }, [selectedType]);

  // ------------------------------------------------------------------------
  // 2) Fetch Parshiot when selectedSeder changes (only for Torah)
  useEffect(() => {
    if (selectedType !== "Torah" || !selectedSeder) return;

    setAvailableItems([]);
    setSelectedItem("");
    setBook([]);
    setSelectedDvar(undefined);

    fetch(`/api/parshiot?type=Torah&seder=${encodeURIComponent(selectedSeder)}`)
      .then((r) => r.json())
      .then((data) => {
        setAvailableItems(data.parshiot || []);
        if (data.parshiot?.length) setSelectedItem(data.parshiot[0]);
      });
  }, [selectedType, selectedSeder]);

  // ------------------------------------------------------------------------
  // 3) Fetch content when selectedItem changes
  useEffect(() => {
    if (!selectedItem) {
      setBook([]);
      setSelectedDvar(undefined);
      return;
    }

    setIsContentLoading(true);
    const url =
      selectedType === "Torah"
        ? `/api/content?type=Torah&seder=${encodeURIComponent(
            selectedSeder
          )}&parsha=${encodeURIComponent(selectedItem)}`
        : `/api/content?type=Moadim&parsha=${encodeURIComponent(selectedItem)}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const contents = data.parsha?.contents || [];
        setBook(contents);
        if (contents.length) {
          // Each `contents` element is { passage_id, passage_content }
          // Wrap them to DvarTorahItem shape
          const items: DvarTorahItem[] = contents.map((c: any) => ({
            dvar_torah_id: c.passage_id,
            title: c.title || c.passage_id,
            summary: c.passage_content,
            contents: [c],
          }));
          setBook(items);
          setSelectedDvar(items[0]);
          setShowFullContent(false);
        } else {
          setSelectedDvar(undefined);
        }
      })
      .finally(() => setIsContentLoading(false));
  }, [selectedType, selectedSeder, selectedItem]);

  // ------------------------------------------------------------------------
  // 4) Search handler
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => {
        setSearchResults(data.results || []);
      })
      .finally(() => setIsSearching(false));
  };
  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setSearchResults([]);
  };

  // ------------------------------------------------------------------------
  // 5) Layout title
  const getMainTitle = () => {
    if (!selectedItem) return "";
    const base =
      selectedType === "Torah" ? selectedSeder : "מועדים";
    return `${base} - ${selectedItem}`;
  };

  // ------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Banner */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-5 text-center">
          <h1 className="text-3xl font-extrabold">
            ספר דברי יואל – אוסף דברי תורה
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            דברי תורה מאת רב"ק מסאטמאר זי"ע
          </p>
        </div>
      </header>

      {/* Two‑column grid (aside first for RTL right‑side) */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-[1fr,2fr] gap-8">
        {/* Sidebar */}
        <aside className="flex flex-col space-y-6">
          {/* Mobile collapsible */}
          <Collapsible
            open={isSidebarOpen}
            onOpenChange={setIsSidebarOpen}
            className="md:hidden"
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full">
                {isSidebarOpen ? <ChevronRight /> : <ChevronLeft />} ניווט
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="bg-white p-5 rounded-xl shadow space-y-5">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="חיפוש כותרות..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-3 top-3"
                      onClick={clearSearch}
                    >
                      <X />
                    </Button>
                  )}
                </div>

                {/* Type selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    סוג
                  </label>
                  <Select
                    value={selectedType}
                    onValueChange={setSelectedType}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="בחר סוג" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t === "Torah" ? "תורה" : "מועדים"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Book selector */}
                {selectedType === "Torah" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      ספר
                    </label>
                    <Select
                      value={selectedSeder}
                      onValueChange={setSelectedSeder}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="בחר ספר" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSedarim.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Parsha/Moed selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {selectedType === "Torah" ? "פרשה" : "מועד"}
                  </label>
                  <Select
                    value={selectedItem}
                    onValueChange={setSelectedItem}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={`בחר ${
                          selectedType === "Torah" ? "פרשה" : "מועד"
                        }`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableItems.map((i) => (
                        <SelectItem key={i} value={i}>
                          {i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Dvar Torah list */}
                <div className="text-sm font-semibold text-gray-500 mb-2">
                  דברי תורה
                </div>
                <ScrollArea className="h-64">
                  <div className="flex flex-col space-y-2">
                    {book.map((d) => (
                      <Button
                        key={d.dvar_torah_id}
                        variant={
                          selectedDvar?.dvar_torah_id === d.dvar_torah_id
                            ? "default"
                            : "ghost"
                        }
                        className="justify-start"
                        onClick={() => {
                          setSelectedDvar(d);
                          setShowFullContent(false);
                          if (isMobile) setIsSidebarOpen(false);
                        }}
                      >
                        {d.title}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Desktop sidebar */}
          <div className="hidden md:block bg-white p-5 rounded-xl shadow space-y-5">
            {/* Repeat the same filters and list */}
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="חיפוש כותרות..."
                className="pl-10"
                value={searchQuery}
                onChange={handleSearch}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-3"
                  onClick={clearSearch}
                >
                  <X />
                </Button>
              )}
            </div>
            {/* Type */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                סוג
              </label>
              <Select
                value={selectedType}
                onValueChange={setSelectedType}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="בחר סוג" />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t === "Torah" ? "תורה" : "מועדים"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Book */}
            {selectedType === "Torah" && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  ספר
                </label>
                <Select
                  value={selectedSeder}
                  onValueChange={setSelectedSeder}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="בחר ספר" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSedarim.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Parsha/Moed */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {selectedType === "Torah" ? "פרשה" : "מועד"}
              </label>
              <Select
                value={selectedItem}
                onValueChange={setSelectedItem}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={`בחר ${
                      selectedType === "Torah" ? "פרשה" : "מועד"
                    }`}
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableItems.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Dvar Torah list */}
            <div className="text-sm font-semibold text-gray-500 mb-2">
              דברי תורה
            </div>
            <ScrollArea className="h-64">
              <div className="flex flex-col space-y-2">
                {book.map((d) => (
                  <Button
                    key={d.dvar_torah_id}
                    variant={
                      selectedDvar?.dvar_torah_id === d.dvar_torah_id
                        ? "default"
                        : "ghost"
                    }
                    className="justify-start"
                    onClick={() => setSelectedDvar(d)}
                  >
                    {d.title}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex flex-col space-y-6">
          <div className="bg-white p-6 rounded-xl shadow">
            {/* Title */}
            <h2 className="text-2xl font-semibold mb-2">{getMainTitle()}</h2>
            {/* Body */}
            <article
              className={cn("prose max-w-none", showFullContent && "prose-rtl font-rashi")}
            >
              {showFullContent ? (
                selectedDvar?.contents.map((c) => (
                  <p key={c.passage_id}>{c.passage_content}</p>
                ))
              ) : (
                <p>{selectedDvar?.summary || "אין תקציר זמין."}</p>
              )}
            </article>

            {/* Toggle full text */}
            {(!showFullContent && selectedDvar?.contents.length) && (
              <div className="mt-6 text-center">
                <Button variant="outline" onClick={() => setShowFullContent(true)}>
                  <FileText className="ml-2 h-5 w-5" />
                  קרא את כל דבר התורה
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
