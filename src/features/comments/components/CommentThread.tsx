import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { CommentItem } from "@/features/comments/components/CommentItem";
import type { CommentResponse } from "@/features/comments/types";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/utils";

interface CommentThreadProps {
  rootComment: CommentResponse;
  repliesByParentId: Map<number, CommentResponse[]>;
  replyCount: number;
  expanded: boolean;
  deletingCommentId: number | null;
  savingCommentId: number | null;
  editingCommentId: number | null;
  editingText: string;
  onToggleReplies: (commentId: number) => void;
  onStartEditing: (comment: CommentResponse) => void;
  onCancelEditing: () => void;
  onEditingTextChange: (value: string) => void;
  onSaveEditing: (commentId: number) => void;
  onDelete: (commentId: number) => void;
  onReply: (comment: CommentResponse) => void;
}

export function CommentThread({
  rootComment,
  repliesByParentId,
  replyCount,
  expanded,
  deletingCommentId,
  savingCommentId,
  editingCommentId,
  editingText,
  onToggleReplies,
  onStartEditing,
  onCancelEditing,
  onEditingTextChange,
  onSaveEditing,
  onDelete,
  onReply,
}: CommentThreadProps) {
  const hasReplies = replyCount > 0;

  const renderReplies = (
    parentCommentId: number,
    visitedCommentIds: Set<number>,
    depth = 0
  ): ReactNode => {
    const replies = repliesByParentId.get(parentCommentId) ?? [];
    if (replies.length === 0) return null;

    return (
      <div
        className={cn(
          "space-y-2",
          depth > 0 && "ml-3 border-l border-primary/10 pl-3"
        )}
      >
        {replies.map((reply) => {
          if (visitedCommentIds.has(reply.commentId)) return null;

          const nextVisitedCommentIds = new Set(visitedCommentIds);
          nextVisitedCommentIds.add(reply.commentId);

          return (
            <div key={reply.commentId} className="space-y-2">
              <CommentItem
                comment={reply}
                nested
                deletingCommentId={deletingCommentId}
                savingCommentId={savingCommentId}
                isEditing={editingCommentId === reply.commentId}
                editingText={editingText}
                onStartEditing={onStartEditing}
                onCancelEditing={onCancelEditing}
                onEditingTextChange={onEditingTextChange}
                onSaveEditing={onSaveEditing}
                onDelete={onDelete}
                onReply={onReply}
              />
              {renderReplies(reply.commentId, nextVisitedCommentIds, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <CommentItem
        comment={rootComment}
        deletingCommentId={deletingCommentId}
        savingCommentId={savingCommentId}
        isEditing={editingCommentId === rootComment.commentId}
        editingText={editingText}
        onStartEditing={onStartEditing}
        onCancelEditing={onCancelEditing}
        onEditingTextChange={onEditingTextChange}
        onSaveEditing={onSaveEditing}
        onDelete={onDelete}
        onReply={onReply}
      />

      {hasReplies && (
        <div className="ml-5 border-l-2 border-primary/20 pl-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-2 h-7 gap-1.5 px-2 text-xs text-muted-foreground"
            onClick={() => onToggleReplies(rootComment.commentId)}
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            {expanded
              ? "Ascunde răspunsurile"
              : `Afișează răspunsurile (${replyCount})`}
          </Button>

          {expanded && (
            renderReplies(rootComment.commentId, new Set([rootComment.commentId]))
          )}
        </div>
      )}
    </div>
  );
}
