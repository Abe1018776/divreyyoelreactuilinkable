// app/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { FileText, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils"; // Make sure lib/utils.ts exists
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile"; // Make sure hooks/use-mobile.ts exists
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// --- Types (from our robust version) ---
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
interface SearchResultItem { // For client-side search
  dvar: DvarTorahItem;
  parsha: string;
  seder: string;
  type: string;
}

export default function Page() {
  const isMobile = useIsMobile();

  // --- State Variables (from our robust version) ---
  const [availableTypes] = useState<string[]>(["Torah", "Moadim"]);
  const [selectedType, setSelectedType] = useState<string>("Torah");

  const [availableSedarim, setAvailableSedarim] = useState<string[]>([]);
  const [selectedSeder, setSelectedSeder] = useState<string>("");
  const [isSederListLoading, setIsSederListLoading] = useState(false);

  const [availableSecondLevelItems, setAvailableSecondLevelItems] = useState<string[]>([]);
  const [selectedSecondLevelItem, setSelectedSecondLevelItem] = useState<string>("");
  const [isSecondLevelListLoading, setIsSecondLevelListLoading] = useState(false);

  const [book, setBook] = useState<DvarTorahItem[]>([]);
  const [selectedDvar, setSelectedDvar] = useState<DvarTorahItem | undefined>();
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile); // From our robust version
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);


  // --- Data Fetching useEffects (from our robust version) ---
  useEffect(() => { /* Effect 2: Fetch Sedarim or Moadim list */
    console.log("Effect 2 Triggered: selectedType =", selectedType);
    setSelectedSeder(""); setAvailableSedarim([]);
    setSelectedSecondLevelItem(""); setAvailableSecondLevelItems([]);
    setBook([]); setSelectedDvar(undefined); setIsSearching(false); setSearchQuery("");

    if (selectedType === "Torah") {
      setIsSederListLoading(true);
      fetch('/api/sedarim')
        .then(res => res.ok ? res.json() : Promise.reject(new Error(`API error: ${res.status}`)))
        .then(data => { const list = data.sedarim || []; setAvailableSedarim(list); if (list.length > 0) setSelectedSeder(list[0]); })
        .catch(err => { console.error("PAGE: Failed to fetch Sedarim:", err); setAvailableSedarim([]); })
        .finally(() => setIsSederListLoading(false));
    } else if (selectedType === "Moadim") {
      setIsSecondLevelListLoading(true);
      fetch(`/api/parshiot?type=Moadim`)
        .then(res => res.ok ? res.json() : Promise.reject(new Error(`API error: ${res.status}`)))
        .then(data => { const list = data.parshiot || []; setAvailableSecondLevelItems(list); if (list.length > 0) setSelectedSecondLevelItem(list[0]); })
        .catch(err => { console.error("PAGE: Failed to fetch Moadim list:", err); setAvailableSecondLevelItems([]); })
        .finally(() => setIsSecondLevelListLoading(false));
    }
  }, [selectedType]);

  useEffect(() => { /* Effect 3: Fetch Parshiot for Torah */
    console.log("Effect 3 Triggered: selectedType =", selectedType, "selectedSeder =", selectedSeder);
    if (selectedType !== "Torah" || !selectedSeder) {
      if (selectedType !== "Torah") { setAvailableSecondLevelItems([]); setSelectedSecondLevelItem(""); } return;
    }
    setSelectedSecondLevelItem(""); setAvailableSecondLevelItems([]);
    setBook([]); setSelectedDvar(undefined); setIsSearching(false); setSearchQuery("");
    setIsSecondLevelListLoading(true);
    fetch(`/api/parshiot?type=Torah&seder=${encodeURIComponent(selectedSeder)}`)
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`API error: ${res.status}`)))
      .then(data => { const list = data.parshiot || []; setAvailableSecondLevelItems(list); if (list.length > 0) setSelectedSecondLevelItem(list[0]); })
      .catch(err => { console.error(`PAGE: Failed to Parshiot for ${selectedSeder}:`, err); setAvailableSecondLevelItems([]); })
      .finally(() => setIsSecondLevelListLoading(false));
  }, [selectedType, selectedSeder]);

  useEffect(() => { /* Effect 4: Fetch Content */
    console.log("Effect 4 Triggered: Type=", selectedType, "Seder=", selectedSeder, "Item=", selectedSecondLevelItem);
    console.log("Current availableSecondLevelItems:", availableSecondLevelItems);

    if (!selectedType || !selectedSecondLevelItem) { setBook([]); setSelectedDvar(undefined); return; }
    if (selectedType === "Torah" && !selectedSeder) { setBook([]); setSelectedDvar(undefined); return; }

    // Guard against stale selectedSecondLevelItem
    if (availableSecondLevelItems.length > 0 && !availableSecondLevelItems.includes(selectedSecondLevelItem)) {
        console.warn(`Effect 4: Stale item ('${selectedSecondLevelItem}'). Valid items:`, availableSecondLevelItems, ". Aborting content fetch.");
        setBook([]); setSelectedDvar(undefined);
        return;
    }
    if (isSecondLevelListLoading && availableSecondLevelItems.length === 0 && selectedSecondLevelItem) {
        console.warn(`Effect 4: List for second level items still loading, but an item ('${selectedSecondLevelItem}') is selected. Waiting for list to populate.`);
        // setBook([]); setSelectedDvar(undefined); // Optional: clear if you want to be very strict
        return;
    }


    const url = selectedType === "Torah"
        ? `/api/content?type=Torah&seder=${encodeURIComponent(selectedSeder)}&parsha=${encodeURIComponent(selectedSecondLevelItem)}`
        : `/api/content?type=Moadim&parsha=${encodeURIComponent(selectedSecondLevelItem)}`;

    console.log("Effect 4: Fetching URL:", url);
    setIsContentLoading(true); setBook([]); setSelectedDvar(undefined); setIsSearching(false); setSearchQuery("");
    fetch(url)
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`API error: ${res.status}`)))
      .then(data => {
        const contents = data.parsha?.contents || [];
        setBook(contents);
        if (contents.length > 0) { setSelectedDvar(contents[0]); setShowFullContent(false); }
      })
      .catch(err => { console.error(`PAGE: Failed to fetch content from ${url}:`, err); setBook([]); setSelectedDvar(undefined); })
      .finally(() => setIsContentLoading(false));
  }, [selectedType, selectedSeder, selectedSecondLevelItem, availableSecondLevelItems, isSecondLevelListLoading]); // Added dependencies

  // --- Handler Functions (from our robust version, adapted for Shadcn Select) ---
  const handleTypeChange = (value: string) => setSelectedType(value);
  const handleSederChange = (value: string) => setSelectedSeder(value);
  const handleSecondLevelItemChange = (value: string) => setSelectedSecondLevelItem(value);

  const handleClickDvarTorah = (dvar: DvarTorahItem) => {
    setSelectedDvar(dvar);
    setShowFullContent(false);
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... same client-side search ... */
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) { setIsSearching(false); setSearchResults([]); return; }
    setIsSearching(true);
    const results = book.filter(dvar =>
        dvar.title?.toLowerCase().includes(q.toLowerCase()) ||
        dvar.summary?.toLowerCase().includes(q.toLowerCase())
        // Add content search if needed: dvar.contents?.some(p => p.passage_content.toLowerCase().includes(q.toLowerCase()))
    ).map(dvar => ({ dvar, parsha: selectedSecondLevelItem, seder: selectedType === "Torah" ? selectedSeder : "Moadim", type: selectedType }));
    setSearchResults(results);
  };
  const clearSearch = () => { setSearchQuery(""); setIsSearching(false); setSearchResults([]); };

  const getMainTitle = () => { /* ... same improved version from our robust page ... */
    let titleBase = selectedType === "Moadim" ? "מועדים" : selectedSeder;
    if (selectedType === "Torah") {
        if (!selectedSeder) titleBase = isSederListLoading ? "טוען ספרים..." : (availableSedarim.length > 0 ? "בחר ספר" : "אין ספרים זמינים");
    } else { 
        if (availableSecondLevelItems.length === 0 && !isSecondLevelListLoading && selectedType === "Moadim") titleBase = "מועדים - אין מועדים זמינים";
        else if (isSecondLevelListLoading && availableSecondLevelItems.length === 0 && selectedType === "Moadim") titleBase = "טוען מועדים...";
    }

    if (selectedSecondLevelItem) {
      return `${titleBase || (selectedType === "Torah" ? selectedSeder : "מועדים")} - ${selectedSecondLevelItem}`;
    }
    return titleBase || (selectedType === "Torah" ? "טוען..." : "טוען מועדים...");
  };

  // --- JSX (Structure from your "ugly UI" version, logic from robust version) ---
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-slate-900 dark:text-slate-50"> {/* Added dark mode base */}
      {/* Banner */}
      <header className="bg-white dark:bg-slate-800 shadow sticky top-0 z-50"> {/* Made header sticky */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            ספר דברי יואל – אוסף דברי תורה
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            דברי תורה מאת רביה"ק מסאטמאר זי"ע
          </p>
        </div>
      </header>

      {/* Two‑column grid (sidebar first for RTL, main content second) */}
      {/* On mobile, sidebar becomes a collapsible overlay */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row-reverse gap-6"> {/* flex-row-reverse for RTL sidebar on right */}

        {/* Sidebar Area */}
        <div className={`md:w-80 lg:w-96 flex-shrink-0 ${isMobile && !isSidebarOpen ? 'hidden' : ''} ${isMobile ? 'fixed inset-0 bg-background/80 backdrop-blur-sm z-40 h-full overflow-y-auto' : ''}`}>
          <aside className={`flex flex-col space-y-4 h-full ${isMobile ? 'bg-card p-4 shadow-xl' : 'sticky top-[calc(theme(spacing.16)+1px)] h-[calc(100vh-theme(spacing.16)-2rem)]'}`}> {/* Sticky desktop sidebar */}
            {isMobile && (
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">ניווט</h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}><X className="h-5 w-5"/></Button>
                </div>
            )}
            {!isMobile && <h2 className="text-xl font-semibold pt-2">ניווט</h2>}


            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 rtl:right-3 rtl:left-auto" />
              <Input placeholder="חיפוש כותרות..." className="pl-10 rtl:pr-10" value={searchQuery} onChange={handleSearch} />
              {searchQuery && (
                <Button variant="ghost" size="icon" className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rtl:left-1.5 rtl:right-auto" onClick={clearSearch}><X className="h-4 w-4" /></Button>
              )}
            </div>

            {isSearching ? (
              <div className="pt-2 space-y-1 flex-1 overflow-y-auto">
                <h3 className="text-base font-medium mb-2">תוצאות חיפוש ({searchResults.length})</h3>
                <ScrollArea className="h-[calc(100%-4rem)]"> {/* Adjust height */}
                    {searchResults.length > 0 ? (
                    searchResults.map((result) => (
                        <Button key={result.dvar.dvar_torah_id} variant="ghost" className="w-full justify-start h-auto py-1.5 px-2 text-right text-sm"
                                onClick={() => handleClickDvarTorah(result.dvar)}>
                        <p className="truncate">{result.dvar.title}</p>
                        </Button>
                    ))
                    ) : (<p className="text-xs text-muted-foreground text-center py-4">לא נמצאו תוצאות</p>)}
                </ScrollArea>
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={clearSearch}>נקה חיפוש</Button>
              </div>
            ) : (
              <>
                {/* Type selector */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">סוג</label>
                  <Select value={selectedType} onValueChange={handleTypeChange}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {availableTypes.map((t) => (<SelectItem key={t} value={t}>{t === "Torah" ? "תורה" : "מועדים"}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Seder selector */}
                {selectedType === "Torah" && (
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">ספר</label>
                    <Select value={selectedSeder} onValueChange={handleSederChange} disabled={isSederListLoading || availableSedarim.length === 0}>
                      <SelectTrigger className="w-full"><SelectValue placeholder={isSederListLoading ? "טוען..." : "בחר ספר"} /></SelectTrigger>
                      <SelectContent>
                        {isSederListLoading ? <SelectItem value="loading" disabled>טוען...</SelectItem> :
                         availableSedarim.length === 0 ? <SelectItem value="no-options" disabled>אין ספרים</SelectItem> :
                         availableSedarim.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Parsha/Moed selector */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{selectedType === "Torah" ? (selectedSeder ? "פרשה" : "בחר ספר") : "מועד"}</label>
                  <Select value={selectedSecondLevelItem} onValueChange={handleSecondLevelItemChange} disabled={isSecondLevelListLoading || availableSecondLevelItems.length === 0 || (selectedType === "Torah" && !selectedSeder)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder={isSecondLevelListLoading ? "טוען..." : `בחר ${selectedType === "Torah" ? "פרשה" : "מועד"}`} /></SelectTrigger>
                    <SelectContent>
                      {isSecondLevelListLoading ? <SelectItem value="loading" disabled>טוען...</SelectItem> :
                       availableSecondLevelItems.length === 0 ? <SelectItem value="no-options" disabled>אין {selectedType === "Torah" ? "פרשיות" : "מועדים"}</SelectItem> :
                       availableSecondLevelItems.map((i) => (<SelectItem key={i} value={i}>{i}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="my-3"/>

                {/* Dvar Torah list */}
                <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">דברי תורה</div>
                <ScrollArea className="flex-1 min-h-[200px]"> {/* Allow scroll area to grow */}
                  <div className="flex flex-col space-y-1 pr-1">
                    {isContentLoading && book.length === 0 ? <p className="text-xs text-muted-foreground text-center py-2">טוען...</p> :
                     book.length > 0 ? (
                      book.map((d) => (
                        <Button
                          key={d.dvar_torah_id}
                          variant={selectedDvar?.dvar_torah_id === d.dvar_torah_id ? "secondary" : "ghost"} // Use secondary for selected
                          className="w-full justify-start h-auto py-1.5 px-2 text-right text-sm"
                          onClick={() => handleClickDvarTorah(d)}
                        >
                          <p className="truncate leading-snug">{d.title || "ללא כותרת"}</p>
                        </Button>
                      ))
                    ) : selectedSecondLevelItem ? (
                      <p className="text-xs text-muted-foreground text-center py-4">אין דברי תורה עבור בחירה זו.</p>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        {selectedType === "Torah" && !selectedSeder ? "בחר ספר תחילה." : "בחר פריט להצגת דברי תורה."}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </aside>
        </div>

        {/* Mobile Sidebar Toggle Button - Placed outside the main grid flow, fixed position */}
        {isMobile && !isSidebarOpen && (
            <Button 
                variant="outline" 
                size="icon" 
                className="fixed bottom-4 right-4 z-50 shadow-lg md:hidden" // Show only on mobile when sidebar is closed
                onClick={() => setIsSidebarOpen(true)}
            >
                <ChevronLeft /> {/* Icon for opening from right */}
            </Button>
        )}

        {/* Main content area (This is where the Dvar Torah summary/full text goes) */}
        <div className={`flex-1 overflow-y-auto p-6 md:p-8 bg-white dark:bg-slate-800/50 md:rounded-lg md:shadow ${isMobile && isSidebarOpen ? 'hidden' : ''}`}> {/* Hide main content on mobile if sidebar is open */}
           <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-200">{getMainTitle()}</h2>
           {isContentLoading && !selectedDvar && selectedSecondLevelItem ? (
              <div className="flex justify-center items-center h-64"><p className="text-lg text-muted-foreground">טוען תוכן...</p></div>
            ) : selectedDvar ? (
              <>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-slate-700 dark:text-slate-300">{selectedDvar.title || "ללא כותרת"}</h3>
                <Separator className="my-4" />
                <article className={cn("prose prose-sm sm:prose-base max-w-none dark:prose-invert", showFullContent && "my-font")}> {/* Apply .my-font for Rashi when full content */}
                  {showFullContent ? (
                    selectedDvar.contents?.length > 0 ? (
                      selectedDvar.contents.map((passage) => (
                        <p key={passage.passage_id} dir="rtl" className="mb-3 leading-relaxed">
                          {passage.passage_content}
                        </p>
                      ))
                    ) : (<p dir="rtl" className="text-muted-foreground">אין תוכן מלא זמין.</p>)
                  ) : (
                    <>
                      <p dir="rtl" className="mb-4 leading-relaxed text-muted-foreground">{selectedDvar.summary || "אין תקציר זמין."}</p>
                      {selectedDvar.contents?.length > 0 && (
                        <div className="mt-6 text-center">
                          <Button variant="outline" onClick={() => setShowFullContent(true)}>
                            <FileText className="ml-2 h-4 w-4" /> קרא את כל דבר התורה
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </article>
              </>
            ) : (
              <div className="flex justify-center items-center h-64">
                <p className="text-lg text-muted-foreground">
                  {/* ... (same empty/loading messages as before) ... */}
                   {selectedSecondLevelItem ? "לא נמצאו דברי תורה עבור בחירה זו."
                    : (selectedType === "Torah" && !selectedSeder && !isSederListLoading && availableSedarim.length === 0) ? "אין ספרים זמינים."
                    : (selectedType === "Torah" && !selectedSeder) ? "בחר ספר מהניווט."
                    : (selectedType === "Moadim" && availableSecondLevelItems.length === 0 && !isSecondLevelListLoading) ? "אין מועדים זמינים."
                    : isSecondLevelListLoading || isSederListLoading || isContentLoading ? "טוען..."
                    : "בחר פריט מהניווט להצגת תוכן."}
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}