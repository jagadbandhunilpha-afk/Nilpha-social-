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

