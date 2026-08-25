import { useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Loader2, Send, X } from "lucide-react";

import { MentionSuggestions } from "@/features/comments/components/MentionSuggestions";
import type { MentionUser } from "@/features/comments/types";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";

const MENTION_CONTEXT_PATTERN = /(^|\s)@([\p{L}\p{N}_.-]*)$/u;
const MAX_MENTION_SUGGESTIONS = 6;

interface MentionMatch {
  start: number;
  end: number;
  query: string;
}

interface CommentComposerProps {
  value: string;
  mentionUsers: MentionUser[];
  submitting: boolean;
  replyTarget: MentionUser | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancelReply: () => void;
}

function getActiveMentionMatch(value: string, cursorPosition: number): MentionMatch | null {
  const textBeforeCursor = value.slice(0, cursorPosition);
  const match = textBeforeCursor.match(MENTION_CONTEXT_PATTERN);

  if (!match) return null;

  const atIndex = textBeforeCursor.lastIndexOf("@");
  if (atIndex < 0) return null;

  return {
    start: atIndex,
    end: cursorPosition,
    query: match[2] ?? "",
  };
}

function filterMentionUsers(users: MentionUser[], query: string): MentionUser[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("ro-RO");

  return users
    .filter((user) =>
      normalizedQuery
        ? user.username.toLocaleLowerCase("ro-RO").includes(normalizedQuery)
        : true
    )
    .slice(0, MAX_MENTION_SUGGESTIONS);
}

export function CommentComposer({
  value,
  mentionUsers,
  submitting,
  replyTarget,
  onChange,
  onSubmit,
  onCancelReply,
}: CommentComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [mentionMatch, setMentionMatch] = useState<MentionMatch | null>(null);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);

  const suggestedUsers = useMemo(() => {
    if (!mentionMatch) return [];

    return filterMentionUsers(mentionUsers, mentionMatch.query);
  }, [mentionMatch, mentionUsers]);

  const updateMentionContext = (nextValue = value, cursorPosition?: number) => {
    const textarea = textareaRef.current;
    const selectionStart = cursorPosition ?? textarea?.selectionStart;
    if (typeof selectionStart !== "number") return;

    const nextMatch = getActiveMentionMatch(nextValue, selectionStart);
    setMentionMatch(nextMatch);
    setActiveMentionIndex(0);
  };

  const selectMentionUser = (user: MentionUser) => {
    if (!mentionMatch) return;

    const nextValue = `${value.slice(0, mentionMatch.start)}@${user.username} ${value.slice(
      mentionMatch.end
    )}`;
    const nextCursorPosition = mentionMatch.start + user.username.length + 2;

    onChange(nextValue);
    setMentionMatch(null);

    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestedUsers.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveMentionIndex((current) => (current + 1) % suggestedUsers.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveMentionIndex(
        (current) => (current - 1 + suggestedUsers.length) % suggestedUsers.length
      );
      return;
    }

    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      selectMentionUser(suggestedUsers[activeMentionIndex]);
      return;
    }

    if (event.key === "Escape") {
      setMentionMatch(null);
    }
  };

  return (
    <div className="space-y-2 border-t border-border pt-3">
      {replyTarget && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
          <span className="min-w-0 truncate text-muted-foreground">
            Răspunzi lui <span className="font-medium text-foreground">@{replyTarget.username}</span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={onCancelReply}
            aria-label="Anulează răspunsul"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <div className="relative">
        <MentionSuggestions
          users={suggestedUsers}
          activeIndex={activeMentionIndex}
          onSelect={selectMentionUser}
          onActiveIndexChange={setActiveMentionIndex}
        />
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => {
            const nextValue = event.target.value;
            onChange(nextValue);
            updateMentionContext(nextValue, event.target.selectionStart);
          }}
          onClick={() => updateMentionContext()}
          onKeyUp={() => updateMentionContext()}
          onKeyDown={handleKeyDown}
          placeholder="Scrie un comentariu..."
          className="min-h-[76px] resize-none bg-background"
          disabled={submitting}
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          className="gap-2"
          disabled={!value.trim() || submitting}
          onClick={onSubmit}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Trimite
        </Button>
      </div>
    </div>
  );
}
