import { Loader2, MessageCircleReply, Pencil, Trash2, X } from "lucide-react";

import type { CommentResponse } from "@/features/comments/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/utils/utils";

const MENTION_TOKEN_PATTERN = /(@[\p{L}\p{N}_.-]+)/gu;
const EXACT_MENTION_TOKEN_PATTERN = /^@[\p{L}\p{N}_.-]+$/u;

interface CommentItemProps {
  comment: CommentResponse;
  deletingCommentId: number | null;
  savingCommentId: number | null;
  isEditing: boolean;
  editingText: string;
  nested?: boolean;
  onStartEditing: (comment: CommentResponse) => void;
  onCancelEditing: () => void;
  onEditingTextChange: (value: string) => void;
  onSaveEditing: (commentId: number) => void;
  onDelete: (commentId: number) => void;
  onReply: (comment: CommentResponse) => void;
}

function formatCommentDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function wasCommentUpdated(comment: CommentResponse): boolean {
  if (!comment.updatedAt) return false;

  const createdAt = new Date(comment.createdAt).getTime();
  const updatedAt = new Date(comment.updatedAt).getTime();

  return Number.isFinite(createdAt) && Number.isFinite(updatedAt) && updatedAt > createdAt;
}

function renderCommentText(text: string) {
  return text.split(MENTION_TOKEN_PATTERN).map((part, index) => {
    if (EXACT_MENTION_TOKEN_PATTERN.test(part)) {
      return (
        <span key={`${part}-${index}`} className="font-medium text-primary">
          {part}
        </span>
      );
    }

    return part;
  });
}

export function CommentItem({
  comment,
  deletingCommentId,
  savingCommentId,
  isEditing,
  editingText,
  nested = false,
  onStartEditing,
  onCancelEditing,
  onEditingTextChange,
  onSaveEditing,
  onDelete,
  onReply,
}: CommentItemProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-background p-3",
        nested && "border-border/80 bg-muted/30 p-2.5 shadow-none"
      )}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {comment.username}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {formatCommentDate(comment.createdAt)}
              {wasCommentUpdated(comment) && " · actualizat"}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
              disabled={savingCommentId !== null}
              onClick={() => onReply(comment)}
            >
              <MessageCircleReply className="h-3.5 w-3.5" />
              Răspunde
            </Button>

            {comment.canEdit && !isEditing && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                disabled={savingCommentId !== null}
                onClick={() => onStartEditing(comment)}
                aria-label="Editează comentariul"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}

            {comment.canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    disabled={deletingCommentId === comment.commentId}
                    aria-label="Șterge comentariul"
                  >
                    {deletingCommentId === comment.commentId ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ștergi comentariul?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Această acțiune nu poate fi anulată. Comentariul va fi eliminat definitiv.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Nu, anulează</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => onDelete(comment.commentId)}
                    >
                      Da, șterge
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editingText}
              onChange={(event) => onEditingTextChange(event.target.value)}
              className="min-h-[72px] resize-none"
              disabled={savingCommentId === comment.commentId}
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={savingCommentId === comment.commentId}
                onClick={onCancelEditing}
              >
                <X className="h-3.5 w-3.5" />
                Anulează
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={
                  !editingText.trim() ||
                  editingText.trim() === comment.text.trim() ||
                  savingCommentId === comment.commentId
                }
                onClick={() => onSaveEditing(comment.commentId)}
              >
                {savingCommentId === comment.commentId ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Pencil className="h-3.5 w-3.5" />
                )}
                Salvează
              </Button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {renderCommentText(comment.text)}
          </p>
        )}
      </div>
    </div>
  );
}
