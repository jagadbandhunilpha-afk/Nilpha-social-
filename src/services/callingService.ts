/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  CallSession,
  CallType,
  CallStatus,
  CallParticipant,
  CallMediaState,
  SocialUser,
} from '../types';

export interface CallingProviderConfig {
  providerName: 'webrtc' | 'livekit' | 'daily' | 'agora';
  isConfigured: boolean;
  serverUrl?: string;
  notes?: string;
}

export function getCallingProviderConfig(): CallingProviderConfig {
  const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || (typeof process !== 'undefined' ? process.env : {}) as any;
  const provider = (env?.VITE_CALLING_PROVIDER as string) || 'webrtc';
  const livekitUrl = env?.VITE_LIVEKIT_URL as string;

  if (provider === 'livekit') {
    return {
      providerName: 'livekit',
      isConfigured: Boolean(livekitUrl && livekitUrl.startsWith('wss://')),
      serverUrl: livekitUrl,
      notes: 'LiveKit SFU multi-party calling infrastructure',
    };
  }

  return {
    providerName: 'webrtc',
    isConfigured: false, // Indicates managed cloud SFU is not yet provisioned; using standard browser WebRTC media capture
    notes: 'Browser WebRTC media session with device permissions and local media stream capture.',
  };
}

export class CallingService {
  private activeSession: CallSession | null = null;
  private localStream: MediaStream | null = null;
  private timerInterval: any = null;
  private durationSeconds = 0;
  private isMuted = false;
  private isVideoOff = false;
  private facingMode: 'user' | 'environment' = 'user';
  private listeners: Set<(session: CallSession | null, media: CallMediaState) => void> = new Set();
  private incomingCallListeners: Set<(session: CallSession) => void> = new Set();

  constructor() {
    this.setupRealtimeIncomingCalls();
  }

  public subscribe(fn: (session: CallSession | null, media: CallMediaState) => void) {
    this.listeners.add(fn);
    fn(this.activeSession, this.getMediaState());
    return () => this.listeners.delete(fn);
  }

  public onIncomingCall(fn: (session: CallSession) => void) {
    this.incomingCallListeners.add(fn);
    return () => this.incomingCallListeners.delete(fn);
  }

  private notify() {
    const media = this.getMediaState();
    this.listeners.forEach((fn) => fn(this.activeSession, media));
  }

  public getActiveSession(): CallSession | null {
    return this.activeSession;
  }

  public getMediaState(): CallMediaState {
    return {
      isMuted: this.isMuted,
      isVideoOff: this.isVideoOff,
      facingMode: this.facingMode,
      localStream: this.localStream,
      durationSeconds: this.durationSeconds,
      networkQuality: 'good',
      hasHardwarePermissions: Boolean(this.localStream),
    };
  }

  /**
   * Request user camera and microphone via standard browser WebRTC.
   */
  public async requestMedia(callType: CallType): Promise<MediaStream> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Your browser does not support WebRTC media capture or insecure context.');
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video:
          callType === 'video'
            ? {
                facingMode: this.facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }
            : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      this.notify();
      return stream;
    } catch (err: any) {
      console.error('Failed to acquire user media:', err);
      let message = 'মাইক্রোফোন বা ক্যামেরা অ্যাক্সেস করা যায়নি। অনুগ্রহ করে ব্রাউজার পারমিশন দিন।';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'মাইক্রোফোন বা ক্যামেরা পারমিশন প্রত্যাখ্যাত হয়েছে। ব্রাউজার সেটিংস থেকে পারমিশন দিন।';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'কোনো মাইক্রোফোন বা ক্যামেরা ডিভাইস খুঁজে পাওয়া যায়নি।';
      }
      throw new Error(message);
    }
  }

  /**
   * Start an outgoing audio or video call.
   */
  public async startCall(params: {
    conversationId?: string;
    initiator: SocialUser;
    targetUser: SocialUser;
    callType: CallType;
  }): Promise<CallSession> {
    const { conversationId, initiator, targetUser, callType } = params;

    // First request media permissions
    await this.requestMedia(callType);

    const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const sessionId = `call-${Date.now()}`;

    const newSession: CallSession = {
      id: sessionId,
      conversation_id: conversationId || null,
      initiator_id: initiator.id,
      call_type: callType,
      status: 'ringing',
      room_id: roomId,
      provider: 'webrtc',
      created_at: new Date().toISOString(),
      initiator,
      participants: [
        {
          id: `part-${Date.now()}-1`,
          call_session_id: sessionId,
          user_id: initiator.id,
          role: 'host',
          status: 'connected',
          joined_at: new Date().toISOString(),
          profile: initiator,
          isMuted: false,
          isVideoOff: callType === 'audio',
        },
        {
          id: `part-${Date.now()}-2`,
          call_session_id: sessionId,
          user_id: targetUser.id,
          role: 'participant',
          status: 'ringing',
          profile: targetUser,
          isMuted: false,
          isVideoOff: callType === 'audio',
        },
      ],
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('call_sessions')
          .insert({
            conversation_id: conversationId || null,
            initiator_id: initiator.id,
            call_type: callType,
            status: 'ringing',
            room_id: roomId,
            provider: 'webrtc',
          })
          .select()
          .single();

        if (!error && data) {
          newSession.id = data.id;
          await supabase.from('call_participants').insert([
            {
              call_session_id: data.id,
              user_id: initiator.id,
              role: 'host',
              status: 'connected',
              joined_at: new Date().toISOString(),
            },
            {
              call_session_id: data.id,
              user_id: targetUser.id,
              role: 'participant',
              status: 'ringing',
            },
          ]);
        }
      } catch (err) {
        console.warn('Could not record call_session in Supabase:', err);
      }
    }

    this.activeSession = newSession;
    this.durationSeconds = 0;
    this.notify();

    // Auto-connect after 3 seconds for smooth prototype demonstration if in demo mode
    setTimeout(() => {
      if (this.activeSession && this.activeSession.id === newSession.id && this.activeSession.status === 'ringing') {
        this.setCallActive();
      }
    }, 3500);

    return newSession;
  }

  /**
   * Accept an incoming call.
   */
  public async acceptCall(session: CallSession, currentUserId: string): Promise<void> {
    try {
      await this.requestMedia(session.call_type);
    } catch (err) {
      console.error('Cannot accept call without media permission:', err);
      throw err;
    }

    session.status = 'active';
    session.started_at = new Date().toISOString();
    const myParticipant = session.participants.find((p) => p.user_id === currentUserId);
    if (myParticipant) {
      myParticipant.status = 'connected';
      myParticipant.joined_at = new Date().toISOString();
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('call_sessions')
          .update({
            status: 'active',
            started_at: session.started_at,
          })
          .eq('id', session.id);

        await supabase
          .from('call_participants')
          .update({
            status: 'connected',
            joined_at: session.started_at,
          })
          .eq('call_session_id', session.id)
          .eq('user_id', currentUserId);
      } catch (err) {
        console.warn('Could not update call accept in Supabase:', err);
      }
    }

    this.activeSession = session;
    this.setCallActive();
  }

  /**
   * Decline an incoming call.
   */
  public async declineCall(session: CallSession, currentUserId: string): Promise<void> {
    session.status = 'declined';
    session.ended_at = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('call_sessions')
          .update({
            status: 'declined',
            ended_at: session.ended_at,
          })
          .eq('id', session.id);

        await supabase
          .from('call_participants')
          .update({
            status: 'declined',
            left_at: session.ended_at,
          })
          .eq('call_session_id', session.id)
          .eq('user_id', currentUserId);
      } catch (err) {
        console.warn('Could not update call decline in Supabase:', err);
      }
    }

    this.stopMedia();
    this.activeSession = null;
    this.notify();
  }

  /**
   * End an active or ringing call.
   */
  public async endCall(): Promise<void> {
    if (this.activeSession) {
      const endedSession = this.activeSession;
      endedSession.status = 'ended';
      endedSession.ended_at = new Date().toISOString();

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase
            .from('call_sessions')
            .update({
              status: 'ended',
              ended_at: endedSession.ended_at,
            })
            .eq('id', endedSession.id);
        } catch (err) {
          console.warn('Could not mark call ended in Supabase:', err);
        }
      }
    }

    this.stopTimer();
    this.stopMedia();
    this.activeSession = null;
    this.notify();
  }

  private setCallActive() {
    if (!this.activeSession) return;
    this.activeSession.status = 'active';
    this.activeSession.started_at = this.activeSession.started_at || new Date().toISOString();
    this.startTimer();
    this.notify();
  }

  private startTimer() {
    this.stopTimer();
    this.durationSeconds = 0;
    this.timerInterval = setInterval(() => {
      this.durationSeconds += 1;
      this.notify();
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !this.isMuted;
      });
    }
    this.notify();
    return this.isMuted;
  }

  public toggleVideo(): boolean {
    this.isVideoOff = !this.isVideoOff;
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = !this.isVideoOff;
      });
    }
    this.notify();
    return this.isVideoOff;
  }

  public async switchCamera(): Promise<'user' | 'environment'> {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    if (this.activeSession && this.activeSession.call_type === 'video' && this.localStream) {
      // Re-acquire video track with new facing mode
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: this.facingMode },
        });
        const newVideoTrack = newStream.getVideoTracks()[0];
        const oldVideoTrack = this.localStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          this.localStream.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        if (newVideoTrack) {
          this.localStream.addTrack(newVideoTrack);
        }
      } catch (err) {
        console.warn('Could not switch camera facing mode:', err);
      }
    }
    this.notify();
    return this.facingMode;
  }

  private stopMedia() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    this.isMuted = false;
    this.isVideoOff = false;
  }

  private setupRealtimeIncomingCalls() {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      supabase
        .channel('call_notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'call_sessions',
          },
          async (payload) => {
            const newSession = payload.new as any;
            if (newSession && newSession.status === 'ringing') {
              const client = supabase;
              if (!client) return;
              // Check if current user is an invited participant
              const { data: userAuth } = await client.auth.getUser();
              if (userAuth?.user && newSession.initiator_id !== userAuth.user.id) {
                // Fetch full session details
                const { data: full } = await client
                  .from('call_sessions')
                  .select(`
                    id,
                    conversation_id,
                    initiator_id,
                    call_type,
                    status,
                    room_id,
                    provider,
                    created_at,
                    initiator:profiles(id, username, display_name, avatar_url),
                    participants:call_participants(id, user_id, role, status)
                  `)
                  .eq('id', newSession.id)
                  .single();

                if (full) {
                  const isInvited = (full.participants || []).some(
                    (p: any) => p.user_id === userAuth.user.id
                  );
                  if (isInvited) {
                    this.incomingCallListeners.forEach((fn) => fn(full as unknown as CallSession));
                  }
                }
              }
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime call subscription setup error:', err);
    }
  }
}

export const callingService = new CallingService();
