/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  FileText,
  AlertTriangle,
  Activity,
  Coins,
  Settings,
  History,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  UserX,
  UserCheck,
  Filter,
  Search,
  RefreshCw,
  Sliders,
  ChevronRight,
  Loader2,
  Lock,
  ArrowLeft,
  Calendar,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotice } from '../../context/NoticeContext';
import { adminService } from '../../services/adminService';
import { reportService } from '../../services/reportService';
import {
  AdminDashboardMetrics,
  ModerationReport,
  ReportStatus,
  ReportTargetType,
  AdminAuditLog,
  SystemSettingItem,
  UserProfile,
  AppRole,
} from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotice();
  const navigate = useNavigate();

  // Access Control State
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<AppRole>('user');
  const [isVerifying, setIsVerifying] = useState(true);

  // Active Tab: 'overview' | 'reports' | 'users' | 'audit' | 'settings'
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'users' | 'audit' | 'settings'>('overview');

  // Overview Metrics
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [isMetricsLoading, setIsMetricsLoading] = useState(false);

  // Moderation Reports Queue
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [reportStatusFilter, setReportStatusFilter] = useState<ReportStatus | 'all'>('pending');
  const [reportTypeFilter, setReportTypeFilter] = useState<ReportTargetType | 'all'>('all');
  const [isReportsLoading, setIsReportsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [isTakingAction, setIsTakingAction] = useState(false);

  // User Management
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'suspended' | 'banned'>('all');
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState<UserProfile | null>(null);
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [targetStatus, setTargetStatus] = useState<'active' | 'suspended' | 'banned'>('suspended');
  const [targetRole, setTargetRole] = useState<AppRole>('user');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  // System Settings
  const [systemSettings, setSystemSettings] = useState<SystemSettingItem[]>([]);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);

  // Check RBAC Permissions
  useEffect(() => {
    async function verifyPermissions() {
      if (!user) {
        setHasAccess(false);
        setIsVerifying(false);
        return;
      }

      setIsVerifying(true);
      try {
        const role = await adminService.getUserRole(user.id);
        setUserRole(role);
        const modAccess = await adminService.hasModeratorAccess(user.id);
        const admAccess = await adminService.hasAdminAccess(user.id);

        setHasAccess(modAccess);
        setIsAdmin(admAccess);
      } catch (err) {
        setHasAccess(false);
      } finally {
        setIsVerifying(false);
      }
    }

    verifyPermissions();
  }, [user]);

  // Load Data for Tab
  useEffect(() => {
    if (hasAccess) {
      if (activeTab === 'overview') loadOverviewMetrics();
      if (activeTab === 'reports') loadReportsQueue();
      if (activeTab === 'users') loadUsers();
      if (activeTab === 'audit') loadAuditLogs();
      if (activeTab === 'settings') loadSettings();
    }
  }, [hasAccess, activeTab]);

  const loadOverviewMetrics = async () => {
    setIsMetricsLoading(true);
    try {
      const data = await adminService.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsMetricsLoading(false);
    }
  };

  const loadReportsQueue = async () => {
    setIsReportsLoading(true);
    try {
      const data = await reportService.getReportsQueue(reportStatusFilter, reportTypeFilter);
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsReportsLoading(false);
    }
  };

  const loadUsers = async () => {
    setIsUsersLoading(true);
    try {
      const list = await adminService.getUsersList({
        search: userSearchQuery,
        status: userStatusFilter,
      });
      setUsersList(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setIsAuditLoading(true);
    try {
      const logs = await adminService.getAuditLogs(50, 0, auditActionFilter);
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAuditLoading(false);
    }
  };

  const loadSettings = async () => {
    setIsSettingsLoading(true);
    try {
      const settings = await adminService.getSystemSettings();
      setSystemSettings(settings);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSettingsLoading(false);
    }
  };

  // Actions for Moderation Queue
  const handleModerateReport = async (
    action: 'dismiss' | 'delete_content' | 'suspend_user' | 'ban_user'
  ) => {
    if (!user || !selectedReport) return;
    setIsTakingAction(true);

    try {
      if (action === 'dismiss') {
        const res = await reportService.reviewReport(
          user.id,
          selectedReport.id,
          'dismissed',
          actionReason || 'তদন্ত সাপেক্ষে কোনো নিয়ম লঙ্ঘন পাওয়া যায়নি।'
        );
        if (res.success) {
          showToast('রিপোর্টটি খারিজ করা হয়েছে।');
        }
      } else {
        const actionType =
          action === 'delete_content'
            ? 'content_delete'
            : action === 'suspend_user'
            ? 'user_suspend'
            : 'user_ban';

        const res = await reportService.takeModerationAction({
          actorId: user.id,
          reportId: selectedReport.id,
          actionType,
          targetType: selectedReport.target_type,
          targetId: selectedReport.target_id,
          reason: actionReason || 'কমিউনিটি নীতিমালা লঙ্ঘনের দায়ে ব্যবস্থা গ্রহণ।',
          deleteContent: action === 'delete_content',
          suspendUserId:
            action === 'suspend_user' || action === 'ban_user'
              ? (selectedReport.reported_user_id || undefined)
              : undefined,
        });

        if (res.success) {
          showToast('মডারেশন সিদ্ধান্ত কার্যকর করা হয়েছে এবং অডিট ট্রেইলে সংরক্ষিত হয়েছে।');
        }
      }

      setSelectedReport(null);
      setActionReason('');
      loadReportsQueue();
    } catch (err: any) {
      showToast(err?.message || 'ব্যবস্থা গ্রহণে সমস্যা হয়েছে।');
    } finally {
      setIsTakingAction(false);
    }
  };

  // User Management Actions
  const handleUpdateUserStatus = async () => {
    if (!user || !selectedUserForAction) return;
    setIsTakingAction(true);

    try {
      const res = await adminService.updateUserStatus(
        user.id,
        selectedUserForAction.id,
        targetStatus,
        statusChangeReason || 'অ্যাডমিন ড্যাশবোর্ড থেকে স্ট্যাটাস আপডেট'
      );

      if (res.success) {
        showToast(`ব্যবহারকারীর স্ট্যাটাস '${targetStatus}' এ পরিবর্তিত হয়েছে।`);
        setSelectedUserForAction(null);
        setStatusChangeReason('');
        loadUsers();
      } else {
        showToast(res.error || 'স্ট্যাটাস পরিবর্তন করা সম্ভব হয়নি।');
      }
    } catch (err: any) {
      showToast(err?.message || 'সমস্যা হয়েছে।');
    } finally {
      setIsTakingAction(false);
    }
  };

  const handleUpdateUserRole = async (targetUserId: string, newRole: AppRole) => {
    if (!user) return;
    const confirm = window.confirm(`আপনি কি এই ব্যবহারকারীর রোল '${newRole}' করতে চান?`);
    if (!confirm) return;

    const res = await adminService.setUserRole(
      user.id,
      targetUserId,
      newRole,
      'অ্যাডমিনিস্ট্রেটর কর্তৃক ভূমিকা বরাদ্দ'
    );

    if (res.success) {
      showToast('ব্যবহারকারীর ভূমিকা সফলভাবে পরিবর্তন করা হয়েছে।');
      loadUsers();
    } else {
      showToast(res.error || 'ভূমিকা পরিবর্তন ব্যর্থ হয়েছে।');
    }
  };

  // Setting Toggle
  const handleToggleSetting = async (setting: SystemSettingItem) => {
    if (!user) return;
    const newValue =
      typeof setting.setting_value === 'boolean'
        ? !setting.setting_value
        : setting.setting_value;

    const res = await adminService.updateSystemSetting(
      user.id,
      setting.setting_key,
      newValue,
      `টগল করা হয়েছে: ${setting.setting_key}`
    );

    if (res.success) {
      showToast(`${setting.description || setting.setting_key} হালনাগাদ করা হয়েছে।`);
      loadSettings();
    }
  };

  // Render: Loading Screen
  if (isVerifying) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#155EEF] mb-3" />
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          অনুমোদন যাচাই করা হচ্ছে...
        </h2>
      </div>
    );
  }

  // Render: Access Denied
  if (!hasAccess) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white dark:bg-[#151D2C] border border-red-200 dark:border-red-900 rounded-2xl text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 bg-red-100 dark:bg-red-950/60 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            অ্যাক্সেস সংরক্ষিত (Access Denied)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            এই ড্যাশবোর্ডটি শুধুমাত্র অনুমোদিত মডারেটর ও অ্যাডমিনিস্ট্রেটরদের জন্য নির্ধারিত।
            আপনার বর্তমান প্রোফাইল এই অংশে প্রবেশের অনুমতিপ্রাপ্ত নয়।
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          মূল পাতায় ফিরে যান
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-blue-400" />
            <h1 className="text-2xl font-black tracking-tight">নিলফা অ্যাডমিন ও মডারেশন প্যানেল</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/30 text-blue-300 border border-blue-400/30">
              {userRole}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl">
            প্ল্যাটফর্মের নিরাপত্তা পর্যবেক্ষণ, রিপোর্ট পর্যালোচনা, অডিট ট্রেইল সংরক্ষণ এবং ব্যবহারকারী ব্যবস্থাপনা।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeTab === 'overview') loadOverviewMetrics();
              if (activeTab === 'reports') loadReportsQueue();
              if (activeTab === 'users') loadUsers();
              if (activeTab === 'audit') loadAuditLogs();
              if (activeTab === 'settings') loadSettings();
              showToast('তথ্য হালনাগাদ করা হয়েছে।');
            }}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            রিফ্রেশ
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'overview', label: 'সারসংক্ষেপ (Overview)', icon: Activity },
          {
            id: 'reports',
            label: 'মডারেশন কিউ (Queue)',
            icon: ShieldAlert,
            badge: metrics?.pendingReports,
          },
          { id: 'users', label: 'ব্যবহারকারী পরিচালনা (Users)', icon: Users },
          { id: 'audit', label: 'অডিট ট্রেইল (Audit Logs)', icon: History },
          { id: 'settings', label: 'সিস্টেম সেটিংস (Settings)', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'border-[#155EEF] text-[#155EEF] bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-black">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {isMetricsLoading && !metrics ? (
            <div className="p-12 text-center bg-white dark:bg-[#151D2C] rounded-2xl border border-slate-200 dark:border-slate-800">
              <Loader2 className="w-7 h-7 animate-spin text-[#155EEF] mx-auto mb-2" />
              <p className="text-xs text-slate-500">মেট্রিক্স লোড হচ্ছে...</p>
            </div>
          ) : (
            <>
              {/* Metric KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-semibold">মোট ব্যবহারকারী</span>
                    <Users className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {metrics?.totalUsers.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +{(metrics?.newUsersThisWeek || 0)} এই সপ্তাহে
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-semibold">সক্রিয় ব্যবহারকারী (২৪ ঘণ্টা)</span>
                    <Activity className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {metrics?.activeUsers24h.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    অনলাইন ট্রাফিক
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-semibold">মোট পোস্ট ও আলোচনা</span>
                    <FileText className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {metrics?.totalPosts.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-1">
                    +{(metrics?.newPostsThisWeek || 0)} নতুন কনটেন্ট
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#151D2C] border border-red-200 dark:border-red-950/60 shadow-xs bg-red-50/30 dark:bg-red-950/20">
                  <div className="flex items-center justify-between text-red-600 dark:text-red-400 mb-2">
                    <span className="text-xs font-semibold">অমীমাংসিত রিপোর্ট</span>
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="text-2xl font-black text-red-600 dark:text-red-400">
                    {metrics?.pendingReports}
                  </div>
                  <p className="text-[11px] text-red-500 mt-1 font-medium">
                    জরুরি মডারেশন প্রয়োজন
                  </p>
                </div>
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 block">কমিউনিটি গ্রুপ</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white mt-1 block">
                    {metrics?.totalGroups} টি
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 block">পাবলিক পেইজ</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white mt-1 block">
                    {metrics?.totalPages} টি
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 block">লাইভ ব্রডকাস্ট সেশন</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white mt-1 block">
                    {metrics?.totalLiveStreams} টি
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 block">মোট ডেমো কয়েন সার্কুলেশন</span>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1 block flex items-center gap-1">
                    <Coins className="w-4 h-4" />
                    {((metrics?.totalCoinsCirculating ?? metrics?.totalCoinsCirculated) || 0).toLocaleString()} কয়েন
                  </span>
                </div>
              </div>

              {/* Quick Action Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#1E293B] dark:to-[#0F172A] border border-blue-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#155EEF] text-white flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      রিপোর্ট পর্যালোচনা কিউতে {metrics?.pendingReports} টি নতুন রিপোর্ট অপেক্ষমাণ
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      রিপোর্টারের পরিচয় সুরক্ষিত রেখে কনটেন্ট যাচাই ও দ্রুত ব্যবস্থা নিন।
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="px-4 py-2 bg-[#155EEF] hover:bg-[#1048C6] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
                >
                  <span>কিউ ওপেন করুন</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: MODERATION REPORTS QUEUE */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">স্ট্যাটাস:</span>
              {(['pending', 'reviewed', 'resolved', 'dismissed', 'all'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setReportStatusFilter(st);
                    setTimeout(loadReportsQueue, 0);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    reportStatusFilter === st
                      ? 'bg-[#155EEF] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {st === 'pending' && 'অপেক্ষমাণ (Pending)'}
                  {st === 'reviewed' && 'পর্যালোচিত (Reviewed)'}
                  {st === 'resolved' && 'নিষ্পন্ন (Resolved)'}
                  {st === 'dismissed' && 'খারিজ (Dismissed)'}
                  {st === 'all' && 'সবগুলো'}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500 font-medium">
              মোট {reports.length} টি রিপোর্ট
            </div>
          </div>

          {/* Reports Table / List */}
          {isReportsLoading ? (
            <div className="p-12 text-center bg-white dark:bg-[#151D2C] rounded-2xl border border-slate-200 dark:border-slate-800">
              <Loader2 className="w-6 h-6 animate-spin text-[#155EEF] mx-auto mb-2" />
              <p className="text-xs text-slate-500">রিপোর্ট লোড হচ্ছে...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#151D2C] rounded-2xl border border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                কোনো অপেক্ষমাণ রিপোর্ট নেই
              </h3>
              <p className="text-xs text-slate-500 mt-1">সব রিপোর্ট সফলভাবে পর্যালোচনা করা হয়েছে।</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                        {rep.target_type}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        কারণ: {rep.reason_category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{new Date(rep.created_at).toLocaleString('bn-BD')}</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          rep.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                            : rep.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {rep.status}
                      </span>
                    </div>
                  </div>

                  {/* Target Preview */}
                  {rep.target_preview && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
                      {rep.target_preview.title && (
                        <p className="font-semibold text-slate-900 dark:text-white mb-0.5">
                          {rep.target_preview.title}
                        </p>
                      )}
                      {rep.target_preview.content && (
                        <p className="text-slate-600 dark:text-slate-300 line-clamp-2">
                          "{rep.target_preview.content}"
                        </p>
                      )}
                      {rep.target_preview.author_name && (
                        <p className="text-slate-400 text-[11px] mt-1">
                          পোস্টদাতা: {rep.target_preview.author_name} (@{rep.target_preview.author_username})
                        </p>
                      )}
                    </div>
                  )}

                  {rep.details && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                      রিপোর্টারের মন্তব্য: "{rep.details}"
                    </p>
                  )}

                  {/* Privacy Notice */}
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                    <span>রিপোর্টারের পরিচয় সম্পূর্ণ গোপন (Reporter Anonymous)</span>
                  </div>

                  {/* Action Buttons */}
                  {rep.status === 'pending' && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setSelectedReport(rep)}
                        className="px-3 py-1.5 rounded-xl bg-[#155EEF] hover:bg-[#1048C6] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        সিদ্ধান্ত গ্রহণ করুন
                      </button>

                      <button
                        onClick={() => {
                          setSelectedReport(rep);
                          handleModerateReport('dismiss');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                      >
                        খারিজ করুন (Dismiss)
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Decision Modal */}
          {selectedReport && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                    মডারেশন সিদ্ধান্ত গ্রহণ
                  </h3>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="text-slate-500">
                    টার্গেট টাইপ: <strong className="text-slate-800 dark:text-slate-200 uppercase">{selectedReport.target_type}</strong>
                  </p>
                  <p className="text-slate-500">
                    অভিযোগের কারণ: <strong className="text-red-600">{selectedReport.reason_category}</strong>
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    অ্যাকশন নোট / কারণ (অডিট ট্রেইলে সংরক্ষিত হবে)
                  </label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="গৃহীত ব্যবস্থার ব্যাখ্যা লিখুন..."
                    rows={2}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  <button
                    disabled={isTakingAction}
                    onClick={() => handleModerateReport('delete_content')}
                    className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    কনটেন্ট মুছুন
                  </button>

                  <button
                    disabled={isTakingAction}
                    onClick={() => handleModerateReport('suspend_user')}
                    className="px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    স্থগিত (Suspend)
                  </button>

                  <button
                    disabled={isTakingAction}
                    onClick={() => handleModerateReport('ban_user')}
                    className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    স্থায়ী ব্যান (Ban)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-xs">
            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                placeholder="নাম বা ইউজারনেম দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-800/80 border-transparent rounded-xl focus:outline-hidden focus:border-[#155EEF]"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              {(['all', 'active', 'suspended', 'banned'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setUserStatusFilter(st);
                    setTimeout(loadUsers, 0);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    userStatusFilter === st
                      ? 'bg-[#155EEF] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {st === 'all' && 'সকল ব্যবহারকারী'}
                  {st === 'active' && 'সক্রিয় (Active)'}
                  {st === 'suspended' && 'স্থগিত (Suspended)'}
                  {st === 'banned' && 'ব্যান (Banned)'}
                </button>
              ))}
            </div>
          </div>

          {/* User Table */}
          {isUsersLoading ? (
            <div className="p-12 text-center bg-white dark:bg-[#151D2C] rounded-2xl border border-slate-200 dark:border-slate-800">
              <Loader2 className="w-6 h-6 animate-spin text-[#155EEF] mx-auto mb-2" />
              <p className="text-xs text-slate-500">ইউজার তালিকা লোড হচ্ছে...</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">ব্যবহারকারী</th>
                      <th className="p-3.5">ইউজারনেম</th>
                      <th className="p-3.5">স্ট্যাটাস</th>
                      <th className="p-3.5">রোল</th>
                      <th className="p-3.5 text-right">পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {usersList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
                          {usr.avatar_url ? (
                            <img
                              src={usr.avatar_url}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                              {usr.display_name?.slice(0, 1) || 'U'}
                            </div>
                          )}
                          <span>{usr.display_name}</span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">@{usr.username}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              usr.account_status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : usr.account_status === 'suspended'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400'
                            }`}
                          >
                            {usr.account_status}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {isAdmin ? (
                            <select
                              value={usr.role || 'user'}
                              onChange={(e) =>
                                handleUpdateUserRole(usr.id, e.target.value as AppRole)
                              }
                              className="text-[11px] p-1 rounded-md bg-slate-100 dark:bg-slate-800 border-none font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                            >
                              <option value="user">User</option>
                              <option value="moderator">Moderator</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                              {usr.role || 'user'}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedUserForAction(usr);
                              setTargetStatus(
                                usr.account_status === 'active' ? 'suspended' : 'active'
                              );
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors"
                          >
                            স্ট্যাটাস পরিবর্তন
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* User Status Modal */}
          {selectedUserForAction && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    স্ট্যাটাস পরিবর্তন: {selectedUserForAction.display_name}
                  </h3>
                  <button
                    onClick={() => setSelectedUserForAction(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      নতুন স্ট্যাটাস
                    </label>
                    <select
                      value={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.value as any)}
                      className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      <option value="active">Active (সক্রিয়)</option>
                      <option value="suspended">Suspended (সাময়িক স্থগিত)</option>
                      <option value="banned">Banned (স্থায়ী ব্যান)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      পরিবর্তনের কারণ (বাধ্যতামূলক অডিট রেকর্ড)
                    </label>
                    <textarea
                      value={statusChangeReason}
                      onChange={(e) => setStatusChangeReason(e.target.value)}
                      placeholder="কারণ উল্লেখ করুন..."
                      rows={2}
                      className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setSelectedUserForAction(null)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                  >
                    বাতিল
                  </button>
                  <button
                    disabled={isTakingAction}
                    onClick={handleUpdateUserStatus}
                    className="px-4 py-2 rounded-xl bg-[#155EEF] hover:bg-[#1048C6] text-white text-xs font-semibold transition-colors"
                  >
                    নিশ্চিত করুন
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                অপরিবর্তনযোগ্য অডিট ট্রেইল (Immutable Audit Trail)
              </span>
            </div>
            <div className="text-xs text-slate-500">
              সর্বশেষ {auditLogs.length} টি কার্যক্রম প্রদর্শিত হচ্ছে
            </div>
          </div>

          {isAuditLoading ? (
            <div className="p-12 text-center bg-white dark:bg-[#151D2C] rounded-2xl border border-slate-200 dark:border-slate-800">
              <Loader2 className="w-6 h-6 animate-spin text-[#155EEF] mx-auto mb-2" />
              <p className="text-xs text-slate-500">অডিট লগ লোড হচ্ছে...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#151D2C] rounded-2xl border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500">এখনো কোনো অডিট রেকর্ড নেই।</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs font-mono"
                >
                  <div className="space-y-1 font-sans">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-[#155EEF] dark:text-blue-400">
                        {log.action_type}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        টার্গেট: {log.target_type} {log.target_id ? `(${log.target_id.slice(0, 8)}...)` : ''}
                      </span>
                    </div>
                    {log.reason && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">
                        কারণ: {log.reason}
                      </p>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 shrink-0 sm:text-right font-mono">
                    <div>মডারেটর: {log.actor_id.slice(0, 8)}...</div>
                    <div>{new Date(log.created_at).toLocaleString('bn-BD')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SYSTEM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#155EEF]" />
              প্ল্যাটফর্ম সিস্টেম কনফিগারেশন
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              যেকোনো পরিবর্তন সাথে সাথে কার্যকর হবে এবং অডিট ট্রেইলে সংরক্ষিত থাকবে।
            </p>
          </div>

          {isSettingsLoading ? (
            <div className="p-12 text-center bg-white dark:bg-[#151D2C] rounded-2xl border border-slate-200 dark:border-slate-800">
              <Loader2 className="w-6 h-6 animate-spin text-[#155EEF] mx-auto mb-2" />
              <p className="text-xs text-slate-500">সেটিংস লোড হচ্ছে...</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {systemSettings.map((set) => (
                <div
                  key={set.setting_key}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-xs"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {set.description || set.setting_key}
                    </h4>
                    <span className="text-xs text-slate-500 font-mono block mt-0.5">
                      কী: {set.setting_key}
                    </span>
                  </div>

                  <div>
                    {typeof set.setting_value === 'boolean' ? (
                      <button
                        onClick={() => handleToggleSetting(set)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                          set.setting_value
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {set.setting_value ? 'সক্রিয় (Enabled)' : 'বন্ধ (Disabled)'}
                      </button>
                    ) : (
                      <span className="text-xs font-mono font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {String(set.setting_value)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
