/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { callingService } from '../services/callingService';
import { CallSession, CallType, CallMediaState, SocialUser } from '../types';
import { CallModal } from '../components/calling/CallModal';
import { useAuth } from './AuthContext';

interface CallContextType {
  activeSession: CallSession | null;
  mediaState: CallMediaState;
  incomingCall: CallSession | null;
  isMinimized: boolean;
  setIsMinimized: (val: boolean) => void;
  startCall: (targetUser: SocialUser, callType: CallType, conversationId?: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  switchCamera: () => void;
  callingError: string | null;
  clearError: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [activeSession, setActiveSession] = useState<CallSession | null>(callingService.getActiveSession());
  const [mediaState, setMediaState] = useState<CallMediaState>(callingService.getMediaState());
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [callingError, setCallingError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = callingService.subscribe((session, media) => {
      setActiveSession(session);
      setMediaState(media);
    });

    const unsubIncoming = callingService.onIncomingCall((session) => {
      setIncomingCall(session);
    });

    return () => {
      unsub();
      unsubIncoming();
    };
  }, []);

  const startCall = async (targetUser: SocialUser, callType: CallType, conversationId?: string) => {
    setCallingError(null);
    setIsMinimized(false);

    const currentUserProfile: SocialUser = {
      id: user?.id || 'user-me',
      username: profile?.username || 'me',
      display_name: profile?.display_name || 'You',
      avatar_url: profile?.avatar_url || null,
      verification_status: profile?.verification_status || 'none',
    };

    try {
      await callingService.startCall({
        conversationId,
        initiator: currentUserProfile,
        targetUser,
        callType,
      });
    } catch (err: any) {
      console.error('Call initialization failed:', err);
      setCallingError(err.message || 'কল শুরু করতে সমস্যা হয়েছে।');
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    setCallingError(null);
    try {
      await callingService.acceptCall(incomingCall, user?.id || 'user-me');
      setIncomingCall(null);
    } catch (err: any) {
      console.error('Accept call failed:', err);
      setCallingError(err.message || 'কল রিসিভ করতে সমস্যা হয়েছে।');
    }
  };

  const declineCall = async () => {
    if (!incomingCall) return;
    await callingService.declineCall(incomingCall, user?.id || 'user-me');
    setIncomingCall(null);
  };

  const endCall = async () => {
    await callingService.endCall();
    setIsMinimized(false);
  };

  const toggleMute = () => {
    callingService.toggleMute();
  };

  const toggleVideo = () => {
    callingService.toggleVideo();
  };

  const switchCamera = () => {
    callingService.switchCamera();
  };

  return (
    <CallContext.Provider
      value={{
        activeSession,
        mediaState,
        incomingCall,
        isMinimized,
        setIsMinimized,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMute,
        toggleVideo,
        switchCamera,
        callingError,
        clearError: () => setCallingError(null),
      }}
    >
      {children}
      {/* Global Call Overlay / Modal */}
      {(activeSession || incomingCall || callingError) && (
        <CallModal
          session={activeSession || incomingCall}
          isIncoming={Boolean(incomingCall && !activeSession)}
          mediaState={mediaState}
          isMinimized={isMinimized}
          onToggleMinimize={() => setIsMinimized(!isMinimized)}
          onAccept={acceptCall}
          onDecline={declineCall}
          onEnd={endCall}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onSwitchCamera={switchCamera}
          error={callingError}
          onDismissError={() => setCallingError(null)}
        />
      )}
    </CallContext.Provider>
  );
};

export function useCall(): CallContextType {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
