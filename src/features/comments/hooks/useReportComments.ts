import { useCallback, useState } from "react";

import {
  createReportComment,
  deleteReportComment,
  getReportComments,
  updateReportComment,
} from "@/features/comments/api/comments";
import type { CommentResponse } from "@/features/comments/types";

interface UseReportCommentsResult {
  comments: CommentResponse[];
  loading: boolean;
  submitting: boolean;
  deletingCommentId: number | null;
  editingCommentId: number | null;
  errorMessage: string | null;
  loadComments: () => Promise<void>;
  submitComment: (text: string, parentCommentId?: number | null) => Promise<boolean>;
  updateComment: (commentId: number, text: string) => Promise<boolean>;
  deleteComment: (commentId: number) => Promise<boolean>;
}

export function useReportComments(reportId: number): UseReportCommentsResult {
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const data = await getReportComments(reportId);
      setComments(data);
    } catch (error) {
      console.error("LOAD REPORT COMMENTS ERROR:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Comentariile nu au putut fi încărcate."
      );
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  const submitComment = useCallback(
    async (text: string, parentCommentId: number | null = null) => {
      const trimmedText = text.trim();
      if (!trimmedText || submitting) return false;

      setSubmitting(true);
      setErrorMessage(null);

      try {
        const createdComment = await createReportComment(reportId, {
          text: trimmedText,
          parentCommentId,
        });

        setComments((current) => [
          ...current,
          {
            ...createdComment,
            parentCommentId,
          },
        ]);
        return true;
      } catch (error) {
        console.error("CREATE REPORT COMMENT ERROR:", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Comentariul nu a putut fi trimis."
        );
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [reportId, submitting]
  );

  const deleteComment = useCallback(
    async (commentId: number) => {
      if (deletingCommentId !== null) return false;

      setDeletingCommentId(commentId);
      setErrorMessage(null);

      try {
        await deleteReportComment(commentId);
        await loadComments();
        return true;
      } catch (error) {
        console.error("DELETE REPORT COMMENT ERROR:", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Comentariul nu a putut fi șters."
        );
        return false;
      } finally {
        setDeletingCommentId(null);
      }
    },
    [deletingCommentId, loadComments]
  );

  const updateComment = useCallback(
    async (commentId: number, text: string) => {
      const trimmedText = text.trim();
      if (!trimmedText || editingCommentId !== null) return false;

      setEditingCommentId(commentId);
      setErrorMessage(null);

      try {
        const updatedComment = await updateReportComment(commentId, {
          text: trimmedText,
        });

        setComments((current) =>
          current.map((comment) => {
            if (comment.commentId !== commentId) return comment;

            return {
              ...updatedComment,
              parentCommentId: updatedComment.parentCommentId ?? comment.parentCommentId,
            };
          })
        );
        return true;
      } catch (error) {
        console.error("UPDATE REPORT COMMENT ERROR:", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Comentariul nu a putut fi actualizat."
        );
        return false;
      } finally {
        setEditingCommentId(null);
      }
    },
    [editingCommentId]
  );

  return {
    comments,
    loading,
    submitting,
    deletingCommentId,
    editingCommentId,
    errorMessage,
    loadComments,
    submitComment,
    updateComment,
    deleteComment,
  };
}
