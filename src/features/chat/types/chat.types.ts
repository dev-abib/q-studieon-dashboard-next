// src/features/chat/types/chat.types.ts
export interface StaffSummary {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  profilePictureURL: string | null;
}

export interface ChatMention {
  id: string;
  mentionedId: string;
  isRead: boolean;
  mentioned: { id: string; name: string | null };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  groupId: string | null;
  dmPartnerId: string | null;
  content: string;
  isEdited: boolean;
  editedAt: string | null;
  isDeleted: boolean;
  isFlagged: boolean;
  flagReason: string | null;
  isAutoFlagged: boolean;
  autoFlagReason: string | null;
  // File attachment
  attachmentUrl: string | null;
  attachmentType: string | null; // "image" | "video" | "document" | "audio"
  attachmentName: string | null;
  attachmentSizeBytes: number | null;
  createdAt: string;
  sender: StaffSummary;
  mentions: ChatMention[];
}

export interface ChatGroupMember {
  id: string;
  staffId: string;
  addedAt: string;
  staff: StaffSummary;
}

export interface ChatGroup {
  id: string;
  name: string;
  description: string | null;
  avatarColor: string;
  isArchived: boolean;
  createdById: string;
  createdAt: string;
  members: ChatGroupMember[];
  _count?: { messages: number };
}

export type ConversationType = 'group' | 'dm';

export interface ActiveConversation {
  type: ConversationType;
  id: string; // groupId or partnerId
  label: string;
}

export interface TypingIndicator {
  staffId: string;
  staffName: string;
  isTyping: boolean;
}

export interface MentionNotification {
  messageId: string;
  senderName: string;
  groupId?: string;
  dmPartnerId?: string;
  contentSnippet: string;
}
