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

