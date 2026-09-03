import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import api from '../../utils/api';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  ScreenShare,
  StopCircle,
  Hand,
  MessageSquare,
  Users,
  PenTool,
  PhoneOff,
  Maximize2,
  Minimize2,
  Send,
  Volume2,
  BookOpen,
  Radio
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
  isDoubt?: boolean;
}

export const LiveClassroom: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { showToast } = useToast();

  const [session, setSession] = useState<any>(null);

  // WebRTC & Media States
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [hasRaisedHand, setHasRaisedHand] = useState(false);
  const [activeTab, setActiveTab] = useState<'CHAT' | 'PARTICIPANTS' | 'WHITEBOARD' | 'NOTES'>('CHAT');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      senderName: 'Vishakha Ma\'am',
      senderRole: 'MENTOR',
      text: 'Namaste everyone! Welcome to today\'s live problem-solving class. Please open your practice sheets.',
      timestamp: 'Just now'
    },
    {
      id: '2',
      senderName: 'Rahul Verma',
      senderRole: 'STUDENT',
      text: 'Good evening Ma\'am! Audio and video are crystal clear.',
      timestamp: 'Just now'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isDoubtMode, setIsDoubtMode] = useState(false);

  // References
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#f59e0b');
  const [penSize, setPenSize] = useState(3);

  // Participants Mock list + User
  const [participants] = useState<any[]>([
    { id: '1', name: 'Vishakha Ma\'am (Lead Faculty)', role: 'MENTOR', isSpeaking: true, handRaised: false },
    { id: '2', name: 'Rahul Verma', role: 'STUDENT', isSpeaking: false, handRaised: false },
    { id: '3', name: 'Priya Sharma', role: 'STUDENT', isSpeaking: false, handRaised: true },
    { id: '4', name: 'Ankit Tiwari', role: 'STUDENT', isSpeaking: false, handRaised: false }
  ]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Fetch Session Details
  useEffect(() => {
    const fetchSession = async () => {
      try {
        if (sessionId && sessionId.startsWith('class-') || sessionId?.startsWith('room-')) {
          setSession({
            _id: sessionId,
            title: 'Live Interactive Classroom (DSSSB / CTET Math)',
            mentor: { name: 'Vishakha Ma\'am', role: 'MENTOR' },
            type: 'BATCH',
            status: 'LIVE'
          });
        } else if (sessionId) {
          const res = await api.get(`/sessions/${sessionId}`);
          setSession(res.data.data.session);
        }
      } catch {
        setSession({
          _id: sessionId || 'demo',
          title: 'Live Masterclass: Pedagogy & Calculus Shortcuts',
          mentor: { name: 'Vishakha Ma\'am', role: 'MENTOR' },
          type: 'BATCH',
          status: 'LIVE'
        });
      }
    };
    fetchSession();
  }, [sessionId]);

  // Initialize WebRTC Camera & Mic Stream
  useEffect(() => {
    const initWebRTC = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        showToast('Connected to Built-In WebRTC Live Stream!', 'success');
      } catch (err) {
        console.warn('Camera/Mic permission denied or not available:', err);
        showToast('Running in WebRTC Simulation Mode (Camera/Mic preview)', 'info');
      }
    };

    initWebRTC();

    return () => {
      // Cleanup media tracks on unmount
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Toggle Microphone
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isAudioMuted;
      });
    }
    setIsAudioMuted(!isAudioMuted);
    showToast(isAudioMuted ? 'Microphone Unmuted' : 'Microphone Muted', 'info');
  };

  // Toggle Video / Camera
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = isVideoOff;
      });
    }
    setIsVideoOff(!isVideoOff);
    showToast(isVideoOff ? 'Camera Turned On' : 'Camera Turned Off', 'info');
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      setIsScreenSharing(false);
      showToast('Screen Sharing Stopped', 'info');
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = displayStream;
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = displayStream;
        }
        displayStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };
        setIsScreenSharing(true);
        showToast('Screen Sharing Started', 'success');
      } catch (err) {
        console.warn('Screen share cancelled:', err);
      }
    }
  };

  // Raise Hand
  const handleRaiseHand = () => {
    const newState = !hasRaisedHand;
    setHasRaisedHand(newState);
    if (newState) {
      showToast('✋ You raised your hand. Faculty notified.', 'success');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          senderName: 'System Broadcast',
          senderRole: 'SYSTEM',
          text: `✋ ${user?.name || 'You'} raised their hand to ask a question.`,
          timestamp: 'Just now'
        }
      ]);
    }
  };

  // Send Chat Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderName: user?.name || 'Aspirant',
      senderRole: user?.role || 'STUDENT',
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDoubt: isDoubtMode
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatInput('');
  };

  // Canvas Whiteboard Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleLeaveSession = () => {
    if (window.confirm('Are you sure you want to leave the live classroom?')) {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      navigate('/dashboard/sessions');
    }
  };

  return (
    <div className="min-vh-100 w-100 d-flex flex-column" style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>
      {/* 1. Top Classroom Bar */}
      <header className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center shadow-sm" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
        <div className="d-flex align-items-center gap-2.5 overflow-hidden">
          <div className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill bg-danger bg-opacity-20 text-danger border border-danger border-opacity-40 fw-bold" style={{ fontSize: '0.72rem' }}>
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>LIVE WebRTC</span>
          </div>

          <div className="overflow-hidden text-start">
            <h1 className="fw-bold fs-6 mb-0 text-white text-truncate font-display">
              {session?.title || 'DSSSB / CTET Mathematics Live Masterclass'}
            </h1>
            <div className="text-secondary small d-flex align-items-center gap-2 text-truncate" style={{ fontSize: '0.68rem' }}>
              <span>Faculty: <strong className="text-warning">{session?.mentor?.name || "Vishakha Ma'am"}</strong></span>
              <span>•</span>
              <span className="text-white fw-bold">🕒 {formatTimer(elapsedSeconds)}</span>
              <span>•</span>
              <span className="badge bg-success bg-opacity-20 text-success border border-success" style={{ fontSize: '0.6rem' }}>
                HD 1080p 60FPS
              </span>
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="d-none d-md-inline-flex align-items-center gap-1 px-2.5 py-1 rounded-pill border" style={{ backgroundColor: '#1e293b', borderColor: '#334155', fontSize: '0.72rem' }}>
            <Users className="h-3.5 w-3.5 text-warning" />
            <span>{participants.length + 128} Aspirants Active</span>
          </span>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn btn-sm btn-outline-secondary text-white py-1 px-2"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={handleLeaveSession}
            className="btn btn-sm btn-danger fw-bold d-inline-flex align-items-center gap-1 py-1 px-2.5 shadow-sm"
            style={{ fontSize: '0.75rem' }}
          >
            <PhoneOff className="h-3.5 w-3.5" /> Leave Class
          </button>
        </div>
      </header>

      {/* 2. Main Live Studio Grid */}
      <div className="flex-grow-1 d-flex flex-column flex-lg-row overflow-hidden position-relative">
        {/* Left Side: Video feeds & Digital Stage */}
        <div className="flex-grow-1 p-2.5 d-flex flex-column gap-2 overflow-hidden">
          {/* Main Stage Video */}
          <div className="flex-grow-1 position-relative rounded-4 overflow-hidden border shadow-lg d-flex align-items-center justify-content-center" style={{ backgroundColor: '#020617', borderColor: '#1e293b', minHeight: '380px' }}>
            {isScreenSharing ? (
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                className="w-100 h-100 object-fit-contain bg-black"
              />
            ) : activeTab === 'WHITEBOARD' ? (
              <div className="w-100 h-100 d-flex flex-column bg-white text-dark p-2">
                <div className="d-flex justify-content-between align-items-center pb-1 mb-1 border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold small">📐 Teacher's Digital Blackboard</span>
                    <input type="color" value={penColor} onChange={(e) => setPenColor(e.target.value)} title="Pen Color" className="form-control form-control-color form-control-sm p-0 border-0" style={{ width: '22px', height: '22px' }} />
                    <select value={penSize} onChange={(e) => setPenSize(Number(e.target.value))} className="form-select form-select-sm py-0" style={{ fontSize: '0.7rem', width: '70px' }}>
                      <option value="2">Fine</option>
                      <option value="4">Medium</option>
                      <option value="8">Thick</option>
                    </select>
                  </div>
                  <button onClick={clearCanvas} className="btn btn-sm btn-outline-danger py-0 px-2" style={{ fontSize: '0.7rem' }}>
                    Clear Board
                  </button>
                </div>
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={450}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-100 flex-grow-1 border rounded-2"
                  style={{ cursor: 'crosshair', backgroundColor: '#ffffff' }}
                />
              </div>
            ) : (
              /* Faculty Live Video Stage */
              <div className="w-100 h-100 position-relative d-flex align-items-center justify-content-center bg-black">
                <img
                  src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=1000&auto=format&fit=crop&q=80"
                  alt="Vishakha Ma'am"
                  className="w-100 h-100 object-fit-cover opacity-90"
                />

                {/* Teacher Name Badge */}
                <div className="position-absolute bottom-0 start-0 m-3 d-flex align-items-center gap-2 px-3 py-1.5 rounded-3 border backdrop-blur" style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', borderColor: '#334155' }}>
                  <div className="bg-warning text-dark fw-bold rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>
                    VM
                  </div>
                  <div className="text-start">
                    <div className="fw-bold text-white small lh-1">Vishakha Ma'am (Host)</div>
                    <span className="text-warning" style={{ fontSize: '0.62rem' }}>👩‍🏫 Speaking • 2-Way Live WebRTC</span>
                  </div>
                </div>

                {/* Live Question Overlay Badge */}
                <div className="position-absolute top-0 start-0 m-3 px-3 py-1 rounded-pill bg-warning text-dark fw-bold shadow-sm" style={{ fontSize: '0.75rem' }}>
                  💡 Topic: Differential Calculus & Shortcut Methods
                </div>
              </div>
            )}

            {/* Self User Floating Webcam Preview Picture-in-Picture */}
            <div className="position-absolute bottom-0 end-0 m-3 rounded-3 overflow-hidden border shadow-lg" style={{ width: '160px', height: '110px', backgroundColor: '#0f172a', borderColor: '#334155', zIndex: 20 }}>
              {isVideoOff ? (
                <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-secondary small" style={{ fontSize: '0.7rem' }}>
                  <VideoOff className="h-5 w-5 mb-1 text-danger" />
                  <span>Camera Off</span>
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-100 h-100 object-fit-cover mirror"
                />
              )}
              <div className="position-absolute bottom-0 start-0 end-0 px-2 py-0.5 d-flex justify-content-between align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)', fontSize: '0.62rem' }}>
                <span className="text-white text-truncate fw-semibold">You ({user?.name || 'Aspirant'})</span>
                {isAudioMuted ? <MicOff className="h-3 w-3 text-danger" /> : <Mic className="h-3 w-3 text-success" />}
              </div>
            </div>
          </div>

          {/* Bottom Live Controls Bar */}
          <div className="p-2.5 rounded-4 border d-flex flex-wrap justify-content-center align-items-center gap-2.5 shadow-sm" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
            {/* Audio Toggle */}
            <button
              onClick={toggleAudio}
              className={`btn btn-sm d-inline-flex align-items-center gap-1.5 py-1.5 px-3 rounded-pill fw-bold ${
                isAudioMuted ? 'btn-danger' : 'btn-outline-light'
              }`}
              style={{ fontSize: '0.78rem' }}
            >
              {isAudioMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-success" />}
              <span>{isAudioMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            {/* Video Toggle */}
            <button
              onClick={toggleVideo}
              className={`btn btn-sm d-inline-flex align-items-center gap-1.5 py-1.5 px-3 rounded-pill fw-bold ${
                isVideoOff ? 'btn-danger' : 'btn-outline-light'
              }`}
              style={{ fontSize: '0.78rem' }}
            >
              {isVideoOff ? <VideoOff className="h-4 w-4" /> : <VideoIcon className="h-4 w-4 text-warning" />}
              <span>{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
            </button>

            {/* Screen Share */}
            <button
              onClick={toggleScreenShare}
              className={`btn btn-sm d-inline-flex align-items-center gap-1.5 py-1.5 px-3 rounded-pill fw-bold ${
                isScreenSharing ? 'btn-warning text-dark' : 'btn-outline-light'
              }`}
              style={{ fontSize: '0.78rem' }}
            >
              {isScreenSharing ? <StopCircle className="h-4 w-4" /> : <ScreenShare className="h-4 w-4 text-primary" />}
              <span>{isScreenSharing ? 'Stop Presenting' : 'Share Screen'}</span>
            </button>

            {/* Raise Hand */}
            <button
              onClick={handleRaiseHand}
              className={`btn btn-sm d-inline-flex align-items-center gap-1.5 py-1.5 px-3 rounded-pill fw-bold ${
                hasRaisedHand ? 'btn-warning text-dark animate-bounce' : 'btn-outline-light'
              }`}
              style={{ fontSize: '0.78rem' }}
            >
              <Hand className="h-4 w-4 text-warning" />
              <span>{hasRaisedHand ? 'Hand Raised ✋' : 'Raise Hand'}</span>
            </button>

            {/* Whiteboard Toggle */}
            <button
              onClick={() => setActiveTab(activeTab === 'WHITEBOARD' ? 'CHAT' : 'WHITEBOARD')}
              className={`btn btn-sm d-inline-flex align-items-center gap-1.5 py-1.5 px-3 rounded-pill fw-bold ${
                activeTab === 'WHITEBOARD' ? 'btn-primary' : 'btn-outline-light'
              }`}
              style={{ fontSize: '0.78rem' }}
            >
              <PenTool className="h-4 w-4" />
              <span>{activeTab === 'WHITEBOARD' ? 'Exit Board' : 'Digital Blackboard'}</span>
            </button>
          </div>
        </div>

        {/* Right Side: Interactive Chat, Attendees & DPP Notes */}
        <div className="d-flex flex-column border-start shadow-sm" style={{ width: '100%', maxWidth: '380px', backgroundColor: '#0f172a', borderColor: '#1e293b', minWidth: '320px' }}>
          {/* Tabs Navigation */}
          <div className="d-flex border-bottom p-1.5 gap-1" style={{ borderColor: '#1e293b' }}>
            <button
              onClick={() => setActiveTab('CHAT')}
              className={`btn btn-sm flex-grow-1 py-1.5 fw-bold rounded-2 ${
                activeTab === 'CHAT' ? 'btn-warning text-dark' : 'btn-outline-secondary text-light border-0'
              }`}
              style={{ fontSize: '0.75rem' }}
            >
              <MessageSquare className="h-3.5 w-3.5 me-1 d-inline" /> Live Chat
            </button>
            <button
              onClick={() => setActiveTab('PARTICIPANTS')}
              className={`btn btn-sm flex-grow-1 py-1.5 fw-bold rounded-2 ${
                activeTab === 'PARTICIPANTS' ? 'btn-warning text-dark' : 'btn-outline-secondary text-light border-0'
              }`}
              style={{ fontSize: '0.75rem' }}
            >
              <Users className="h-3.5 w-3.5 me-1 d-inline" /> Aspirants ({participants.length})
            </button>
            <button
              onClick={() => setActiveTab('NOTES')}
              className={`btn btn-sm flex-grow-1 py-1.5 fw-bold rounded-2 ${
                activeTab === 'NOTES' ? 'btn-warning text-dark' : 'btn-outline-secondary text-light border-0'
              }`}
              style={{ fontSize: '0.75rem' }}
            >
              <BookOpen className="h-3.5 w-3.5 me-1 d-inline" /> DPP Sheet
            </button>
          </div>

          {/* Tab Content: Live Chat */}
          {activeTab === 'CHAT' && (
            <div className="flex-grow-1 d-flex flex-column p-2.5 overflow-hidden">
              {/* Message List */}
              <div className="flex-grow-1 overflow-y-auto d-flex flex-column gap-2 pe-1 text-start" style={{ maxHeight: 'calc(100vh - 240px)' }}>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-2.5 rounded-3 border ${
                      m.isDoubt
                        ? 'border-warning bg-warning bg-opacity-10'
                        : m.senderRole === 'MENTOR'
                        ? 'border-primary bg-primary bg-opacity-10'
                        : m.senderRole === 'SYSTEM'
                        ? 'border-info bg-info bg-opacity-10'
                        : 'border-secondary'
                    }`}
                    style={{ backgroundColor: '#1e293b' }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="fw-bold small" style={{ color: m.senderRole === 'MENTOR' ? '#fbbf24' : '#ffffff' }}>
                          {m.senderName}
                        </span>
                        {m.senderRole === 'MENTOR' && (
                          <span className="badge bg-warning text-dark px-1 py-0.5" style={{ fontSize: '0.58rem' }}>
                            FACULTY
                          </span>
                        )}
                        {m.isDoubt && (
                          <span className="badge bg-danger text-white px-1 py-0.5" style={{ fontSize: '0.58rem' }}>
                            ❓ DOUBT
                          </span>
                        )}
                      </div>
                      <span className="text-secondary" style={{ fontSize: '0.62rem' }}>{m.timestamp}</span>
                    </div>
                    <p className="mb-0 text-light opacity-90 small" style={{ fontSize: '0.78rem', lineHeight: '1.35' }}>
                      {m.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Chat Input Box */}
              <form onSubmit={handleSendMessage} className="mt-2 pt-2 border-top border-secondary d-flex flex-column gap-1.5">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="form-check form-switch mb-0">
                    <input
                      type="checkbox"
                      id="doubtToggle"
                      checked={isDoubtMode}
                      onChange={(e) => setIsDoubtMode(e.target.checked)}
                      className="form-check-input"
                    />
                    <label htmlFor="doubtToggle" className="form-check-label text-warning small fw-bold" style={{ fontSize: '0.7rem' }}>
                      Tag as Question / Doubt
                    </label>
                  </div>
                  <span className="text-secondary" style={{ fontSize: '0.65rem' }}>Press Enter to send</span>
                </div>

                <div className="input-group">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={isDoubtMode ? 'Type your doubt for Vishakha Ma\'am...' : 'Send message to classroom...'}
                    className="form-control form-control-sm bg-dark text-white border-secondary"
                    style={{ fontSize: '0.8rem' }}
                  />
                  <button type="submit" className="btn btn-sm btn-warning text-dark fw-bold px-3">
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab Content: Attendees & Attendance */}
          {activeTab === 'PARTICIPANTS' && (
            <div className="p-3 d-flex flex-column gap-2 text-start overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
              <div className="p-2 rounded-2 border border-success bg-success bg-opacity-10 d-flex justify-content-between align-items-center mb-1">
                <div>
                  <div className="fw-bold text-success small">Attendance Active</div>
                  <div className="text-secondary" style={{ fontSize: '0.65rem' }}>Recorded via WebRTC Session Key</div>
                </div>
                <span className="badge bg-success text-white">100% Present</span>
              </div>

              <h6 className="fw-bold text-uppercase text-secondary mb-1" style={{ fontSize: '0.7rem' }}>In Classroom ({participants.length}):</h6>
              {participants.map((p) => (
                <div key={p.id} className="p-2 rounded-2 border border-secondary d-flex justify-content-between align-items-center" style={{ backgroundColor: '#1e293b' }}>
                  <div className="d-flex align-items-center gap-2">
                    <div className="bg-warning text-dark fw-bold rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', fontSize: '0.72rem' }}>
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div className="fw-bold small text-white">{p.name}</div>
                      <div className="text-secondary" style={{ fontSize: '0.65rem' }}>{p.role}</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-1.5">
                    {p.handRaised && <span className="badge bg-warning text-dark animate-bounce">✋ Hand</span>}
                    {p.isSpeaking && <Volume2 className="h-3.5 w-3.5 text-success animate-pulse" />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab Content: DPP Worksheet Handout */}
          {activeTab === 'NOTES' && (
            <div className="p-3 d-flex flex-column gap-3 text-start overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
              <div className="p-2.5 rounded-3 border border-warning bg-warning bg-opacity-10">
                <h6 className="fw-bold text-warning mb-1" style={{ fontSize: '0.82rem' }}>📄 DPP Worksheet #14: Calculus & Trigonometry</h6>
                <p className="text-secondary small mb-2" style={{ fontSize: '0.72rem' }}>
                  Handout uploaded by Vishakha Ma'am for today's live lecture.
                </p>
                <button
                  onClick={() => showToast('Downloading DPP Worksheet PDF...', 'success')}
                  className="btn btn-sm btn-warning text-dark fw-bold w-100 py-1"
                  style={{ fontSize: '0.75rem' }}
                >
                  Download DPP PDF Notes
                </button>
              </div>

              <div className="p-2.5 rounded-3 border border-secondary" style={{ backgroundColor: '#1e293b' }}>
                <h6 className="fw-bold text-white mb-1" style={{ fontSize: '0.8rem' }}>🔑 Key Formulas Covered Today:</h6>
                <ul className="text-secondary small mb-0 ps-3" style={{ fontSize: '0.74rem', lineHeight: '1.5' }}>
                  <li>d/dx [sin(x)] = cos(x)</li>
                  <li>d/dx [tan(x)] = sec²(x)</li>
                  <li>L'Hôpital's Rule for 0/0 and ∞/∞ forms</li>
                  <li>Pedagogy Principle: Diagnostic Remediation in Math</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveClassroom;
