// src/features/chat/components/GroupInfoDrawer.tsx
"use client";

import { useState } from "react";
import type { ChatGroup, StaffSummary } from "../types/chat.types";
import { useLeaveGroup, useAddGroupMember, useRemoveGroupMember } from "../hooks/use-chat-groups";
import { useChatStore } from "../store/use-chat-store";
import {
  X,
  Hash,
  Users,
  Settings,
  LogOut,
  Calendar,
  Shield,
  MessageSquare,
  UserPlus,
  UserMinus,
  Check,
  Search,
} from "lucide-react";

interface Props {
  group: ChatGroup;
  currentUserId: string;
  currentUserRole: string;
  isOwner?: boolean;
  onlineStaffIds: string[];
  onStartDm: (staff: StaffSummary) => void;
  onEditGroup: () => void;
  onClose: () => void;
}

export function GroupInfoDrawer({
  group,
  currentUserId,
  currentUserRole,
  isOwner,
  onlineStaffIds,
  onStartDm,
  onEditGroup,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState<"members" | "about">("members");
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  const leaveGroup = useLeaveGroup();
  const addMember = useAddGroupMember();
  const removeMember = useRemoveGroupMember();

  const staffList = useChatStore((s) => s.staffList);

  const isCreator = group.createdById === currentUserId;
  const isSuperAdmin = currentUserRole === "super_admin" || isOwner;
  const canEdit = isCreator || isSuperAdmin;

  const currentMemberIds = new Set(group.members.map((m) => m.staffId));
  const nonMembers = staffList.filter(
    (s) =>
      !currentMemberIds.has(s.id) &&
      (s.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
        s.email?.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  const handleLeaveGroup = () => {
    if (isCreator) {
      alert("As the group creator, you cannot leave the group. You can archive the group instead.");
      return;
    }
    if (confirm(`Are you sure you want to leave ${group.name}?`)) {
      leaveGroup.mutate(group.id, {
        onSuccess: () => {
          onClose();
        },
        onError: (err: any) => {
          alert(err?.response?.data?.message || "Failed to leave group");
        },
      });
    }
  };

  const handleAddMember = (staffId: string) => {
    addMember.mutate(
      { groupId: group.id, staffId },
      {
        onSuccess: () => {
          // Socket will auto-update or query invalidation handles state
        },
        onError: (err: any) => {
          alert(err?.response?.data?.message || "Failed to add member");
        },
      }
    );
  };

  const handleRemoveMember = (staffId: string, memberName: string) => {
    if (confirm(`Remove ${memberName} from ${group.name}?`)) {
      removeMember.mutate(
        { groupId: group.id, staffId },
        {
          onError: (err: any) => {
            alert(err?.response?.data?.message || "Failed to remove member");
          },
        }
      );
    }
  };

  return (
    <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shrink-0 shadow-lg animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Hash className="h-4 w-4 text-primary" />
          Group Info
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Group Hero Banner */}
        <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
          {group.avatarUrl ? (
            <img
              src={group.avatarUrl}
              alt={group.name}
              className="h-20 w-20 rounded-2xl object-cover border-2 border-primary shadow-md mb-3"
            />
          ) : (
            <div
              className="h-20 w-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md mb-3"
              style={{ backgroundColor: group.avatarColor || "#6366f1" }}
            >
              {group.name?.[0]?.toUpperCase() || <Hash className="h-10 w-10" />}
            </div>
          )}

          <h4 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
            {group.name}
          </h4>
          {group.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3">
              {group.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-4 w-full">
            {canEdit && (
              <button
                onClick={onEditGroup}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm"
              >
                <Settings className="h-3.5 w-3.5" />
                Edit Group
              </button>
            )}
            {!isCreator && (
              <button
                onClick={handleLeaveGroup}
                disabled={leaveGroup.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                Leave
              </button>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-medium">
          <button
            onClick={() => setActiveTab("members")}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === "members"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Members ({group.members.length})
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === "about"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            About
          </button>
        </div>

        {/* Members List Tab */}
        {activeTab === "members" && (
          <div className="space-y-3">
            {/* Add Member Button & Expandable Selector */}
            {canEdit && (
              <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-slate-50/50 dark:bg-slate-800/30">
                {!showAddMember ? (
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Members to Group
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Add Teammate
                      </span>
                      <button
                        onClick={() => {
                          setShowAddMember(false);
                          setMemberSearch("");
                        }}
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                      <input
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        placeholder="Search staff to add…"
                        className="w-full pl-7 pr-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800">
                      {nonMembers.length === 0 ? (
                        <p className="text-[11px] text-slate-400 py-2 text-center">
                          {memberSearch ? "No matching staff found" : "All staff are already in this group"}
                        </p>
                      ) : (
                        nonMembers.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between py-1.5 px-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {s.profilePictureURL ? (
                                <img
                                  src={s.profilePictureURL}
                                  alt=""
                                  className="h-6 w-6 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {s.name?.[0]?.toUpperCase() ?? "S"}
                                </div>
                              )}
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                                {s.name}
                              </span>
                            </div>
                            <button
                              onClick={() => handleAddMember(s.id)}
                              disabled={addMember.isPending}
                              className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all shrink-0"
                            >
                              Add
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Current Members List */}
            <div className="space-y-1.5">
              {group.members.map((m) => {
                const staff = m.staff;
                const isOnline = onlineStaffIds.includes(m.staffId);
                const isSelf = m.staffId === currentUserId;
                const isMemberCreator = m.staffId === group.createdById;
                const canRemoveThisMember = canEdit && !isMemberCreator && !isSelf;

                return (
                  <div
                    key={m.staffId}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group/member"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        {staff?.profilePictureURL ? (
                          <img
                            src={staff.profilePictureURL}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                            {staff?.name?.[0]?.toUpperCase() ?? "M"}
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                            isOnline ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                          {staff?.name ?? "Staff Member"}
                          {isSelf && <span className="text-[10px] text-slate-400">(You)</span>}
                        </p>
                        <p className="text-[10px] text-slate-400 capitalize truncate">
                          {isMemberCreator ? "Group Owner" : staff?.role?.replace("_", " ") ?? "Member"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!isSelf && (
                        <button
                          onClick={() => onStartDm(staff)}
                          title="Direct Message"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover/member:opacity-100"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {canRemoveThisMember && (
                        <button
                          onClick={() => handleRemoveMember(m.staffId, staff?.name || "this member")}
                          disabled={removeMember.isPending}
                          title="Remove from group"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-0 group-hover/member:opacity-100"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* About Details Tab */}
        {activeTab === "about" && (
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 space-y-2">
              <div className="flex items-center gap-2 text-slate-500">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Shield className="h-4 w-4 text-primary shrink-0" />
                <span>Private Team Channel</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
