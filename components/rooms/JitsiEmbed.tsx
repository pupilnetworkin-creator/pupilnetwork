'use client'

import { JitsiMeeting } from '@jitsi/react-sdk'
import { Loader2 } from 'lucide-react'

interface JitsiEmbedProps {
  roomId: string
  displayName: string
}

export function JitsiEmbed({ roomId, displayName }: JitsiEmbedProps) {
  const roomName = `pupilnetwork-${roomId.replace(/-/g, '')}`

  return (
    <div className="w-full h-full min-h-[400px] bg-slate-900 rounded-xl overflow-hidden relative shadow-inner">
      <JitsiMeeting
        domain="meet.jit.si"
        roomName={roomName}
        configOverwrite={{
          startWithAudioMuted: true,
          startWithVideoMuted: true,
          disableDeepLinking: true,
          prejoinPageEnabled: false, // Skip the preliminary join page to get in faster
        }}
        interfaceConfigOverwrite={{
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
        }}
        userInfo={{
          displayName: displayName || 'Student',
          email: '',
        }}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = '100%';
          iframeRef.style.width = '100%';
          iframeRef.style.border = 'none';
        }}
        spinner={() => (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900 z-10 w-full h-full">
             <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
             <p>Connecting to secure study room...</p>
           </div>
        )}
      />
    </div>
  )
}
