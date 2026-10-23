/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  ModerationReport,
  ReportTargetType,
  ReportReasonCategory,
  ReportStatus,
  ModerationActionType,
} from '../types';
import { adminService } from './adminService';

const STORAGE_KEY_REPORTS = 'nilpha_moderation_reports_v1';

function getLocalReports(): ModerationReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function saveLocalReports(reports: ModerationReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reports));
  } catch (e) {}
}

export const reportService = {
  /**
   * Submits a new moderation report.
   * Includes duplicate submission prevention and safe validation.
   */
  async submitReport(params: {
    reporterId?: string;
    reporter_id?: string;
    targetType?: ReportTargetType;
    target_type?: ReportTargetType;
    targetId?: string;
    target_id?: string;
    reportedUserId?: string;
    reported_user_id?: string;
    reason?: ReportReasonCategory;
    reason_category?: ReportReasonCategory;
    details?: string;
    targetPreview?: {
      title?: string;
      content?: string;
      author_name?: string;
      author_username?: string;
    };
    target_preview?: {
      title?: string;
      content?: string;
      author_name?: string;
      author_username?: string;
    };
  }): Promise<{ success: boolean; reportId?: string; isDuplicate?: boolean; error?: string }> {
    const reporterId = params.reporterId || (params as any).reporter_id;
    const targetType = params.targetType || (params as any).target_type;
    const targetId = params.targetId || (params as any).target_id;
    const reportedUserId = params.reportedUserId || (params as any).reported_user_id;
    const reason = params.reason || (params as any).reason_category;
    const details = params.details;
    const targetPreview = params.targetPreview || (params as any).target_preview;

    // Validate inputs
    if (!reporterId || !targetType || !targetId || !reason) {
      return { success: false, error: 'রিপোর্টের সমস্ত প্রয়োজনীয় তথ্য পূরণ করুন।' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        // Check duplicate pending report by this reporter for same target
        const { data: existing } = await supabase
          .from('reports')
          .select('id')
          .eq('reporter_id', reporterId)
          .eq('target_type', targetType)
          .eq('target_id', targetId)
          .eq('status', 'pending')
          .maybeSingle();

        if (existing) {
          return { success: true, reportId: existing.id, isDuplicate: true };
        }

        const insertPayload: any = {
          reporter_id: reporterId,
          target_type: targetType,
          target_id: targetId,
          reported_user_id: reportedUserId || null,
          reason,
          details: details ? details.trim().slice(0, 1000) : null,
          status: 'pending',
        };

        // Populate legacy foreign key columns if applicable
        if (targetType === 'post') insertPayload.post_id = targetId;
        if (targetType === 'comment') insertPayload.comment_id = targetId;
        if (targetType === 'group') insertPayload.group_id = targetId;
        if (targetType === 'page') insertPayload.page_id = targetId;
        if (targetType === 'message') insertPayload.message_id = targetId;
        if (targetType === 'stream') insertPayload.stream_id = targetId;

        const { data, error } = await supabase
          .from('reports')
          .insert(insertPayload)
          .select('id')
          .single();

        if (!error && data) {
          return { success: true, reportId: data.id };
        }
      } catch (err) {
        console.warn('Supabase submitReport error, fallback to local:', err);
      }
    }

    // Local / Offline Fallback Handling
    const reports = getLocalReports();
    const existing = reports.find(
      (r) =>
        r.reporter_id === reporterId &&
        r.target_type === targetType &&
        r.target_id === targetId &&
        r.status === 'pending'
    );

    if (existing) {
      return { success: true, reportId: existing.id, isDuplicate: true };
    }

    const newReport: ModerationReport = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      reported_user_id: reportedUserId || null,
      reason,
      details: details ? details.trim().slice(0, 1000) : null,
      status: 'pending',
      target_preview: targetPreview,
      created_at: new Date().toISOString(),
    };

    reports.unshift(newReport);
    saveLocalReports(reports);

    return { success: true, reportId: newReport.id };
  },

  /**
   * Retrieves reports for authorized moderators and administrators.
   */
  async getReports(params: {
    status?: ReportStatus | 'all';
    targetType?: ReportTargetType | 'all';
    reason?: ReportReasonCategory | 'all';
    limit?: number;
    offset?: number;
  }): Promise<{ reports: ModerationReport[]; totalCount: number }> {
    const { status = 'all', targetType = 'all', reason = 'all', limit = 20, offset = 0 } = params;

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('reports')
          .select(
            `
            *,
            reporter:profiles!reports_reporter_id_fkey(username, display_name),
            reported_user:profiles!reports_reported_user_id_fkey(username, display_name),
            moderator:profiles!reports_moderator_id_fkey(username, display_name)
          `,
            { count: 'exact' }
          )
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (status !== 'all') {
          query = query.eq('status', status);
        }
        if (targetType !== 'all') {
          query = query.eq('target_type', targetType);
        }
        if (reason !== 'all') {
          query = query.eq('reason', reason);
        }

        const { data, count, error } = await query;
        if (!error && data) {
          return {
            reports: data.map((d: any) => ({
              id: d.id,
              reporter_id: d.reporter_id,
              reporter_name: d.reporter?.display_name,
              reporter_username: d.reporter?.username,
              target_type: d.target_type || (d.post_id ? 'post' : 'comment'),
              target_id: d.target_id || d.post_id || d.comment_id,
              reported_user_id: d.reported_user_id,
              reported_user_name: d.reported_user?.display_name,
              reason: d.reason,
              details: d.details,
              status: d.status,
              moderator_id: d.moderator_id,
              moderator_name: d.moderator?.display_name,
              moderation_notes: d.moderation_notes,
              action_taken: d.action_taken,
              created_at: d.created_at,
              reviewed_at: d.reviewed_at,
            })),
            totalCount: count || 0,
          };
        }
      } catch (err) {
        console.warn('Supabase getReports error, using local fallback:', err);
      }
    }

    // Local reports fallback with realistic seed
    let reports = getLocalReports();
    if (reports.length === 0) {
      reports = [
        {
          id: 'rep-demo-1',
          reporter_id: 'user-tanvir',
          reporter_name: 'তানভীর আহমেদ',
          reporter_username: 'tanvir_dev',
          target_type: 'post',
          target_id: 'post-spam-demo',
          reported_user_id: 'user-spammer',
          reported_user_name: 'অপরিচিত ইউজার',
          reason: 'spam',
          details: 'পোস্টে অনাকাঙ্ক্ষিত বিজ্ঞাপনী লিংক বারবার শেয়ার করা হচ্ছে।',
          status: 'pending',
          target_preview: {
            title: 'দ্রুত টাকা আয়ের বিজ্ঞাপন',
            content: 'এই লিংকে ক্লিক করে অনলাইনে দৈনিক ৫০০০ টাকা উপার্জন করুন...',
            author_name: 'অপরিচিত ইউজার',
            author_username: 'spammer_99',
          },
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: 'rep-demo-2',
          reporter_id: 'user-nusrat',
          reporter_name: 'নুসরাত জাহান',
          reporter_username: 'nusrat_jahan',
          target_type: 'comment',
          target_id: 'comment-toxic-demo',
          reported_user_id: 'user-abusive',
          reported_user_name: 'উগ্র ব্যবহারকারী',
          reason: 'harassment',
          details: 'মন্তব্যের ঘরে কটূক্তি ও আক্রমণাত্মক ভাষা ব্যবহার করা হয়েছে।',
          status: 'pending',
          target_preview: {
            content: 'আপত্তিকর মন্তব্য ও আক্রমণাত্মক বাক্য...',
            author_name: 'উগ্র ব্যবহারকারী',
          },
          created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        },
        {
          id: 'rep-demo-3',
          reporter_id: 'user-shariful',
          reporter_name: 'শরীফুল ইসলাম',
          reporter_username: 'shariful_isl',
          target_type: 'profile',
          target_id: 'user-fake-impersonator',
          reported_user_id: 'user-fake-impersonator',
          reported_user_name: 'ভুয়া অ্যাকাউন্ট',
          reason: 'impersonation',
          details: 'অন্য ব্যক্তির ছবি ও নাম নকল করে তৈরি করা অ্যাকাউন্ট।',
          status: 'resolved',
          action_taken: 'warning',
          moderator_name: 'মডারেটর করিম',
          moderation_notes: 'ইউজারকে প্রোফাইল নাম ও ছবি পরিবর্তনের সতর্কবার্তা প্রদান করা হয়েছে।',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        },
      ];
      saveLocalReports(reports);
    }

    let filtered = reports;
    if (status !== 'all') {
      filtered = filtered.filter((r) => r.status === status);
    }
    if (targetType !== 'all') {
      filtered = filtered.filter((r) => r.target_type === targetType);
    }
    if (reason !== 'all') {
      filtered = filtered.filter((r) => r.reason === reason);
    }

    return {
      reports: filtered.slice(offset, offset + limit),
      totalCount: filtered.length,
    };
  },

  /**
   * Applies an authorized moderation action to a report and logs it to audit trail.
   */
  async applyModerationAction(params: {
    reportId: string;
    actionType: ModerationActionType;
    moderatorId: string;
    reason: string;
    internalNotes?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { reportId, actionType, moderatorId, reason, internalNotes } = params;
    const now = new Date().toISOString();

    let newStatus: ReportStatus = 'resolved';
    if (actionType === 'dismiss_report') newStatus = 'dismissed';

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('reports')
          .update({
            status: newStatus,
            moderator_id: moderatorId,
            moderation_notes: internalNotes || reason,
            action_taken: actionType,
            reviewed_at: now,
            updated_at: now,
          })
          .eq('id', reportId);

        if (error) {
          console.warn('Supabase update report status error:', error);
        }
      } catch (err) {}
    }

    // Update in local state
    const reports = getLocalReports();
    const target = reports.find((r) => r.id === reportId);
    if (target) {
      target.status = newStatus;
      target.moderator_id = moderatorId;
      target.action_taken = actionType;
      target.moderation_notes = internalNotes || reason;
      target.reviewed_at = now;
      saveLocalReports(reports);
    }

    // Record in immutable audit log
    await adminService.logAuditAction({
      actorId: moderatorId,
      actionType: `moderation_${actionType}`,
      targetType: target ? target.target_type : 'report',
      targetId: target ? target.target_id : reportId,
      reason,
      metadata: {
        reportId,
        actionType,
        internalNotes,
      },
    });

    return { success: true };
  },

  /**
   * Convenience method to retrieve reports queue array directly.
   */
  async getReportsQueue(
    status: ReportStatus | 'all' = 'all',
    targetType: ReportTargetType | 'all' = 'all',
    limit = 50,
    offset = 0
  ): Promise<ModerationReport[]> {
    const res = await this.getReports({ status, targetType, limit, offset });
    return res.reports;
  },

  /**
   * Reviews and closes a report with decision and moderator notes.
   */
  async reviewReport(
    moderatorId: string,
    reportId: string,
    decision: 'resolved' | 'dismissed',
    moderatorNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    const actionType: ModerationActionType =
      decision === 'dismissed' ? 'dismiss_report' : 'mark_reviewed';

    return this.applyModerationAction({
      reportId,
      actionType,
      moderatorId,
      reason: moderatorNotes || `Report marked as ${decision}`,
      internalNotes: moderatorNotes,
    });
  },

  /**
   * Takes a moderation action (content deletion, warning, suspension, ban)
   */
  async takeModerationAction(params: {
    actorId: string;
    reportId: string;
    actionType: string;
    targetType: ReportTargetType;
    targetId: string;
    reason: string;
    deleteContent?: boolean;
    suspendUserId?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { actorId, reportId, actionType, reason, suspendUserId } = params;

    let modAction: ModerationActionType = 'resolve_report';
    if (actionType.includes('delete') || actionType.includes('remove')) modAction = 'remove_content';
    else if (actionType.includes('suspend')) modAction = 'suspend_user';
    else if (actionType.includes('ban')) modAction = 'ban_user';
    else if (actionType.includes('dismiss')) modAction = 'dismiss_report';

    if (suspendUserId) {
      await adminService.updateUserStatus(
        actorId,
        suspendUserId,
        actionType.includes('ban') ? 'banned' : 'suspended',
        reason
      );
    }

    const res = await this.applyModerationAction({
      reportId,
      actionType: modAction,
      moderatorId: actorId,
      reason,
      internalNotes: reason,
    });

    if (res.success) {
      const reports = getLocalReports();
      const target = reports.find((r) => r.id === reportId);
      if (target) {
        target.action_taken = actionType;
        saveLocalReports(reports);
      }
    }

    return res;
  },
};
