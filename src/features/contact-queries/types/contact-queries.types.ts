export type ContactQueryStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type ContactQueryPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface LinkedUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  userRole?: string | null;
  profilePictureURL?: string | null;
  isPaid?: boolean | null;
  createdAt?: string;
}

export interface ActivityLogEntry {
  action: string;
  timestamp: string;
  byName?: string;
  byEmail?: string;
  toName?: string;
  toEmail?: string;
  toRole?: string;
  transferNote?: string;
  note?: string;
  previousPriority?: string;
  newPriority?: string;
  [key: string]: any;
}

export interface ContactQuery {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactQueryStatus;
  priority: ContactQueryPriority;
  isRegisteredUser: boolean;
  userId?: string | null;
  user?: LinkedUser | null;

  // Reply tracking
  replyMessage?: string | null;
  repliedAt?: string | null;
  repliedById?: string | null;
  repliedByName?: string | null;
  repliedByEmail?: string | null;

  // Case Assignment & Transfer
  assignedToId?: string | null;
  assignedToName?: string | null;
  assignedToEmail?: string | null;
  assignedToRole?: string | null;
  assignedAt?: string | null;
  transferNote?: string | null;

  // Internal Notes & Activity Log
  internalNotes?: string | null;
  activityLog?: ActivityLogEntry[] | null;

  createdAt: string;
  updatedAt: string;
}

export interface StaffMember {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  profilePictureURL?: string | null;
  canDeleteQueries?: boolean | null;
  isOwner?: boolean | null;
}

export interface ContactQueriesMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ContactQueriesResponse {
  data: ContactQuery[];
  meta: ContactQueriesMeta;
}

export interface StaffWorkloadItem {
  staffId: string;
  staffName: string;
  staffEmail: string;
  staffRole: string;
  profilePictureURL?: string | null;
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}

export interface ContactQueryStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  registeredUserCount: number;
  unassignedCount?: number;
  urgentCount?: number;
  highCount?: number;
  staffWorkload?: StaffWorkloadItem[];
}

export interface GetAllContactQueriesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ContactQueryStatus | 'ALL';
  priority?: ContactQueryPriority | 'ALL';
  isRegisteredUser?: boolean;
  assignedToId?: string;
  sortBy?: 'createdAt' | 'name' | 'status' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface ReplyContactQueryPayload {
  replyMessage: string;
  customSubject?: string;
}

export interface AssignContactQueryPayload {
  assignedToId: string;
  transferNote?: string;
}

export interface BulkActionPayload {
  ids: string[];
  action: 'ASSIGN' | 'UPDATE_STATUS' | 'UPDATE_PRIORITY' | 'DELETE';
  assignedToId?: string;
  status?: ContactQueryStatus;
  priority?: ContactQueryPriority;
  transferNote?: string;
}
