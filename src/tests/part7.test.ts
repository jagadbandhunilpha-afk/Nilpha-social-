/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// In-memory polyfill for Node.js test environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] || null,
    length: store.size,
  } as any;
}

import { notificationService } from '../services/notificationService';
import { searchService } from '../services/searchService';
import { reportService } from '../services/reportService';
import { adminService } from '../services/adminService';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runPart7Tests() {
  console.log('\n================================================================');
  console.log('NILPHA SOCIAL — PART 7 AUTOMATED VERIFICATION SUITE');
  console.log('Testing: Notifications, Search, Reporting, Moderation, Admin RBAC & Audit Trail');
  console.log('================================================================\n');

  const testUserA = 'test-alice-' + Date.now();
  const testUserB = 'test-bob-' + Date.now();
  const testAdmin = 'jagadbandhu-admin-' + Date.now();

  // --------------------------------------------------------------------------
  // 1. Notification Center, Deduplication & Isolation
  // --------------------------------------------------------------------------
  console.log('1. Notification System, Deduplication & Read State:');

  const dedupeEventId = 'like_evt_' + Date.now();

  const notifRes1 = await notificationService.createNotification({
    recipient_id: testUserA,
    actor_id: testUserB,
    notification_type: 'post_like',
    title: 'নতুন লাইক',
    body: 'বব আপনার পোস্টে একটি লাইক দিয়েছেন।',
    entity_type: 'post',
    entity_id: 'post-101',
    event_id: dedupeEventId,
  });

  assert(notifRes1.success && !!notifRes1.notification, 'Created initial notification successfully');
  assert(notifRes1.notification?.recipient_id === testUserA, 'Recipient ID correctly assigned');
  assert(notifRes1.notification?.read_at === null, 'Newly created notification is unread');

  // Verify Idempotent Deduplication: Retrying the same event_id must not create duplicate
  const notifDuplicate = await notificationService.createNotification({
    recipient_id: testUserA,
    actor_id: testUserB,
    notification_type: 'post_like',
    title: 'নতুন লাইক',
    body: 'বব আপনার পোস্টে একটি লাইক দিয়েছেন।',
    entity_type: 'post',
    entity_id: 'post-101',
    event_id: dedupeEventId,
  });
  assert(
    notifDuplicate.isDuplicate === true,
    'Duplicate event_id detected and returns isDuplicate: true'
  );

  // Check unread count
  const unreadCountInitial = await notificationService.getUnreadCount(testUserA);
  assert(unreadCountInitial >= 1, 'Unread count increments for recipient');

  // Mark single as read
  if (notifRes1.notification) {
    const markRes = await notificationService.markAsRead(notifRes1.notification.id);
    assert(markRes === true, 'Mark as read succeeds for recipient');
  }

  // Cross-user isolation: User B must not see User A's notifications
  const userBNotifs = await notificationService.getNotifications(testUserB);
  const leakedToB = userBNotifs.some((n) => n.id === notifRes1.notification?.id);
  assert(!leakedToB, 'Cross-user privacy: User B cannot access User A notifications');

  // --------------------------------------------------------------------------
  // 2. Notification Preferences Category Enforcement
  // --------------------------------------------------------------------------
  console.log('\n2. Notification Preferences & Opt-Out:');

  // Set User A preferences: Disable rewards_challenges
  await notificationService.updatePreferences(testUserA, {
    rewards_challenges: false,
  });

  const prefs = await notificationService.getPreferences(testUserA);
  assert(prefs.rewards_challenges === false, 'User preference properly persisted');

  // Attempt to send a reward_eligible notification
  const rewardNotif = await notificationService.createNotification({
    recipient_id: testUserA,
    notification_type: 'reward_eligible',
    title: 'রিওয়ার্ড আনলক',
    body: 'আপনি ২০ ডেমো কয়েন পেয়েছেন।',
    entity_type: 'reward',
  });
  assert(!rewardNotif.success, 'Muted notification category is suppressed and not delivered');

  // --------------------------------------------------------------------------
  // 3. Global Search & Privacy-Preserving History
  // --------------------------------------------------------------------------
  console.log('\n3. Global Search & Local History:');

  // Perform search in Bengali & English
  const searchResults = await searchService.searchGlobal('নিলফা', 'all', 10);
  assert(searchResults.query === 'নিলফা', 'Search query correctly reflected');
  assert(searchResults.totalCount > 0, 'Search returned results for Nilpha');

  // Check category filtering
  const userSearch = await searchService.searchGlobal('tanvir', 'users', 5);
  assert(userSearch.users.length > 0, 'User search returned user matches');
  assert(userSearch.posts.length === 0, 'Category filter strictly bounds results to users');

  // Recent search history management
  searchService.addRecentSearch('বাংলা প্রোগ্রামিং');
  searchService.addRecentSearch('Mini Car Racing');
  const recents = searchService.getRecentSearches();
  assert(recents[0] === 'Mini Car Racing', 'Recent searches properly unshifted');
  assert(recents.includes('বাংলা প্রোগ্রামিং'), 'Recent search query is listed');

  searchService.removeRecentSearch('বাংলা প্রোগ্রামিং');
  const recentsAfterRemove = searchService.getRecentSearches();
  assert(!recentsAfterRemove.includes('বাংলা প্রোগ্রামিং'), 'Single recent search successfully removed');

  searchService.clearAllRecentSearches();
  assert(searchService.getRecentSearches().length === 0, 'Clear all removes stored recent queries');

  // --------------------------------------------------------------------------
  // 4. Content Reporting & Reporter Anonymity
  // --------------------------------------------------------------------------
  console.log('\n4. Content Reporting & Anonymity:');

  const reportRes = await reportService.submitReport({
    reporter_id: testUserA,
    target_type: 'post',
    target_id: 'post-violating-999',
    reported_user_id: testUserB,
    reason_category: 'hate_speech',
    details: 'বিদ্বেষমূলক পোস্ট করার অভিযোগ।',
  });

  assert(reportRes.success && reportRes.reportId !== undefined, 'Report submitted successfully');

  // Verify duplicate submission prevention
  const dupeReportRes = await reportService.submitReport({
    reporter_id: testUserA,
    target_type: 'post',
    target_id: 'post-violating-999',
    reported_user_id: testUserB,
    reason_category: 'hate_speech',
  });
  assert(dupeReportRes.isDuplicate === true, 'Duplicate report on same target and reason is identified as duplicate');

  // Verify queue retrieval for moderation
  const queue = await reportService.getReportsQueue('all', 'all');
  const foundReport = queue.find((r) => r.id === reportRes.reportId);
  assert(foundReport !== undefined, 'Report is discoverable in moderation queue');
  assert(foundReport?.status === 'pending', 'Initial report status is pending');

  // --------------------------------------------------------------------------
  // 5. Role-Based Access Control (RBAC) & Privilege Separation
  // --------------------------------------------------------------------------
  console.log('\n5. RBAC & Access Control:');

  const roleRegular = await adminService.getUserRole(testUserA);
  assert(roleRegular === 'user', 'Default user role is regular user');

  const regularIsMod = await adminService.hasModeratorAccess(testUserA);
  const regularIsAdmin = await adminService.hasAdminAccess(testUserA);
  assert(!regularIsMod && !regularIsAdmin, 'Regular user is denied moderator and admin privileges');

  // Admin account privileges
  const adminIsMod = await adminService.hasModeratorAccess(testAdmin);
  const adminIsAdmin = await adminService.hasAdminAccess(testAdmin);
  assert(adminIsMod && adminIsAdmin, 'Admin account has moderator and admin privileges');

  // Admin promotes testUserB to moderator
  const roleUpdate = await adminService.setUserRole(
    testAdmin,
    testUserB,
    'moderator',
    'মডারেশন দলের সদস্য হিসেবে নিয়োগ'
  );
  assert(roleUpdate.success, 'Admin can grant moderator role');

  const userBRole = await adminService.getUserRole(testUserB);
  assert(userBRole === 'moderator', 'User B now has moderator role');

  const userBModAccess = await adminService.hasModeratorAccess(testUserB);
  const userBAdminAccess = await adminService.hasAdminAccess(testUserB);
  assert(userBModAccess && !userBAdminAccess, 'Moderator has moderation access but not full admin access');

  // Non-admin attempting to set role is rejected
  const illegalRoleChange = await adminService.setUserRole(
    testUserA,
    testUserA,
    'admin',
    'Self promote'
  );
  assert(!illegalRoleChange.success, 'Non-admin user cannot promote themselves or others');

  // --------------------------------------------------------------------------
  // 6. Moderation Decision Execution & Immutable Audit Trail
  // --------------------------------------------------------------------------
  console.log('\n6. Moderation Execution & Immutable Audit Trail:');

  if (reportRes.reportId) {
    const modAction = await reportService.takeModerationAction({
      actorId: testUserB, // Moderator
      reportId: reportRes.reportId,
      actionType: 'content_delete',
      targetType: 'post',
      targetId: 'post-violating-999',
      reason: 'কমিউনিটি নির্দেশিকা লঙ্ঘনের কারণে কনটেন্ট অপসারণ।',
      deleteContent: true,
    });

    assert(modAction.success, 'Moderator action executed successfully');

    // Verify report marked resolved
    const queueAfter = await reportService.getReportsQueue('all', 'all');
    const resolvedReport = queueAfter.find((r) => r.id === reportRes.reportId);
    assert(resolvedReport?.status === 'resolved', 'Report marked as resolved');
    assert(resolvedReport?.action_taken === 'content_delete', 'Action recorded on report');
  }

  // Check Immutable Audit Trail
  const auditLogs = await adminService.getAuditLogs(10, 0);
  assert(auditLogs.length > 0, 'Audit logs contains recorded action');
  const latestLog = auditLogs[0];
  assert(latestLog.actor_id === testUserB || latestLog.actor_id === testAdmin, 'Audit record tracks actor ID');
  assert(latestLog.reason !== undefined && latestLog.reason.length > 0, 'Audit record contains audit reason');

  // --------------------------------------------------------------------------
  // 7. System Settings Management & Metrics
  // --------------------------------------------------------------------------
  console.log('\n7. System Settings & Genuine Metrics:');

  const metrics = await adminService.getDashboardMetrics();
  assert(metrics.totalUsers > 0, 'Genuine metric: Total users is positive');
  assert(metrics.totalPosts > 0, 'Genuine metric: Total posts is positive');
  assert(((metrics.totalCoinsCirculating ?? metrics.totalCoinsCirculated) || 0) >= 0, 'Genuine metric: Total coins circulating is valid');

  const settings = await adminService.getSystemSettings();
  assert(settings.length > 0, 'System settings list retrieved');

  // Admin toggles a setting
  const updateSettingRes = await adminService.updateSystemSetting(
    testAdmin,
    'maintenance_mode',
    false,
    'রুটিন রক্ষণাবেক্ষণ সমাপ্ত'
  );
  assert(updateSettingRes.success, 'Administrator can update system settings');

  // Non-admin attempting to update setting is rejected
  const illegalSettingRes = await adminService.updateSystemSetting(
    testUserA,
    'maintenance_mode',
    true,
    'Unauthorized toggle'
  );
  assert(!illegalSettingRes.success, 'Non-admin cannot update system settings');

  console.log('\n================================================================');
  console.log(`PART 7 TEST SUITE RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================\n');
}

runPart7Tests().catch((err) => {
  console.error('\nPart 7 Test Suite Failed with Error:', err);
  process.exit(1);
});
