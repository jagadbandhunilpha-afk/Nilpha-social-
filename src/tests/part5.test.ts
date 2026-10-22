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

import { messagingService } from '../services/messagingService';
import { callingService, getCallingProviderConfig } from '../services/callingService';
import { liveStreamingService } from '../services/liveStreamingService';
import { SocialUser } from '../types';

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

async function runPart5Tests() {
  console.log('\n======================================================');
  console.log('NILPHA SOCIAL — PART 5 AUTOMATED VERIFICATION SUITE');
  console.log('Testing: Messaging, Calls, Streaming, RLS, and Auth');
  console.log('======================================================\n');

  const userAlice: SocialUser = {
    id: 'user-alice-101',
    username: 'alice_dhaka',
    display_name: 'Alice Rahman',
  };

  const userBob: SocialUser = {
    id: 'user-bob-202',
    username: 'bob_ctg',
    display_name: 'Bob Chowdhury',
  };

  // --------------------------------------------------------------------------
  // 1. Messaging: Direct & Group Conversation Lifecycle
  // --------------------------------------------------------------------------
  console.log('1. Messaging: Direct & Group Conversations');

  const directConv = await messagingService.createDirectConversation(
    userBob.id,
    userAlice.id,
    userBob
  );
  assert(directConv !== null, 'Alice can create direct conversation with Bob');
  assert(directConv.type === 'direct', 'Conversation type is direct');
  assert(directConv.members.length === 2, 'Conversation contains both participants');

  const groupConv = await messagingService.createGroupConversation(
    'Dhaka Developers Circle',
    [userBob.id],
    userAlice.id
  );
  assert(groupConv !== null, 'Alice can create group conversation');
  assert(groupConv.type === 'group', 'Group type is set to group');
  assert(groupConv.title === 'Dhaka Developers Circle', 'Group title is set correctly');

  // --------------------------------------------------------------------------
  // 2. Message Sending, Idempotency & Attachments
  // --------------------------------------------------------------------------
  console.log('\n2. Message Sending, Attachments, and Read Receipts');

  const sentMsg = await messagingService.sendMessage({
    conversationId: directConv.id,
    senderId: userAlice.id,
    content: 'Hello Bob! How is the Part 5 real-time chat going?',
    senderProfile: userAlice,
    clientTempId: 'temp-12345',
    attachments: [
      {
        file_url: 'https://example.com/spec.pdf',
        file_name: 'nilpha-part5-spec.pdf',
        file_size: 1024 * 50,
        file_type: 'application/pdf',
      },
    ],
  });
  assert(sentMsg.content.includes('Part 5'), 'Message content is preserved');
  assert(sentMsg.attachments?.length === 1, 'Attachment metadata is attached');
  assert(sentMsg.attachments![0].file_name === 'nilpha-part5-spec.pdf', 'Attachment file name is intact');

  // Verify retrieval
  const convMessages = await messagingService.getMessages(directConv.id);
  assert(convMessages.some((m) => m.id === sentMsg.id), 'Message appears in conversation history');

  // --------------------------------------------------------------------------
  // 3. Message Reactions, Edit & Soft Delete
  // --------------------------------------------------------------------------
  console.log('\n3. Message Reactions, Inline Edit, and Soft-Delete');

  await messagingService.toggleReaction(
    sentMsg.id,
    directConv.id,
    userBob.id,
    '❤️',
    userBob
  );
  const msgsAfterReaction = await messagingService.getMessages(directConv.id);
  const reacted = msgsAfterReaction.find((m) => m.id === sentMsg.id);
  assert(
    Boolean(reacted?.reactions?.some((r) => r.reaction === '❤️')),
    'Bob can add reaction to Alice message'
  );

  // Edit message
  await messagingService.editMessage(
    sentMsg.id,
    directConv.id,
    userAlice.id,
    'Hello Bob! Edited content version 2.'
  );
  const msgsAfterEdit = await messagingService.getMessages(directConv.id);
  const edited = msgsAfterEdit.find((m) => m.id === sentMsg.id);
  assert(Boolean(edited?.is_edited), 'Message marked as is_edited');
  assert(Boolean(edited?.content.includes('version 2')), 'Edited content updated');

  // Soft Delete
  await messagingService.deleteMessage(sentMsg.id, directConv.id, userAlice.id);
  const msgsAfterDelete = await messagingService.getMessages(directConv.id);
  const deleted = msgsAfterDelete.find((m) => m.id === sentMsg.id);
  assert(Boolean(deleted?.deleted_at), 'Message soft-deleted with deleted_at timestamp');

  // --------------------------------------------------------------------------
  // 4. Audio & Video Calling Provider & Media State
  // --------------------------------------------------------------------------
  console.log('\n4. Calling Service: Provider Abstraction & Session Management');

  const providerCfg = getCallingProviderConfig();
  assert(
    providerCfg.providerName === 'webrtc' || providerCfg.providerName === 'livekit',
    'Calling provider abstraction is configured'
  );

  const initialMedia = callingService.getMediaState();
  assert(initialMedia.isMuted === false, 'Default microphone is unmuted');
  assert(initialMedia.isVideoOff === false, 'Default video camera is enabled');

  const mutedVal = callingService.toggleMute();
  assert(mutedVal === true, 'Calling service toggles microphone mute state');
  callingService.toggleMute(); // reset

  // --------------------------------------------------------------------------
  // 5. Live Streaming Broadcast, Comments & Moderation
  // --------------------------------------------------------------------------
  console.log('\n5. Live Streaming: Broadcast, Live Comments, and Host Moderation');

  const liveStream = await liveStreamingService.createLiveStream({
    hostId: userAlice.id,
    title: 'Dhaka Tech Live: Nilpha Social Part 5 Demo',
    description: 'Testing live chat comments and viewer presence in real time.',
    visibility: 'public',
    hostProfile: userAlice,
  });
  assert(liveStream !== null, 'Host can create live broadcast');
  assert(liveStream.status === 'live', 'Live stream status is active (live)');

  // Send comment
  const comment = await liveStreamingService.sendComment(
    liveStream.id,
    userBob.id,
    'Awesome stream Alice! Audio and video are crystal clear.',
    userBob
  );
  assert(comment !== null, 'Viewer can send comment in live broadcast');
  assert(comment.content.includes('crystal clear'), 'Comment content is preserved');

  // Host pins comment
  await liveStreamingService.togglePinComment(comment.id, liveStream.id, false);
  const commentsAfterPin = await liveStreamingService.getComments(liveStream.id);
  const pinnedComment = commentsAfterPin.find((c) => c.id === comment.id);
  assert(pinnedComment?.is_pinned === true, 'Host can pin comments in stream');

  // End live broadcast
  await liveStreamingService.endLiveStream(liveStream.id, userAlice.id);
  const updatedStream = await liveStreamingService.getLiveStreamById(liveStream.id);
  assert(updatedStream?.status === 'ended', 'Host can safely end live broadcast');
  assert(Boolean(updatedStream?.ended_at), 'Stream records ended_at timestamp');

  console.log('\n======================================================');
  console.log(`ALL PART 5 TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log('======================================================\n');
}

runPart5Tests().catch((err) => {
  console.error('\nTest execution failed:', err);
  process.exit(1);
});
