// app/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ChevronRight, ChevronLeft, FileText, Search, X } from "lucide-react";
// Note: Collapsible might not be needed for the main sidebar structure now,
// but could be used internally if desired. Let's remove its direct import for now.
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils"; // Assuming you have this for classname merging

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

export default function Page() {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile); // Sidebar open on desktop by default

  // --- State Variables (same as before) ---
  const [availableTypes] = useState<string[]>(["Torah", "Moadim"]);
  const [selectedType, setSelectedType] = useState<string>("Torah");
  const [isTypeListLoading, setIsTypeListLoading] = useState(false);

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

  const [language, setLanguage] = useState<"en" | "he">("he"); // Keep if needed

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- Data Fetching useEffects (same robust versions as before) ---
  useEffect(() => { /* Effect 2: Fetch Sedarim or Moadim list */
    // ... (Your complete Effect 2 code with detailed logging)
    const effectName = "Effect 2 (Type Change)"; console.log(`\n[${effectName}] Triggered. selectedType:`, selectedType);
    setSelectedSeder(""); setAvailableSedarim([]); setSelectedSecondLevelItem(""); setAvailableSecondLevelItems([]); setBook([]); setSelectedDvar(undefined); setIsSearching(false); setSearchQuery("");
    if (selectedType === "Torah") {
      setIsSederListLoading(true); fetch('/api/sedarim')
        .then(async r => { if (!r.ok) { const txt = await r.text().catch(()=>''); throw new Error(`Sedarim API ${r.status}: ${txt}`);} return r.json();})
        .then(d => { const l = d.sedarim || []; setAvailableSedarim(l); if (l.length > 0) setSelectedSeder(l[0]); else setSelectedSeder("");})
        .catch(e => { console.error(e); setAvailableSedarim([]); setSelectedSeder(""); })
        .finally(() => setIsSederListLoading(false));
    } else if (selectedType === "Moadim") {
      setIsSecondLevelListLoading(true); fetch(`/api/parshiot?type=Moadim`)
        .then(async r => { if (!r.ok) { const txt = await r.text().catch(()=>''); throw new Error(`Moadim List API ${r.status}: ${txt}`);} return r.json();})
        .then(d => { const l = d.parshiot || []; setAvailableSecondLevelItems(l); if (l.length > 0) setSelectedSecondLevelItem(l[0]); else setSelectedSecondLevelItem("");})
        .catch(e => { console.error(e); setAvailableSecondLevelItems([]); setSelectedSecondLevelItem("");})
        .finally(() => setIsSecondLevelListLoading(false));
    }
  }, [selectedType]);

  useEffect(() => { /* Effect 3: Fetch Parshiot for Torah */
    // ... (Your complete Effect 3 code with detailed logging)
    const effectName = "Effect 3 (Seder Change)"; console.log(`\n[${effectName}] Triggered. Type: ${selectedType}, Seder: ${selectedSeder}`);
    if (selectedType !== "Torah" || !selectedSeder) { if (selectedType !== "Torah") {setAvailableSecondLevelItems([]); setSelectedSecondLevelItem("");} return; }
    setSelectedSecondLevelItem(""); setAvailableSecondLevelItems([]); setBook([]); setSelectedDvar(undefined); setIsSearching(false); setSearchQuery(""); setIsSecondLevelListLoading(true);
    fetch(`/api/parshiot?type=Torah&seder=${encodeURIComponent(selectedSeder)}`)
      .then(async r => { if (!r.ok) { const txt = await r.text().catch(()=>''); throw new Error(`Parshiot API ${r.status}: ${txt}`);} return r.json();})
      .then(d => { const l = d.parshiot || []; setAvailableSecondLevelItems(l); if (l.length > 0) setSelectedSecondLevelItem(l[0]); else setSelectedSecondLevelItem("");})
      .catch(e => { console.error(e); setAvailableSecondLevelItems([]); setSelectedSecondLevelItem("");})
      .finally(() => setIsSecondLevelListLoading(false));
  }, [selectedType, selectedSeder]);

  useEffect(() => { /* Effect 4: Fetch Content */
    // ... (Your complete Effect 4 code with detailed logging and refined guards)
    const effectName = "Effect 4 (Item Change)"; console.log(`\n[${effectName}] Triggered. Type: ${selectedType}, Seder: ${selectedSeder}, Item: ${selectedSecondLevelItem}`);
    if (!selectedType || !selectedSecondLevelItem) { setBook([]); setSelectedDvar(undefined); return; }
    if (selectedType === "Torah" && !selectedSeder) { setBook([]); setSelectedDvar(undefined); return; }
    if (availableSecondLevelItems.length > 0 && !availableSecondLevelItems.includes(selectedSecondLevelItem)) { setBook([]); setSelectedDvar(undefined); return; }
    if (isSecondLevelListLoading && availableSecondLevelItems.length === 0 && selectedSecondLevelItem) { return; }

    const url = selectedType === "Torah" ? `/api/content?type=Torah&seder=${encodeURIComponent(selectedSeder)}&parsha=${encodeURIComponent(selectedSecondLevelItem)}` : `/api/content?type=Moadim&parsha=${encodeURIComponent(selectedSecondLevelItem)}`;
    console.log(`[${effectName}] Fetching: ${url}`);
    setIsContentLoading(true); setBook([]); setSelectedDvar(undefined); setIsSearching(false); setSearchQuery("");
    fetch(url)
      .then(async r => { if (!r.ok) { const txt = await r.text().catch(()=>''); throw new Error(`Content API ${r.status} for ${url}: ${txt}`);} return r.json();})
      .then(d => { const c = d.parsha?.contents || []; setBook(c); if (c.length > 0) {setSelectedDvar(c[0]); setShowFullContent(false);} else {setSelectedDvar(undefined);}})
      .catch(e => { console.error(e); setBook([]); setSelectedDvar(undefined);})
      .finally(() => setIsContentLoading(false));
  }, [selectedType, selectedSeder, selectedSecondLevelItem, availableSecondLevelItems, isSecondLevelListLoading]);


  // --- Handler Functions ---
  const handleTypeChange = (value: string) => setSelectedType(value);
  const handleSederChange = (value: string) => setSelectedSeder(value);
  const handleSecondLevelItemChange = (value: string) => setSelectedSecondLevelItem(value);
  const handleClickDvarTorah = (dvar: DvarTorahItem) => { setSelectedDvar(dvar); setShowFullContent(false); if (isMobile) setIsSidebarOpen(false); };
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... same search logic ... */
    const q = e.target.value; setSearchQuery(q); if (!q.trim()) { setIsSearching(false); setSearchResults([]); return; } setIsSearching(true);
    const results = book.filter(dvar => dvar.title?.toLowerCase().includes(q.toLowerCase()) || dvar.summary?.toLowerCase().includes(q.toLowerCase())).map(dvar => ({ dvar, parsha: selectedSecondLevelItem, seder: selectedType === "Torah" ? selectedSeder : "Moadim", type: selectedType }));
    setSearchResults(results);
  };
  const clearSearch = () => { setSearchQuery(""); setIsSearching(false); setSearchResults([]); };
  const getMainTitle = () => { /* ... same improved getMainTitle ... */
    let titleBase = selectedType === "Moadim" ? "מועדים" : selectedSeder;
    if (selectedType === "Torah") { if (!selectedSeder) titleBase = isSederListLoading ? "טוען ספרים..." : (availableSedarim.length > 0 ? "בחר ספר" : "אין ספרים זמינים");}
    else { if (availableSecondLevelItems.length === 0 && !isSecondLevelListLoading && selectedType === "Moadim") titleBase = "מועדים - אין מועדים זמינים"; else if (isSecondLevelListLoading && availableSecondLevelItems.length === 0 && selectedType === "Moadim") titleBase = "טוען מועדים...";}
    if (selectedSecondLevelItem) return `${titleBase || (selectedType === "Torah" ? selectedSeder : "מועדים")} - ${selectedSecondLevelItem}`;
    return titleBase || (selectedType === "Torah" ? "טוען..." : "טוען מועדים...");
  };

  // Reusable Sidebar Content Component
  const SidebarItems = () => (
    <div className="p-3 space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:right-2.5 rtl:left-auto" />
        <Input type="text" placeholder="חיפוש כותרות..." value={searchQuery} onChange={handleSearch} className="w-full pl-9 rtl:pr-9"/>
        {searchQuery && (
          <Button variant="ghost" size="icon" onClick={clearSearch} className="absolute right-1.5 top-[3px] h-7 w-7 rtl:left-1.5 rtl:right-auto"><X className="h-4 w-4" /></Button>
        )}
      </div>

      {isSearching ? (
        <div className="pt-2 space-y-1">
          <h3 className="text-sm font-medium mb-2 text-muted-foreground">תוצאות חיפוש ({searchResults.length})</h3>
          <ScrollArea className="h-[calc(100vh-280px)]"> {/* Adjust height as needed */}
            {searchResults.length > 0 ? (
              searchResults.map((result) => (
                <Button key={result.dvar.dvar_torah_id} variant="ghost" className="w-full justify-start h-auto py-1.5 px-2 text-right text-sm rounded-md hover:bg-accent/70"
                        onClick={() => handleClickDvarTorah(result.dvar)}>
                  <p className="truncate leading-snug">{result.dvar.title}</p>
                </Button>
              ))
            ) : (<p className="text-xs text-muted-foreground text-center py-4">לא נמצאו תוצאות</p>)}
          </ScrollArea>
          <Button variant="outline" size="sm" className="w-full mt-2" onClick={clearSearch}>נקה חיפוש</Button>
        </div>
      ) : (
        <>
          {/* Type Selector */}
          <div className="space-y-1">
            <label htmlFor="type-select-sidebar" className="text-xs font-medium text-muted-foreground">סוג</label>
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger id="type-select-sidebar"><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableTypes.map(typeOpt => <SelectItem key={typeOpt} value={typeOpt}>{typeOpt === "Torah" ? "תורה" : "מועדים"}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Seder Selector */}
          {selectedType === "Torah" && (
            <div className="space-y-1">
              <label htmlFor="seder-select-sidebar" className="text-xs font-medium text-muted-foreground">ספר</label>
              <Select value={selectedSeder} onValueChange={handleSederChange} disabled={isSederListLoading || availableSedarim.length === 0}>
                <SelectTrigger id="seder-select-sidebar"><SelectValue placeholder={isSederListLoading ? "טוען..." : "בחר ספר"} /></SelectTrigger>
                <SelectContent>
                  {isSederListLoading ? <SelectItem value="loading_s" disabled>טוען...</SelectItem> :
                   availableSedarim.length === 0 ? <SelectItem value="no_s" disabled>אין ספרים</SelectItem> :
                   availableSedarim.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Parsha/Moed Selector */}
          <div className="space-y-1">
            <label htmlFor="item-select-sidebar" className="text-xs font-medium text-muted-foreground">
              {selectedType === "Torah" ? (selectedSeder ? "פרשה" : "בחר ספר") : "מועד"}
            </label>
            <Select value={selectedSecondLevelItem} onValueChange={handleSecondLevelItemChange}
                    disabled={isSecondLevelListLoading || availableSecondLevelItems.length === 0 || (selectedType === "Torah" && !selectedSeder)}>
              <SelectTrigger id="item-select-sidebar"><SelectValue placeholder={isSecondLevelListLoading ? "טוען..." : `בחר ${selectedType === "Torah" ? "פרשה" : "מועד"}`} /></SelectTrigger>
              <SelectContent>
                {isSecondLevelListLoading ? <SelectItem value="loading_i" disabled>טוען...</SelectItem> :
                 availableSecondLevelItems.length === 0 ? <SelectItem value="no_i" disabled>אין {selectedType === "Torah" ? "פרשיות" : "מועדים"}</SelectItem> :
                 availableSecondLevelItems.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Separator className="my-2" />

          <div className="text-sm font-semibold text-muted-foreground mb-1">דברי תורה</div>
          {/* Dvar Torah List - This ScrollArea should be flex-1 if it's the last expanding element */}
          <ScrollArea className="flex-1 min-h-[200px]">
            <div className="space-y-1">
              {isContentLoading && book.length === 0 ? (<p className="text-xs text-muted-foreground text-center py-2">טוען...</p>)
               : book.length > 0 ? (
                book.map((dvar) => (
                  <Button key={dvar.dvar_torah_id} variant={selectedDvar?.dvar_torah_id === dvar.dvar_torah_id ? "secondary" : "ghost"}
                          className="w-full justify-start h-auto py-1.5 px-2 text-right text-sm rounded-md"
                          onClick={() => handleClickDvarTorah(dvar)}>
                    <p className="truncate leading-snug">{dvar.title || "ללא כותרת"}</p>
                  </Button>
                ))
              ) : selectedSecondLevelItem ? (<p className="text-xs text-muted-foreground text-center py-4">אין דברי תורה</p>)
                : (<p className="text-xs text-muted-foreground text-center py-4">{selectedType === "Torah" && !selectedSeder ? "בחר ספר" : "בחר פריט"}</p>)}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );

  return (
    <div className={`flex flex-col h-screen bg-background text-foreground ${language === "he" ? "rtl" : "ltr"}`}>
      <header className="app-header w-full bg-white dark:bg-slate-800 border-b border-border py-4 px-6 md:px-8 shadow-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-primary-foreground">ספר דברי יואל - אוסף דברי תורה</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">דברי תורה מאת רביה"ק מסאטמאר זי"ע</p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden"> {/* Main content and sidebar container */}

        {/* Main Content Area */}
        <main className={`flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto ${isMobile && isSidebarOpen ? 'hidden' : ''}`}>
           <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-200">{getMainTitle()}</h2>
            {/* Button to open sidebar on mobile, if sidebar is not part of the main flow */}
            {isMobile && !isSidebarOpen && (
                 <Button variant="outline" size="icon" onClick={() => setIsSidebarOpen(true)} className="md:hidden">
                     <ChevronLeft />
                 </Button>
             )}
          </div>
          {isContentLoading && !selectedDvar && selectedSecondLevelItem ? (
            <div className="flex justify-center items-center h-64"><p className="text-lg text-muted-foreground">טוען תוכן...</p></div>
          ) : selectedDvar ? (
            <>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 text-slate-700 dark:text-slate-300">{selectedDvar.title || "ללא כותרת"}</h3>
              <Separator className="my-3" />
              <ScrollArea className="h-[calc(100vh-230px)] md:h-[calc(100vh-210px)] text-base">
                {showFullContent ? (
                  selectedDvar.contents?.length > 0 ? (
                    selectedDvar.contents.map((passage, index) => (
                      <p key={passage.passage_id || index} dir="rtl" className="mb-3 leading-relaxed my-font">{passage.passage_content}</p>
                    ))
                  ) : (<p dir="rtl" className="text-muted-foreground">אין תוכן מלא זמין.</p>)
                ) : (
                  <>
                    <p dir="rtl" className="mb-4 leading-relaxed text-muted-foreground">{selectedDvar.summary || "אין תקציר זמין."}</p>
                    {selectedDvar.contents?.length > 0 && (
                      <div className="mt-6 text-center">
                        <Button variant="outline" onClick={() => setShowFullContent(true)}>
                          <FileText className="ml-2 h-4 w-4" />קרא את כל דבר התורה
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </ScrollArea>
            </>
          ) : (
            <div className="flex justify-center items-center h-64">
              <p className="text-lg text-muted-foreground">
                   {selectedSecondLevelItem ? "לא נמצאו דברי תורה עבור בחירה זו."
                    : (selectedType === "Torah" && !selectedSeder && !isSederListLoading && availableSedarim.length === 0) ? "אין ספרים זמינים."
                    : (selectedType === "Torah" && !selectedSeder) ? "בחר ספר מהניווט."
                    : (selectedType === "Moadim" && availableSecondLevelItems.length === 0 && !isSecondLevelListLoading) ? "אין מועדים זמינים."
                    : isSecondLevelListLoading || isSederListLoading || isContentLoading ? "טוען..."
                    : "בחר פריט מהניווט להצגת תוכן."}
              </p>
            </div>
          )}
        </main>

        {/* Sidebar for Desktop - always part of the flex flow */}
        <aside className={`hidden md:flex flex-col w-72 lg:w-80 flex-shrink-0 border-r border-border bg-card text-card-foreground transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-16'}`}>
            <div className={`flex ${isSidebarOpen ? 'justify-between' : 'justify-center'} items-center p-3 border-b border-border sticky top-0 bg-card z-10`}>
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1">
                    {isSidebarOpen ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </Button>
                {isSidebarOpen && <h2 className="text-lg font-semibold">ניווט</h2>}
            </div>
            {isSidebarOpen && <SidebarItems />}
        </aside>

        {/* Mobile Sidebar (Overlay) */}
        {isMobile && isSidebarOpen && (
            <>
                <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
                <aside className="fixed top-0 right-0 h-full w-4/5 max-w-xs bg-card text-card-foreground shadow-xl flex flex-col z-40 md:hidden overflow-y-auto">
                    <div className="flex justify-between items-center p-3 border-b border-border sticky top-0 bg-card z-10">
                        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}><X className="h-5 w-5"/></Button>
                        <h2 className="text-lg font-semibold">ניווט</h2>
                    </div>
                    <SidebarItems />
                </aside>
            </>
        )}
      </div>
    </div>
  );
}