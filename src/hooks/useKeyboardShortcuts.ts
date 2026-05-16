"use client";

import { useEffect, useCallback } from "react";

interface KeyboardShortcutsConfig {
  onTogglePalette: () => void;
  onClosePalette: () => void;
  onToggleHelp: () => void;
  onToggleExpandAll: () => void;
  onNavigateToTask: (id: number) => void;
}

/**
 * Hook for keyboard shortcuts
 * Handles Ctrl+K, Escape, ?, E, 1-5 keys
 */
export function useKeyboardShortcuts({
  onTogglePalette,
  onClosePalette,
  onToggleHelp,
  onToggleExpandAll,
  onNavigateToTask,
}: KeyboardShortcutsConfig) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl+K - command palette
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      onTogglePalette();
      return;
    }
    // Escape - close modals
    if (e.key === 'Escape') {
      onClosePalette();
      return;
    }
    // Ignore if in input field
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    // ? - help modal
    if (e.key === '?') {
      onToggleHelp();
      return;
    }
    // E or К (Russian) - expand all
    if (e.key === 'e' || e.key === 'E' || e.key === 'к' || e.key === 'К') {
      onToggleExpandAll();
    }
    // 1-5 - navigate to task
    const num = parseInt(e.key);
    if (num >= 1 && num <= 5) {
      onNavigateToTask(num);
    }
  }, [onTogglePalette, onClosePalette, onToggleHelp, onToggleExpandAll, onNavigateToTask]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
