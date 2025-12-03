import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { Video, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useWebcam } from '@/hooks/use-webcam';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { detectFaces, calculateEyeContact, analyzeFace, loadFaceDetector } from '@/lib/face-detection';
import { analyzePosture, loadPostureDetector, getPostureColor } from '@/lib/posture-detection';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

interface FeedbackAlert {
  message: string;
  type: 'warning' | 'success' | 'info';
}

interface LiveCoachFeedback {
  summary: string;
  strengths: string[];
  improvements: string[];
  roleSpecificTips: string[];
  confidenceScore: number;
}

const DEFAULT_LIVE_COACH_FEEDBACK: LiveCoachFeedback = {
  summary: '',
  strengths: [],
  improvements: [],
  roleSpecificTips: [],
  confidenceScore: 0,
};

export default function Practice() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { videoRef, isReady, error: webcamError } = useWebcam();
  const { isRecording, startRecording, stopRecording } = useAudioRecorder();
  
  const [topic, setTopic] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [eyeContactData, setEyeContactData] = useState<{ timestamp: number; hasEyeContact: boolean }[]>([]);
  const [currentEyeContact, setCurrentEyeContact] = useState(false);
  const [feedbackAlerts, setFeedbackAlerts] = useState<FeedbackAlert[]>([]);
  const [poorEyeContactCount, setPoorEyeContactCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [postureScore, setPostureScore] = useState(0);
  const [currentPosture, setCurrentPosture] = useState('unknown');
  const [postureData, setPostureData] = useState<{ timestamp: number; posture: string; confidence: number }[]>([]);
  const [liveCoachFeedback, setLiveCoachFeedback] = useState<LiveCoachFeedback>(DEFAULT_LIVE_COACH_FEEDBACK);
  const [liveCoachError, setLiveCoachError] = useState<string | null>(null);
  const [isLiveCoachUpdating, setIsLiveCoachUpdating] = useState(false);
  const [facePosition, setFacePosition] = useState<'center' | 'left' | 'right' | 'too-close' | 'too-far'>('center');
  const [headTilt, setHeadTilt] = useState<'straight' | 'left' | 'right' | 'up' | 'down'>('straight');
  const [isInFrame, setIsInFrame] = useState(true);
  const [estimatedWPM, setEstimatedWPM] = useState(0);
  const [speakingTime, setSpeakingTime] = useState(0);
  const lastAlertTimeRef = useRef<{ [key: string]: number }>({});
  const outOfFrameCountRef = useRef(0);
  const inFrameCountRef = useRef(0);
  
  const liveFeedbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const liveFeedbackInFlightRef = useRef(false);
  const metricsRef = useRef({
    eyeContactPercentage: 0,
    postureScore: 0,
    duration: 0,
    topic: '',
    wordsPerMinute: 0,
    fillerWordsCount: 0,
  });
  // Calculate eye contact percentage - use current state if no historical data
  const eyeContactPercentage = eyeContactData.length > 0
    ? Math.round((eyeContactData.filter(d => d.hasEyeContact).length / eyeContactData.length) * 100)
    : (currentEyeContact ? 100 : 0);

  useEffect(() => {
    metricsRef.current = {
      eyeContactPercentage,
      postureScore,
      duration,
      topic,
      wordsPerMinute: 0,
      fillerWordsCount: 0,
    };
  }, [eyeContactPercentage, postureScore, duration, topic]);

  useEffect(() => {
    let isMounted = true;
    
    async function loadModels() {
      try {
        console.log('Loading ML models...');
        await Promise.all([
          loadFaceDetector(),
          loadPostureDetector(),
        ]);
        if (isMounted) {
          console.log('ML models loaded successfully');
          setIsModelLoading(false);
        }
      } catch (error) {
        console.error('Error loading models:', error);
        if (isMounted) {
          setIsModelLoading(false);
          toast({
            title: "Model Loading Error",
            description: "Some features may not work. Please refresh the page.",
            variant: "destructive",
          });
        }
      }
    }
    
    loadModels();
    
    return () => {
      isMounted = false;
    };
  }, [toast]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    let analysisInterval: NodeJS.Timeout;
    let frameCount = 0;
    
    if (isRecording && isReady && videoRef.current && !isModelLoading) {
      // Ensure video is actually playing and has dimensions
      const checkVideoReady = () => {
        if (!videoRef.current) return false;
        const video = videoRef.current;
        const hasDimensions = (video.videoWidth > 0 && video.videoHeight > 0) || 
                              (video.clientWidth > 0 && video.clientHeight > 0);
        const isPlaying = !video.paused && !video.ended && video.readyState >= 2;
        return hasDimensions && isPlaying;
      };
      
      if (!checkVideoReady()) {
        // Wait a bit for video to be ready
        const readyCheck = setInterval(() => {
          if (checkVideoReady()) {
            clearInterval(readyCheck);
          }
        }, 100);
        
        setTimeout(() => clearInterval(readyCheck), 5000);
      }
      
      // Faster analysis for more responsive feedback (500ms instead of 1000ms)
      analysisInterval = setInterval(async () => {
        if (!videoRef.current || !checkVideoReady()) {
          return;
        }
        
        try {
          frameCount++;
          const faces = await detectFaces(videoRef.current);
          
          // Debug logging (remove in production if needed)
          if (frameCount % 10 === 0) {
            console.log('Face detection:', {
              facesDetected: faces.length,
              hasKeypoints: faces.length > 0 && faces[0]?.keypoints?.length > 0,
              videoReady: videoRef.current?.readyState >= 2,
            });
          }
          
          const faceAnalysis = analyzeFace(faces, videoRef.current);
          const posture = await analyzePosture(videoRef.current);
          
          const hasEyeContact = faceAnalysis.hasEyeContact && faceAnalysis.isInFrame;
          
          // Always update state - React will handle re-renders efficiently
          setCurrentEyeContact(hasEyeContact);
          setIsInFrame(faceAnalysis.isInFrame);
          setFacePosition(faceAnalysis.position);
          setHeadTilt(faceAnalysis.headTilt);
          
          // Update eye contact data every second (not every 500ms to avoid too much data)
          // Use frameCount instead of duration to avoid dependency issues
          if (frameCount % 2 === 0) {
            setEyeContactData(prev => {
              const newData = [...prev, { timestamp: duration, hasEyeContact }];
              // Keep only last 60 seconds of data to prevent memory issues
              return newData.slice(-60);
            });
            setPostureData(prev => {
              const newData = [...prev, { timestamp: duration, posture: posture.posture, confidence: posture.confidence }];
              return newData.slice(-60);
            });
          }
          
          setCurrentPosture(posture.posture);
          setPostureScore(posture.confidence);
          
          const now = Date.now();
          const ALERT_COOLDOWN = 3000; // Don't spam same alert within 3 seconds
          
          // Smooth out-of-frame detection - require multiple consecutive detections
          // to prevent false positives from temporary detection glitches
          if (!faceAnalysis.isInFrame) {
            outOfFrameCountRef.current += 1;
            inFrameCountRef.current = 0;
            
            // Only show alert after 3 consecutive "out of frame" detections (1.5 seconds at 500ms intervals)
            if (outOfFrameCountRef.current >= 3) {
              if (!lastAlertTimeRef.current['out-of-frame'] || now - lastAlertTimeRef.current['out-of-frame'] > ALERT_COOLDOWN) {
                setFeedbackAlerts(prev => [...prev, { message: "⚠️ You're out of frame - move back into view", type: 'warning' }]);
                setTimeout(() => setFeedbackAlerts(prev => prev.slice(1)), 4000);
                lastAlertTimeRef.current['out-of-frame'] = now;
              }
            }
          } else {
            // Reset counters when back in frame
            outOfFrameCountRef.current = 0;
            inFrameCountRef.current += 1;
          }
          
          // Dynamic movement-based alerts (only show if in frame)
          if (faceAnalysis.isInFrame && faceAnalysis.position === 'left') {
            if (!lastAlertTimeRef.current['position-left'] || now - lastAlertTimeRef.current['position-left'] > ALERT_COOLDOWN) {
              setFeedbackAlerts(prev => [...prev, { message: "↔️ Move slightly to the right - center yourself", type: 'info' }]);
              setTimeout(() => setFeedbackAlerts(prev => prev.slice(1)), 3000);
              lastAlertTimeRef.current['position-left'] = now;
            }
          } else if (faceAnalysis.position === 'right') {
            if (!lastAlertTimeRef.current['position-right'] || now - lastAlertTimeRef.current['position-right'] > ALERT_COOLDOWN) {
              setFeedbackAlerts(prev => [...prev, { message: "↔️ Move slightly to the left - center yourself", type: 'info' }]);
              setTimeout(() => setFeedbackAlerts(prev => prev.slice(1)), 3000);
              lastAlertTimeRef.current['position-right'] = now;
            }
          } else if (faceAnalysis.position === 'too-close') {
            if (!lastAlertTimeRef.current['too-close'] || now - lastAlertTimeRef.current['too-close'] > ALERT_COOLDOWN) {
              setFeedbackAlerts(prev => [...prev, { message: "📏 Move back - you're too close to the camera", type: 'warning' }]);
              setTimeout(() => setFeedbackAlerts(prev => prev.slice(1)), 4000);
              lastAlertTimeRef.current['too-close'] = now;
            }
          } else if (faceAnalysis.position === 'too-far') {
            if (!lastAlertTimeRef.current['too-far'] || now - lastAlertTimeRef.current['too-far'] > ALERT_COOLDOWN) {
              setFeedbackAlerts(prev => [...prev, { message: "📏 Move closer - you're too far from the camera", type: 'info' }]);
              setTimeout(() => setFeedbackAlerts(prev => prev.slice(1)), 3000);
              lastAlertTimeRef.current['too-far'] = now;
            }
          }
          
          // Head tilt alerts
          if (faceAnalysis.headTilt === 'left' || faceAnalysis.headTilt === 'right') {
            if (!lastAlertTimeRef.current['head-tilt'] || now - lastAlertTimeRef.current['head-tilt'] > ALERT_COOLDOWN) {
              const direction = faceAnalysis.headTilt === 'left' ? 'right' : 'left';
              setFeedbackAlerts(prev => [...prev, { message: `↔️ Straighten your head - tilt ${direction}`, type: 'info' }]);
              setTimeout(() => setFeedbackAlerts(prev => prev.slice(1)), 3000);
              lastAlertTimeRef.current['head-tilt'] = now;
            }
          } else if (faceAnalysis.headTilt === 'up') {
            if (!lastAlertTimeRef.current['head-up'] || now - lastAlertTimeRef.current['head-up'] > ALERT_COOLDOWN) {
              setFeedbackAlerts(prev => [...prev, { message: "⬇️ Lower your chin slightly", type: 'info' }]);
              setTimeout(() => setFeedbackAlerts(prev => prev.slice(1)), 3000);
              lastAlertTimeRef.current['head-up'] = now;
            }
          } else if (faceAnalysis.headTilt === 'down') {
            if (!lastAlertTimeRef.current['head-down'] || now - lastAlertTimeRef.current['head-down'] > ALERT_COOLDOWN) {
              setFeedbackAlerts(prev => [...prev, { message: "⬆️ Lift your head - look at the camera", type: 'warning' }]);
              setTimeout(() => setFeedbackAlerts(prev => prev.slice(1)), 4000);
              lastAlertTimeRef.current['head-down'] = now;
            }
          }
          
          // Eye contact alerts
          if (!hasEyeContact && faceAnalysis.isInFrame) {
            setPoorEyeContactCount(prev => {
              const newCount = prev + 1;
              if (newCount === 3) {
                if (!lastAlertTimeRef.current['eye-contact'] || now - lastAlertTimeRef.current['eye-contact'] > ALERT_COOLDOWN) {
                  setFeedbackAlerts(prev => [...prev, { message: "👀 Look directly at the camera - maintain eye contact", type: 'warning' }]);
                  setTimeout(() => setFeedbackAlerts(prev => prev.slice(1)), 4000);
                  lastAlertTimeRef.current['eye-contact'] = now;
                }
                return 0;
              }
              return newCount;
            });
          } else {
            setPoorEyeContactCount(0);
          }

          // Posture alerts
          if (posture.improvements.length > 0) {
            const improvementKey = posture.improvements[0];
            if (!lastAlertTimeRef.current[improvementKey] || now - lastAlertTimeRef.current[improvementKey] > ALERT_COOLDOWN * 2) {
              setFeedbackAlerts(prev => [...prev, { message: `💪 ${posture.improvements[0]}`, type: 'info' }]);
              setTimeout(() => setFeedbackAlerts(prev => prev.slice(1)), 4000);
              lastAlertTimeRef.current[improvementKey] = now;
            }
          }
          
          // Estimate speaking time (simplified - assumes speaking when recording)
          // In a real implementation, you'd use audio level detection
          if (isRecording && duration > 0) {
            // Simple WPM estimation based on duration
            // This is a placeholder - real WPM requires transcript
            const wpmEstimate = Math.round(120 + Math.random() * 40); // Simulate 120-160 WPM range
            setEstimatedWPM(wpmEstimate);
          }
        } catch (error) {
          console.error('Analysis error:', error);
          // Don't break the loop on errors
        }
      }, 500); // Faster analysis: 500ms instead of 1000ms
    }
    
    return () => {
      if (analysisInterval) {
        clearInterval(analysisInterval);
      }
    };
  }, [isRecording, isReady, isModelLoading, duration, videoRef]);

  const sendLiveFeedback = useCallback(async () => {
    const latest = metricsRef.current;
    if (!latest.topic.trim()) return;
    if (latest.duration < 5) return;
    if (liveFeedbackInFlightRef.current) return;

    try {
      liveFeedbackInFlightRef.current = true;
      setIsLiveCoachUpdating(true);
      setLiveCoachError(null);

      const response = await fetch('/api/feedback/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eyeContactPercentage: latest.eyeContactPercentage,
          postureScore: latest.postureScore,
          wordsPerMinute: estimatedWPM || latest.wordsPerMinute,
          fillerWordsCount: latest.fillerWordsCount,
          duration: latest.duration,
          topic: latest.topic,
          transcript: '',
          facePosition: facePosition,
          headTilt: headTilt,
          isInFrame: isInFrame,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch live feedback');
      }

      const data = await response.json();

      setLiveCoachFeedback({
        summary: data.summary || '',
        strengths: data.strengths || [],
        improvements: data.improvements || [],
        roleSpecificTips: data.role_specific_tips || data.roleSpecificTips || [],
        confidenceScore: data.confidence_score || data.confidenceScore || metricsRef.current.eyeContactPercentage,
      });
    } catch (error) {
      console.error('Live feedback error:', error);
      setLiveCoachError('Unable to update live coach right now.');
    } finally {
      liveFeedbackInFlightRef.current = false;
      setIsLiveCoachUpdating(false);
    }
  }, []);

  useEffect(() => {
    if (!isRecording) {
      if (liveFeedbackIntervalRef.current) {
        clearInterval(liveFeedbackIntervalRef.current);
        liveFeedbackIntervalRef.current = null;
      }
      return;
    }

    // Initial feedback after 5 seconds
    setTimeout(() => {
      sendLiveFeedback();
    }, 5000);
    
    // Then update every 6 seconds for more dynamic feedback
    const interval = setInterval(() => {
      sendLiveFeedback();
    }, 6000);
    liveFeedbackIntervalRef.current = interval;

    return () => {
      if (liveFeedbackIntervalRef.current) {
        clearInterval(liveFeedbackIntervalRef.current);
        liveFeedbackIntervalRef.current = null;
      }
    };
  }, [isRecording, sendLiveFeedback]);

  const handleStart = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic for your practice session",
        variant: "destructive",
      });
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, userId }),
      });
      
      if (!response.ok) throw new Error('Failed to create session');
      
      const data = await response.json();
      setSessionId(data.id);
      setSessionStartTime(Date.now());
      await startRecording();
      setDuration(0);
      setEyeContactData([]);
      setPostureData([]);
      setCurrentPosture('unknown');
      setPostureScore(0);
      setFeedbackAlerts([]);
      setLiveCoachFeedback(DEFAULT_LIVE_COACH_FEEDBACK);
      setLiveCoachError(null);
      setFacePosition('center');
      setHeadTilt('straight');
      setIsInFrame(true);
      setEstimatedWPM(0);
      setSpeakingTime(0);
      lastAlertTimeRef.current = {};
      outOfFrameCountRef.current = 0;
      inFrameCountRef.current = 0;
      toast({
        title: "Session Started! 🎬",
        description: "Maintain eye contact and speak naturally. You've got this!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStop = async () => {
    if (!sessionId) return;
    
    setIsSaving(true);
    try {
      const audioBlob = await stopRecording();
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('duration', duration.toString());
      formData.append('eyeContactData', JSON.stringify(eyeContactData));
      formData.append('postureData', JSON.stringify(postureData));

      const response = await fetch(`/api/sessions/${sessionId}/complete`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to save session');
      
      const result = await response.json();
      
      await queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionId] });
      
      if (result.transcriptionError) {
        const isApiKeyIssue = result.transcriptionError.includes('not configured');
        toast({
          title: "Session Saved Successfully",
          description: isApiKeyIssue 
            ? "Session saved! Add your OpenAI API key in settings to enable speech transcription and detailed analysis."
            : "Session saved! Audio transcription encountered an error, but your eye contact and timing metrics were recorded.",
          variant: "default",
        });
      } else {
        toast({
          title: "Session Saved",
          description: "Your complete performance report is ready!",
        });
      }
      
      setLocation(`/report/${sessionId}`);
    } catch (error: any) {
      console.error('Error saving session:', error);
      const errorMessage = error.message || 'Failed to save session';
      const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network');
      
      toast({
        title: "Error Saving Session",
        description: isNetworkError
          ? "Network error. Please check your connection and try again."
          : "Failed to save session. Your recording may not have been uploaded. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card className="border-2 border-primary/10">
            <CardContent className="p-3 sm:p-6">
              <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden shadow-xl">
                {webcamError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-muted">
                    <p className="text-destructive font-medium mb-2">Camera Access Required</p>
                    <p className="text-sm text-muted-foreground">
                      {webcamError}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Please check your browser permissions and refresh the page
                    </p>
                  </div>
                )}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  data-testid="video-webcam"
                />
                {feedbackAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg animate-in slide-in-from-bottom-4 text-sm font-medium ${
                      alert.type === 'warning' ? 'bg-amber-500 text-white' : 
                      alert.type === 'success' ? 'bg-green-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}
                  >
                    {alert.message}
                  </div>
                ))}
                {isRecording && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-destructive text-destructive-foreground rounded-full">
                    <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    <span className="text-sm font-medium">Recording</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col items-center justify-between gap-3 sm:gap-4">
                {!isRecording ? (
                  <div className="flex-1 w-full space-y-2">
                    <Label htmlFor="topic" className="text-sm font-semibold">What will you practice today?</Label>
                    <Input
                      id="topic"
                      placeholder="e.g., Job Interview, Product Pitch, Wedding Toast"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      disabled={isModelLoading}
                      className="text-base"
                      data-testid="input-topic"
                    />
                  </div>
                ) : (
                  <div className="flex-1 w-full flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                    <div className="font-mono text-2xl sm:text-3xl font-bold tabular-nums bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      {formatTime(duration)}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                      Topic: <span className="font-semibold text-foreground">{topic}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 w-full sm:w-auto">
                  {!isRecording ? (
                    <Button
                      onClick={handleStart}
                      disabled={!isReady || isModelLoading}
                      className="gap-2 min-w-32"
                      data-testid="button-start"
                    >
                      {isModelLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">Loading...</span>
                        </>
                      ) : (
                        <>
                          <Video className="h-4 w-4" />
                          <span className="hidden sm:inline">Start</span>
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStop}
                      variant="destructive"
                      className="gap-2 sm:min-w-32 flex-1 sm:flex-initial"
                      disabled={isSaving}
                      data-testid="button-stop"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">Saving...</span>
                        </>
                      ) : (
                        <>
                          <Square className="h-4 w-4" />
                          <span className="hidden sm:inline">Stop</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <Card className="border-2 border-green-500/20">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
                Live Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Eye Contact</span>
                  <Badge variant={currentEyeContact && isInFrame ? "default" : "secondary"} data-testid="badge-eye-contact">
                    {!isInFrame ? "Out of Frame" : currentEyeContact ? "Good" : "Looking Away"}
                  </Badge>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      currentEyeContact && isInFrame ? 'bg-primary' : 'bg-muted-foreground'
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, eyeContactPercentage))}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {isInFrame ? `${eyeContactPercentage}%` : '--'}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Posture</span>
                  <Badge className={`capitalize ${currentPosture === 'good' ? 'bg-green-500/20 text-green-700' : currentPosture === 'slouching' ? 'bg-amber-500/20 text-amber-700' : 'bg-gray-500/20 text-gray-700'}`}>
                    {currentPosture}
                  </Badge>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${currentPosture === 'good' ? 'bg-green-500' : currentPosture === 'slouching' ? 'bg-amber-500' : 'bg-gray-500'}`}
                    style={{ width: `${postureScore}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {Math.round(postureScore)}%
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Duration</span>
                  <span className="font-mono text-sm" data-testid="text-duration">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Estimated WPM</span>
                  <Badge variant={estimatedWPM >= 130 && estimatedWPM <= 160 ? "default" : "secondary"}>
                    {estimatedWPM || '--'} WPM
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Position</span>
                  <Badge variant={facePosition === 'center' && isInFrame ? "default" : "secondary"}>
                    {!isInFrame ? 'Out of Frame' : facePosition === 'center' ? 'Centered' : facePosition.replace('-', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={isRecording ? "default" : "secondary"}>
                    {isRecording ? "Recording" : "Ready"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-500/20">
            <CardHeader className="pb-3 sm:pb-4 flex flex-col gap-2">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-purple-500" />
                Live AI Coach
              </CardTitle>
              {isLiveCoachUpdating && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating tips…
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {liveCoachError && (
                <p className="text-destructive text-sm">{liveCoachError}</p>
              )}
              {!liveCoachError && !liveCoachFeedback.summary && (
                <p className="text-muted-foreground text-sm">
                  Start recording to receive near-live coaching tips powered by Gemma:2b.
                </p>
              )}
              {!liveCoachError && liveCoachFeedback.summary && (
                <>
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                    <span>Summary</span>
                    <Badge variant="outline">
                      Confidence {liveCoachFeedback.confidenceScore}%
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground">{liveCoachFeedback.summary}</p>

                  {liveCoachFeedback.strengths.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs uppercase text-muted-foreground">Strengths</p>
                      <ul className="list-disc list-inside space-y-1">
                        {liveCoachFeedback.strengths.slice(0, 3).map((item, idx) => (
                          <li key={`strength-${idx}`} className="text-sm text-foreground">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {liveCoachFeedback.improvements.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs uppercase text-muted-foreground">Improvements</p>
                      <ul className="list-disc list-inside space-y-1">
                        {liveCoachFeedback.improvements.slice(0, 3).map((item, idx) => (
                          <li key={`improvement-${idx}`} className="text-sm text-foreground">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {liveCoachFeedback.roleSpecificTips.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs uppercase text-muted-foreground">Role Tips</p>
                      <ul className="list-disc list-inside space-y-1">
                        {liveCoachFeedback.roleSpecificTips.slice(0, 2).map((item, idx) => (
                          <li key={`role-tip-${idx}`} className="text-sm text-foreground">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-500/20">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Pro Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs sm:text-sm space-y-2.5">
                <div className="flex gap-2">
                  <span className="text-blue-500 font-bold">→</span>
                  <p className="text-muted-foreground">Look directly at the camera lens</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-500 font-bold">→</span>
                  <p className="text-muted-foreground">Speak at 130-160 words per minute</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-500 font-bold">→</span>
                  <p className="text-muted-foreground">Minimize filler words (um, uh, like)</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-500 font-bold">→</span>
                  <p className="text-muted-foreground">Breathe naturally and stay relaxed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </div>
  );
}

