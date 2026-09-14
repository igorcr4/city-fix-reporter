import { apiFetch } from "@/core/api/http";
import { parseErrorMessage, readBoolean } from "@/core/api/parsing";
import { API_BASE_URL as BASE_URL } from "@/core/config/api";
import type {
  CommentCreateRequest,
  CommentResponse,
  CommentUpdateRequest,
} from "@/features/comments/types";

function normalizeCommentResponse(raw: unknown): CommentResponse {
  const item = raw as Partial<CommentResponse> & {
    parent_comment_id?: unknown;
    parentId?: unknown;
    parent?: { commentId?: unknown; id?: unknown } | null;
    parentComment?: { commentId?: unknown; id?: unknown } | null;
  };
  const rawParentCommentId =
    item.parentCommentId ??
    item.parent_comment_id ??
    item.parentId ??
    item.parentComment?.commentId ??
    item.parentComment?.id ??
    item.parent?.commentId ??
    item.parent?.id;
  const parentCommentId =
    rawParentCommentId === null || rawParentCommentId === undefined
      ? null
      : Number(rawParentCommentId);

  return {
    commentId: Number(item.commentId),
    parentCommentId: Number.isFinite(parentCommentId) ? parentCommentId : null,
    reportId: Number(item.reportId),
    text: String(item.text ?? ""),
    createdAt: String(item.createdAt ?? ""),
    updatedAt: item.updatedAt ? String(item.updatedAt) : null,
    username: String(item.username ?? "Utilizator"),
    userId: Number(item.userId),
    canEdit: readBoolean(item.canEdit),
    canDelete: readBoolean(item.canDelete),
  };
}

export async function getReportComments(reportId: number): Promise<CommentResponse[]> {
  const response = await apiFetch(`${BASE_URL}/comments/by-report/${reportId}`);

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Comentariile nu au putut fi încărcate.")
    );
  }

  const raw = (await response.json()) as unknown;
  return Array.isArray(raw) ? raw.map(normalizeCommentResponse) : [];
}

export async function createReportComment(
  reportId: number,
  data: CommentCreateRequest
): Promise<CommentResponse> {
  const response = await apiFetch(`${BASE_URL}/comments/report/${reportId}/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Comentariul nu a putut fi trimis.")
    );
  }

  const raw = (await response.json()) as unknown;
  return normalizeCommentResponse(raw);
}

export async function updateReportComment(
  commentId: number,
  data: CommentUpdateRequest
): Promise<CommentResponse> {
  const response = await apiFetch(`${BASE_URL}/comments/edit/${commentId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Comentariul nu a putut fi actualizat.")
    );
  }

  const raw = (await response.json()) as unknown;
  return normalizeCommentResponse(raw);
}

export async function deleteReportComment(commentId: number): Promise<void> {
  const response = await apiFetch(`${BASE_URL}/comments/${commentId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Comentariul nu a putut fi șters.")
    );
  }
}
