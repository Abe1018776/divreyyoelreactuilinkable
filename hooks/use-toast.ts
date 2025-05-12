
"use client";

// We'll re‐export Sonner's hook under your alias
import { useToast as useSonnerToast } from "sonner";

/**
 * A wrapper around Sonner's useToast hook.
 * Import this from "@/hooks/use-toast" in your UI components.
 */
export const useToast = useSonnerToast;
