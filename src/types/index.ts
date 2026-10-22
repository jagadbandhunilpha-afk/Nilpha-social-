export type Language = 'bn' | 'en';
export type Theme = 'light' | 'dark';

export interface NavItem {
  id: string;
  labelKey: string;
  path: string;
  iconName: string;
  badge?: number;
}

export interface PostMediaItem {
  id: string;
  post_id: string;
  storage_path: string;
  media_type: 'image' | 'video';
  mime_type: string;
  file_size: number;
  display_order: number;
  url?: string;
}

export interface Post {
  id: string;
  author_id?: string;
  author: {
    id?: string;
    name: string;
    handle: string;
    avatarColor?: string;
    avatarUrl?: string | null;
    initials: string;
    role?: string;
  };
  content: string;
  visibility?: 'public' | 'private';
  created_at?: string;
  updated_at?: string;
  timestamp: string;
  category?: string;
  likes: number;
  comments: number;
  shares: number;
  likedByMe: boolean;
  bookmarkedByMe?: boolean;
  media?: PostMediaItem[];
  mediaPlaceholder?: {
    type: 'image' | 'infographic';
    caption: string;
    color: string;
  };
  isDemo?: boolean;
}

export interface CommentItem {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id?: string | null;
  content: string;
  created_at: string;
  author: {
    id: string;
    name: string;
    handle: string;
    avatarUrl?: string | null;
    initials: string;
  };
  replies?: CommentItem[];
}

export type ReportReason = 'spam' | 'harassment' | 'impersonation' | 'inappropriate' | 'other';

export interface VideoItem {
  id: string;
  title: string;
  creator: string;
  duration: string;
  category: 'foryou' | 'trending' | 'following';
  viewsDemo: string;
  timeAgo: string;
  color: string;
  icon: string;
}

export interface CommunityItem {
  id: string;
  name: string;
  description: string;
  category: string;
  membersDemoCount: string;
  type: 'group' | 'page';
  joined: boolean;
  avatarColor: string;
  badgeLabel: string;
}

export interface GameItem {
  id: string;
  title: string;
  description: string;
  category: string;
  color: string;
  isSpecialNotice?: boolean;
  noticeText?: string;
  interactiveType?: 'tictactoe' | 'memory' | 'info';
}

export interface NotificationItem {
  id: string;
  sender: string;
  actionKey: string;
  timestamp: string;
  read: boolean;
  type: 'like' | 'comment' | 'community' | 'game' | 'system';
}

export interface ConversationItem {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  avatarColor: string;
  initials: string;
}

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio?: string | null;
  avatar_url?: string | null;
  preferred_language: 'bn' | 'en';
  account_status: 'active' | 'suspended' | 'pending';
  verification_status: 'none' | 'pending' | 'verified';
  created_at: string;
  updated_at: string;
}

// Part 4: Social Relationships & Graph
export interface RelationshipCounts {
  followersCount: number;
  followingCount: number;
  friendsCount: number;
}

export type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

export interface UserRelationshipState {
  isFollowing: boolean;
  isFollower: boolean;
  friendStatus: FriendStatus;
  requestId?: string;
  isBlocked: boolean;
}

export interface SocialUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  verification_status?: string;
  isFollowing?: boolean;
  friendStatus?: FriendStatus;
}

export interface FriendRequestItem {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'rejected';
  created_at: string;
  sender?: SocialUser;
  receiver?: SocialUser;
}

// Part 4: Groups
export type GroupPrivacy = 'public' | 'private';
export type GroupRole = 'admin' | 'moderator' | 'member';
export type GroupMembershipStatus = 'active' | 'pending';

export interface SocialGroup {
  id: string;
  name: string;
  slug: string;
  description?: string;
  privacy: GroupPrivacy;
  avatar_url?: string | null;
  cover_url?: string | null;
  created_by: string;
  member_count: number;
  created_at: string;
  updated_at?: string;
  currentUserMembership?: {
    role: GroupRole;
    status: GroupMembershipStatus;
  } | null;
}

export interface GroupMemberItem {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  status: GroupMembershipStatus;
  created_at: string;
  profile?: SocialUser;
}

export interface CreateGroupInput {
  name: string;
  slug: string;
  description?: string;
  privacy: GroupPrivacy;
  avatar_url?: string;
  cover_url?: string;
}

// Part 4: Pages
export type PageRole = 'admin' | 'editor' | 'moderator';

export interface SocialPage {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string;
  website?: string;
  avatar_url?: string | null;
  cover_url?: string | null;
  created_by: string;
  follower_count: number;
  created_at: string;
  updated_at?: string;
  currentUserRole?: PageRole | null;
  isFollowing?: boolean;
}

export interface PageMemberItem {
  id: string;
  page_id: string;
  user_id: string;
  role: PageRole;
  created_at: string;
  profile?: SocialUser;
}

export interface CreatePageInput {
  name: string;
  slug: string;
  category: string;
  description?: string;
  website?: string;
  avatar_url?: string;
  cover_url?: string;
}

// ============================================================================
// Part 5: Real-Time Messaging Types
// ============================================================================
export type ConversationType = 'direct' | 'group';
export type ConversationRole = 'admin' | 'member';

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: ConversationRole;
  muted: boolean;
  notifications_enabled: boolean;
  last_read_at: string;
  joined_at: string;
  profile?: SocialUser;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title?: string | null;
  avatar_url?: string | null;
  created_by?: string | null;
  last_message_at: string;
  created_at: string;
  updated_at?: string;
  members: ConversationMember[];
  lastMessage?: ChatMessage | null;
  unreadCount?: number;
  isOnline?: boolean;
}

export type MessageType = 'text' | 'image' | 'file' | 'system' | 'call_event';
export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  created_at?: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  created_at?: string;
  user?: SocialUser;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  reply_to_id?: string | null;
  reply_to_message?: ChatMessage | null;
  is_edited: boolean;
  deleted_at?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
  sender?: SocialUser;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  deliveryStatus?: MessageDeliveryStatus;
  clientTempId?: string;
}

// ============================================================================
// Part 5: Audio & Video Calling Types
// ============================================================================
export type CallType = 'audio' | 'video';
export type CallStatus =
  | 'initiating'
  | 'ringing'
  | 'active'
  | 'ended'
  | 'declined'
  | 'missed'
  | 'failed';

export type ParticipantCallStatus =
  | 'invited'
  | 'ringing'
  | 'connected'
  | 'left'
  | 'declined'
  | 'missed';

export interface CallParticipant {
  id: string;
  call_session_id: string;
  user_id: string;
  role: 'host' | 'participant';
  status: ParticipantCallStatus;
  joined_at?: string | null;
  left_at?: string | null;
  profile?: SocialUser;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

export interface CallSession {
  id: string;
  conversation_id?: string | null;
  initiator_id: string;
  call_type: CallType;
  status: CallStatus;
  room_id: string;
  provider: 'webrtc' | 'livekit' | 'daily' | 'agora';
  started_at?: string | null;
  ended_at?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
  initiator?: SocialUser;
  participants: CallParticipant[];
}

export interface CallMediaState {
  isMuted: boolean;
  isVideoOff: boolean;
  facingMode: 'user' | 'environment';
  localStream: MediaStream | null;
  durationSeconds: number;
  networkQuality: 'good' | 'poor' | 'reconnecting';
  hasHardwarePermissions: boolean;
  permissionError?: string | null;
}

// ============================================================================
// Part 5: Live Streaming Types
// ============================================================================
export type LiveStreamVisibility = 'public' | 'followers_only' | 'private';
export type LiveStreamStatus = 'preview' | 'live' | 'ended';

export interface LiveStream {
  id: string;
  host_id: string;
  title: string;
  description?: string | null;
  visibility: LiveStreamVisibility;
  status: LiveStreamStatus;
  viewer_count: number;
  started_at?: string | null;
  ended_at?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
  host?: SocialUser;
}

export interface LiveStreamComment {
  id: string;
  stream_id: string;
  user_id: string;
  content: string;
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: string;
  user?: SocialUser;
}

export interface StreamModerationAction {
  id: string;
  stream_id: string;
  moderator_id: string;
  target_user_id: string;
  action_type: 'block_viewer' | 'remove_comment' | 'report';
  reason?: string | null;
  created_at: string;
}

// ============================================================================
// Part 6: Demo Coin Wallet & Ledger Types
// ============================================================================
export interface DemoCoinWallet {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  is_initial_granted: boolean;
  created_at: string;
  updated_at?: string;
}

export type CoinTransactionType =
  | 'initial_grant'
  | 'game_reward'
  | 'game_entry'
  | 'daily_checkin'
  | 'challenge_reward'
  | 'referral_reward'
  | 'referral_bonus'
  | 'achievement_reward'
  | 'game_play_debit'
  | 'item_unlock_debit'
  | 'admin_adjustment';

export interface CoinTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  transaction_type: CoinTransactionType;
  reason: string;
  reference_id?: string | null;
  idempotency_key: string;
  created_at: string;
}

// ============================================================================
// Part 6: Game Session & Leaderboard Types
// ============================================================================
export type MiniGameId =
  | 'car-racing'
  | 'bubble-puzzle'
  | 'funny-runner'
  | 'memory-match'
  | 'tic-tac-toe'
  | 'seven-up';

export interface GameSessionRecord {
  id: string;
  user_id: string;
  game_id: MiniGameId;
  score: number;
  duration_seconds: number;
  coins_rewarded: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  details?: Record<string, any>;
  created_at: string;
}

export interface GameLeaderboardEntry {
  user_id: string;
  username: string;
  display_name: string;
  user_name?: string;
  avatar_url?: string | null;
  game_id: MiniGameId;
  high_score: number;
  total_sessions: number;
  games_played?: number;
  rank?: number;
}

// ============================================================================
// Part 6: Daily Rewards & Challenges Types
// ============================================================================
export interface DailyCheckinStatus {
  hasClaimedToday: boolean;
  todayClaimed?: boolean;
  currentStreak: number;
  streakCount?: number;
  nextRewardCoins: number;
  currentDayNumber?: number;
  lastClaimDate?: string | null;
  streakDays: {
    day: number;
    coins: number;
    isClaimed: boolean;
    isToday: boolean;
  }[];
}

export interface UserChallengeItem {
  id: string;
  user_id: string;
  challenge_key: string;
  title_bn: string;
  title_en: string;
  title?: string;
  description?: string;
  target_count: number;
  target?: number;
  current_count: number;
  progress?: number;
  reward_coins: number;
  is_completed: boolean;
  is_claimed: boolean;
  claimed?: boolean;
  period: 'daily' | 'weekly';
  type?: string;
  expires_at: string;
  created_at: string;
}

// ============================================================================
// Part 6: Referral System Types
// ============================================================================
export interface ReferralSummary {
  referralCode: string;
  code?: string;
  referralUrl: string;
  totalReferrals: number;
  totalReferred?: number;
  totalCoinsEarned: number;
  totalBonusCoins?: number;
  referralHistory: {
    id: string;
    referee_name: string;
    referee_username: string;
    status: 'verified' | 'pending';
    reward_coins: number;
    created_at: string;
  }[];
  referrals?: {
    id: string;
    referee_name?: string;
    reward_coins: number;
    created_at: string;
  }[];
}

// ============================================================================
// Part 6: Achievements System Types
// ============================================================================
export interface AchievementItem {
  key: string;
  id?: string;
  title_bn: string;
  title_en: string;
  title?: string;
  description_bn: string;
  description_en: string;
  description?: string;
  icon: string;
  reward_coins: number;
  isUnlocked: boolean;
  unlocked?: boolean;
  progress?: number;
  max_progress?: number;
  unlockedAt?: string | null;
}

// ============================================================================
// Part 6: Seven Up Demo Arena Types
// ============================================================================
export type SevenUpChoice = 'low' | 'seven' | 'high' | 'under7' | 'over7' | '7';

export interface SevenUpRoundResult {
  dice1: number;
  dice2: number;
  sum: number;
  diceSum?: number;
  choice: SevenUpChoice;
  isWin: boolean;
  wonCoins: number;
  newBalance: number;
  fairHash?: string;
  payoutMultiplier?: number;
  coinsBet?: number;
  coinsWon?: number;
  netCoins?: number;
  randomProof?: string;
}


