import { useEffect, useMemo, useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";

import { CommentComposer } from "@/features/comments/components/CommentComposer";
import { CommentThread } from "@/features/comments/components/CommentThread";
import { useReportComments } from "@/features/comments/hooks/useReportComments";
import type { CommentResponse, MentionUser } from "@/features/comments/types";
import { Button } from "@/shared/components/ui/button";
import { toast } from "@/shared/hooks/use-toast";
import { cn } from "@/shared/utils/utils";

interface ReportCommentsSectionProps {
  reportId: number;
  className?: string;
}

interface CommentThreadViewModel {
  rootComment: CommentResponse;
  repliesByParentId: Map<number, CommentResponse[]>;
  replyCount: number;
}

interface ReplyTarget extends MentionUser {
  commentId: number;
}

function buildMentionUsers(comments: CommentResponse[]): MentionUser[] {
  const seenUsernames = new Set<string>();
  const users: MentionUser[] = [];

  comments.forEach((comment, index) => {
    const username = comment.username.trim();
    if (!username) return;

    const normalizedUsername = username.toLocaleLowerCase("ro-RO");
    if (seenUsernames.has(normalizedUsername)) return;

    seenUsernames.add(normalizedUsername);
    users.push({
      userId: Number.isFinite(comment.userId) ? comment.userId : -index - 1,
      username,
    });
  });

  return users.sort((left, right) =>
    left.username.localeCompare(right.username, "ro-RO", { sensitivity: "base" })
  );
}

function buildCommentThreads(comments: CommentResponse[]): CommentThreadViewModel[] {
  const repliesByParentId = new Map<number, CommentResponse[]>();
  const rootComments: CommentResponse[] = [];

  comments.forEach((comment) => {
    if (comment.parentCommentId === null) {
      rootComments.push(comment);
      return;
    }

    const currentReplies = repliesByParentId.get(comment.parentCommentId) ?? [];
    currentReplies.push(comment);
    repliesByParentId.set(comment.parentCommentId, currentReplies);
  });

  const countReplies = (
    parentCommentId: number,
    visitedCommentIds: Set<number>
  ): number => {
    const directReplies = repliesByParentId.get(parentCommentId) ?? [];
    let replyCount = 0;

    directReplies.forEach((reply) => {
      if (visitedCommentIds.has(reply.commentId)) return;

      visitedCommentIds.add(reply.commentId);
      replyCount += 1;
      replyCount += countReplies(reply.commentId, visitedCommentIds);
    });

    return replyCount;
  };

  return rootComments.map((rootComment) => ({
    rootComment,
    repliesByParentId,
    replyCount: countReplies(rootComment.commentId, new Set([rootComment.commentId])),
  }));
}

function findThreadRootCommentId(
  comments: CommentResponse[],
  commentId: number
): number {
  const commentsById = new Map(
    comments.map((comment) => [comment.commentId, comment] as const)
  );
  const visitedCommentIds = new Set<number>();
  let currentComment = commentsById.get(commentId);
  let rootCommentId = commentId;

  while (currentComment?.parentCommentId !== null && currentComment?.parentCommentId !== undefined) {
    if (visitedCommentIds.has(currentComment.commentId)) break;

    visitedCommentIds.add(currentComment.commentId);

    const parentComment = commentsById.get(currentComment.parentCommentId);
    if (!parentComment) break;

    rootCommentId = parentComment.commentId;
    currentComment = parentComment;
  }

  return rootCommentId;
}

export function ReportCommentsSection({
  reportId,
  className,
}: ReportCommentsSectionProps) {
  const [open, setOpen] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [text, setText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [collapsedThreadIds, setCollapsedThreadIds] = useState<Set<number>>(
    () => new Set()
  );
  const {
    comments,
    loading,
    submitting,
    deletingCommentId,
    editingCommentId: savingCommentId,
    errorMessage,
    loadComments,
    submitComment,
    updateComment,
    deleteComment,
  } = useReportComments(reportId);

  const mentionUsers = useMemo(() => buildMentionUsers(comments), [comments]);
  const commentThreads = useMemo(() => buildCommentThreads(comments), [comments]);

  useEffect(() => {
    if (!open || hasLoadedOnce) return;

    void loadComments().then(() => setHasLoadedOnce(true));
  }, [hasLoadedOnce, loadComments, open]);

  const handleSubmit = async () => {
    const parentCommentId = replyTarget?.commentId ?? null;
    const rootCommentId =
      parentCommentId !== null ? findThreadRootCommentId(comments, parentCommentId) : null;
    const success = await submitComment(text, parentCommentId);
    if (!success) return;

    if (rootCommentId !== null) {
      setCollapsedThreadIds((current) => {
        const next = new Set(current);
        next.delete(rootCommentId);
        return next;
      });
    }

    setText("");
    setReplyTarget(null);
    toast({
      title: "Comentariu trimis",
      description: "Comentariul a fost adăugat cu succes.",
    });
  };

  const handleDelete = async (commentId: number) => {
    const success = await deleteComment(commentId);
    if (!success) return;

    toast({
      title: "Comentariu șters",
      description: "Comentariul a fost eliminat.",
    });
  };

  const startEditing = (comment: CommentResponse) => {
    setEditingCommentId(comment.commentId);
    setEditingText(comment.text);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingText("");
  };

  const handleUpdate = async (commentId: number) => {
    const success = await updateComment(commentId, editingText);
    if (!success) return;

    cancelEditing();
    toast({
      title: "Comentariu actualizat",
      description: "Modificările au fost salvate.",
    });
  };

  const startReply = (comment: CommentResponse) => {
    const target = {
      commentId: comment.commentId,
      userId: Number.isFinite(comment.userId) ? comment.userId : comment.commentId,
      username: comment.username,
    };
    const mentionPrefix = `@${comment.username}`;

    setReplyTarget(target);
    setText((currentText) => {
      const trimmedStart = currentText.trimStart();
      if (trimmedStart.startsWith(mentionPrefix)) return currentText;

      return currentText.trim()
        ? `${mentionPrefix} ${currentText}`
        : `${mentionPrefix} `;
    });
  };

  const cancelReply = () => {
    setText((currentText) => {
      if (!replyTarget) return currentText;

      const mentionPrefix = `@${replyTarget.username}`;
      const trimmedText = currentText.trim();

      return trimmedText === mentionPrefix ? "" : currentText;
    });
    setReplyTarget(null);
  };

  const toggleReplies = (commentId: number) => {
    setCollapsedThreadIds((current) => {
      const next = new Set(current);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }

      return next;
    });
  };

  return (
    <div
      className={cn("space-y-3", className)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Button
        type="button"
        variant={open ? "secondary" : "outline"}
        size="sm"
        className="gap-2"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <MessageCircle className="h-4 w-4" />
        Comentarii
        {hasLoadedOnce && (
          <span className="rounded-full bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground">
            {comments.length}
          </span>
        )}
      </Button>

      {open && (
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Se încarcă comentariile...
            </div>
          ) : (
            <div className="space-y-3">
              {errorMessage && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errorMessage}
                </div>
              )}

              {comments.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-background/60 px-3 py-4 text-center text-sm text-muted-foreground">
                  Nu există încă comentarii.
                </p>
              ) : (
                <div className="space-y-2">
                  {commentThreads.map(({ rootComment, repliesByParentId, replyCount }) => (
                    <CommentThread
                      key={rootComment.commentId}
                      rootComment={rootComment}
                      repliesByParentId={repliesByParentId}
                      replyCount={replyCount}
                      expanded={!collapsedThreadIds.has(rootComment.commentId)}
                      deletingCommentId={deletingCommentId}
                      savingCommentId={savingCommentId}
                      editingCommentId={editingCommentId}
                      editingText={editingText}
                      onToggleReplies={toggleReplies}
                      onStartEditing={startEditing}
                      onCancelEditing={cancelEditing}
                      onEditingTextChange={setEditingText}
                      onSaveEditing={handleUpdate}
                      onDelete={handleDelete}
                      onReply={startReply}
                    />
                  ))}
                </div>
              )}

              <CommentComposer
                value={text}
                mentionUsers={mentionUsers}
                submitting={submitting}
                replyTarget={replyTarget}
                onChange={setText}
                onSubmit={handleSubmit}
                onCancelReply={cancelReply}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
