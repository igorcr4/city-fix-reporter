export interface CommentCreateRequest {
  text: string;
  parentCommentId: number | null;
}

export interface CommentUpdateRequest {
  text: string;
}

export interface MentionUser {
  userId: number;
  username: string;
}

export interface CommentResponse {
  commentId: number;
  parentCommentId: number | null;
  reportId: number;
  text: string;
  createdAt: string;
  updatedAt: string | null;
  username: string;
  userId: number;
  canEdit: boolean;
  canDelete: boolean;
}
