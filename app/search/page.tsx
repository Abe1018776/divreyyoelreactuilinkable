
// app/search/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ChevronRight, FileText, Search, X, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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
interface SearchResult {
  dvar: DvarTorahItem;
  type: string;
  seder?: string;
  parsha: string;
  matchType: string;
  matchText: string;
}

export default function SearchPage() {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [showFullContent, setShowFullContent] = useState(false);
  const [language, setLanguage] = useState<"en" | "he">("he");
  
  // Debounce search to avoid too many API calls
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      } else {
        console.error("Search error:", await response.text());
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClickResult = (result: SearchResult) => {
    setSelectedResult(result);
    setShowFullContent(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
    setSelectedResult(null);
  };

  // Format match text with highlighted search term
  const highlightMatch = (text: string, query: string) => {
    if (!text || !query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? 
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-800">{part}</mark> : 
            part
        )}
      </>
    );
  };

  return (
    <div className={`flex flex-col h-screen bg-background text-foreground ${language === "he" ? "rtl" : "ltr"}`}>
      <header className="app-header w-full bg-white dark:bg-slate-800 border-b border-border py-4 px-6 md:px-8 shadow-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto text-center">
          <a href="/" className="block cursor-pointer transition-opacity hover:opacity-80">
            <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-primary-foreground">חיפוש בספר דברי יואל</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">חיפוש בכל דברי התורה מאת רביה"ק מסאטמאר זי"ע</p>
          </a>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <div className="relative mb-6">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground rtl:right-2.5 rtl:left-auto" />
              <Input 
                type="text" 
                placeholder="חיפוש בכל הקורפוס..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full pl-10 pr-10 py-6 text-lg rtl:pr-10 rtl:pl-10"
              />
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={clearSearch} 
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rtl:left-1.5 rtl:right-auto"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>

            {isSearching ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="mr-2 text-lg">מחפש...</span>
              </div>
            ) : (
              searchQuery.trim().length < 2 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>הקלד לפחות 2 תווים כדי להתחיל בחיפוש</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold mb-2">תוצאות ({searchResults.length})</h2>
                    <Separator />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:border-l border-border">
                      <ScrollArea className="h-[calc(100vh-300px)]">
                        {searchResults.length > 0 ? (
                          <div className="space-y-4 p-4">
                            {searchResults.map((result, index) => (
                              <div
                                key={`${result.dvar.dvar_torah_id}-${index}`}
                                className={`w-full border rounded-lg p-4 cursor-pointer transition-all ${
                                  selectedResult === result 
                                    ? "bg-secondary border-secondary" 
                                    : "hover:bg-accent/40 border-border"
                                }`}
                                onClick={() => handleClickResult(result)}
                              >
                                <div className="w-full flex flex-col items-end">
                                  <div className="flex flex-wrap justify-end gap-1 mb-2 w-full">
                                    <span className="text-xs bg-primary/10 px-2 py-1 rounded-full">
                                      {result.type === 'Torah' ? `תורה: ${result.seder} - ${result.parsha}` : `מועדים: ${result.parsha}`}
                                    </span>
                                    <span className="text-xs bg-secondary/20 px-2 py-1 rounded-full">
                                      {result.matchType === 'title' ? 'כותרת' : 
                                       result.matchType === 'summary' ? 'תקציר' : 'תוכן'}
                                    </span>
                                  </div>
                                  <p className="text-sm font-semibold text-right w-full break-words whitespace-normal mb-2">{result.dvar.title || "ללא כותרת"}</p>
                                  <p className="text-xs text-muted-foreground text-right w-full break-words whitespace-normal">{result.dvar.summary || "ללא תקציר"}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center py-8 text-muted-foreground">לא נמצאו תוצאות עבור "{searchQuery}"</p>
                        )}
                      </ScrollArea>
                    </div>
                    
                    <div>
                      {selectedResult ? (
                        <>
                          <div className="mb-4">
                            <div className="flex flex-wrap justify-end gap-1 mb-2">
                              <span className="text-xs bg-primary/10 px-2 py-1 rounded-full">
                                {selectedResult.type === 'Torah' ? 
                                  `תורה: ${selectedResult.seder} - ${selectedResult.parsha}` : 
                                  `מועדים: ${selectedResult.parsha}`}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold mb-1 break-words whitespace-normal">{selectedResult.dvar.title || "ללא כותרת"}</h3>
                            <p className="text-sm text-muted-foreground mb-3 break-words whitespace-normal">{selectedResult.dvar.summary || "ללא תקציר"}</p>
                          </div>
                          <Separator className="my-3" />
                          <ScrollArea className="h-[calc(100vh-400px)]">
                            {showFullContent ? (
                              selectedResult.dvar.contents?.length > 0 ? (
                                selectedResult.dvar.contents.map((passage, index) => (
                                  <p key={passage.passage_id || index} 
                                     dir="rtl" 
                                     className="mb-3 leading-relaxed my-font">
                                    {highlightMatch(passage.passage_content, searchQuery)}
                                  </p>
                                ))
                              ) : (<p dir="rtl" className="text-muted-foreground">אין תוכן מלא זמין.</p>)
                            ) : (
                              <>
                                <p dir="rtl" className="mb-3 leading-relaxed">
                                  {selectedResult.matchType === 'content' ? (
                                    <span className="text-muted-foreground">מציג קטע תוכן שמכיל את החיפוש:</span>
                                  ) : null}
                                </p>
                                <p dir="rtl" className="mb-6 leading-relaxed">
                                  {highlightMatch(selectedResult.matchText, searchQuery)}
                                </p>
                                <div className="mt-6 text-center">
                                  <Button variant="outline" onClick={() => setShowFullContent(true)}>
                                    <FileText className="ml-2 h-4 w-4" />קרא את כל דבר התורה
                                  </Button>
                                </div>
                              </>
                            )}
                          </ScrollArea>
                        </>
                      ) : (
                        <div className="flex justify-center items-center h-64">
                          <p className="text-muted-foreground">בחר תוצאה כדי לצפות בפרטים</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
