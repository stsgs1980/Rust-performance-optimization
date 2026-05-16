"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { usePersisted, parseString } from "@/hooks/use-persisted";

/**
 * Hook for task notes management
 * Persists notes per task in localStorage
 */
export function useTaskNotes() {
  const [taskNotes, setTaskNotes] = usePersisted('perf-lab-notes', '{}', parseString, parseString);
  const [noteOpenTask, setNoteOpenTask] = useState<number | null>(null);
  const taskNotesRef = useRef(taskNotes);

  useEffect(() => { taskNotesRef.current = taskNotes; }, [taskNotes]);

  const getNote = useCallback((taskId: number): string => {
    try {
      const notes = JSON.parse(taskNotes || '{}');
      return notes[String(taskId)] || '';
    } catch {
      return '';
    }
  }, [taskNotes]);

  const saveNote = useCallback((taskId: number, text: string) => {
    try {
      const notes = JSON.parse(taskNotes || '{}');
      if (text.trim()) notes[String(taskId)] = text;
      else delete notes[String(taskId)];
      setTaskNotes(JSON.stringify(notes));
    } catch { /* ignore */ }
  }, [taskNotes, setTaskNotes]);

  const toggleNoteOpen = useCallback((taskId: number) => {
    setNoteOpenTask(n => n === taskId ? null : taskId);
  }, []);

  return {
    noteOpenTask,
    getNote,
    saveNote,
    toggleNoteOpen,
  };
}
