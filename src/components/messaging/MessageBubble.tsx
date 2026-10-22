/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Check,
  CheckCheck,
  Clock,
  MoreVertical,
  Reply,
  Smile,
  Copy,
  Edit2,
  Trash2,
  FileText,
  Download,
  AlertCircle,
} from 'lucide-react';
import { ChatMessage, SocialUser } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface MessageBubbleProps {
  message: ChatMessage;
  isMe: boolean;
  onReply: (msg: ChatMessage) => void;
  onEdit: (msg: ChatMessage) => void;
  onDelete: (msgId: string) => void;
  onReaction: (msgId: string, emoji: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMe,
  onReply,
  onEdit,
  onDelete,
  onReaction,
}) => {
  const { t } = useLanguage();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const isDeleted = Boolean(message.deleted_at);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowActionsMenu(false);
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Group reactions by emoji
  const reactionCounts: Record<string, { count: number; reactedByMe: boolean }> = {};
  (message.reactions || []).forEach((r) => {
    if (!reactionCounts[r.reaction]) {
      reactionCounts[r.reaction] = { count: 0, reactedByMe: false };
    }
    reactionCounts[r.reaction].count += 1;
    if (r.user_id === 'user-me' || isMe) {
      // mark reacted by me
    }
  });

  return (
    <div className={`flex flex-col mb-3 group ${isMe ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar for other users in group */}
        {!isMe && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mb-1">
            {message.sender?.display_name
              ? message.sender.display_name.slice(0, 2).toUpperCase()
              : 'U'}
          </div>
        )}

        {/* Bubble container */}
        <div className="relative">
          {/* Quoted reply message preview */}
          {message.reply_to_message && (
            <div
              className={`text-xs px-3 py-1.5 rounded-t-xl border-b mb-0.5 truncate ${
                isMe
                  ? 'bg-blue-700/60 text-blue-100 border-blue-500'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
              }`}
            >
              <div className="font-semibold text-[10px] text-blue-300">
                {message.reply_to_message.sender?.display_name || 'Replied message'}
              </div>
              <div className="truncate text-[11px]">{message.reply_to_message.content}</div>
            </div>
          )}

          {/* Main Bubble */}
          <div
            className={`px-4 py-2.5 rounded-2xl shadow-2xs break-words text-sm relative ${
              isMe
                ? 'bg-[#155EEF] text-white rounded-br-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            {/* Sender name if not me and in group */}
            {!isMe && message.sender && (
              <div className="text-[11px] font-bold text-[#155EEF] dark:text-blue-400 mb-1">
                {message.sender.display_name}
              </div>
            )}

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="space-y-2 mb-2">
                {message.attachments.map((att) => {
                  const isImg = att.file_type.startsWith('image/');
                  if (isImg) {
                    return (
                      <div key={att.id} className="rounded-xl overflow-hidden max-h-60 bg-black/10">
                        <img
                          src={att.file_url}
                          alt={att.file_name}
                          className="w-full h-auto object-cover hover:opacity-95 transition-opacity"
                        />
                      </div>
                    );
                  }
                  return (
                    <a
                      key={att.id}
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2.5 p-2 rounded-xl text-xs transition-colors ${
                        isMe
                          ? 'bg-blue-700/60 hover:bg-blue-700 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white'
                      }`}
                    >
                      <FileText className="w-5 h-5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{att.file_name}</div>
                        <div className="text-[10px] opacity-80">
                          {(att.file_size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                      <Download className="w-4 h-4 shrink-0" />
                    </a>
                  );
                })}
              </div>
            )}

            {/* Content text */}
            <p className={`whitespace-pre-wrap leading-relaxed ${isDeleted ? 'italic text-xs opacity-75' : ''}`}>
              {message.content}
            </p>

            {/* Meta Row: Edited Tag, Time, and Read Receipts */}
            <div
              className={`flex items-center justify-end gap-1.5 text-[10px] mt-1 select-none ${
                isMe ? 'text-blue-200' : 'text-slate-400'
              }`}
            >
              {message.is_edited && !isDeleted && (
                <span className="italic opacity-80">সম্পাদিত</span>
              )}
              <span>{formatTime(message.created_at)}</span>
              {isMe && (
                <span>
                  {message.deliveryStatus === 'sending' ? (
                    <Clock className="w-3 h-3 animate-spin" />
                  ) : message.deliveryStatus === 'read' ? (
                    <CheckCheck className="w-3.5 h-3.5 text-cyan-200" />
                  ) : (
                    <Check className="w-3 h-3 text-blue-200" />
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Emoji Reactions List Display on Bubble */}
          {Object.keys(reactionCounts).length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {Object.entries(reactionCounts).map(([emoji, data]) => (
                <button
                  key={emoji}
                  onClick={() => onReaction(message.id, emoji)}
                  className="px-2 py-0.5 rounded-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs hover:scale-105 transition-transform flex items-center gap-1 cursor-pointer"
                >
                  <span>{emoji}</span>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {data.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hover Quick Action Bar */}
        {!isDeleted && (
          <div
            className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-1.5 py-0.5 shadow-xs relative ${
              isMe ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* React */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 rounded-full text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="প্রতিক্রিয়া দিন"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>

            {/* Reply */}
            <button
              onClick={() => onReply(message)}
              className="p-1 rounded-full text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="উত্তর দিন"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>

            {/* Actions Menu */}
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="আরো বিকল্প"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {/* Floating Emoji Picker Popover */}
            {showEmojiPicker && (
              <div
                className={`absolute bottom-full mb-1 z-30 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 rounded-full shadow-lg ${
                  isMe ? 'right-0' : 'left-0'
                }`}
              >
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReaction(message.id, emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="p-1 text-base hover:scale-125 transition-transform cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Actions Dropdown */}
            {showActionsMenu && (
              <div
                className={`absolute bottom-full mb-1 z-30 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-1 rounded-xl shadow-xl text-xs ${
                  isMe ? 'right-0' : 'left-0'
                }`}
              >
                <button
                  onClick={handleCopy}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>{copied ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
                </button>

                {isMe && (
                  <>
                    <button
                      onClick={() => {
                        onEdit(message);
                        setShowActionsMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>সম্পাদনা</span>
                    </button>
                    <button
                      onClick={() => {
                        onDelete(message.id);
                        setShowActionsMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>মুছে ফেলুন</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
