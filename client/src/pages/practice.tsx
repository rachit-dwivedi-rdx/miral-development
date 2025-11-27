import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Video, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useWebcam } from '@/hooks/use-webcam';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { detectFaces, calculateEyeContact, loadFaceDetector } from '@/lib/face-detection';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface FeedbackAlert {
  message: string;
  type: 'warning' | 'success' | 'info';
}

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

  useEffect(() => {
    loadFaceDetector().then(() => setIsModelLoading(false));
  }, []);

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
    
    if (isRecording && isReady && videoRef.current) {
      analysisInterval = setInterval(async () => {
        if (videoRef.current) {
          const faces = await detectFaces(videoRef.current);
          const hasEyeContact = calculateEyeContact(faces);
          
          setCurrentEyeContact(hasEyeContact);
          setEyeContactData(prev => [...prev, { timestamp: duration, hasEyeContact }]);
          
          if (!hasEyeContact) {
            setPoorEyeContactCount(prev => {
              const newCount = prev + 1;
              if (newCount === 5) {
                setFeedbackAlerts(prev => [...prev, { message: "👀 Look at the camera - maintain eye contact", type: 'warning' }]);
                setTimeout(() => setFeedbackAlerts(prev => prev.slice(1)), 4000);
                return 0;
              }
              return newCount;
            });
          } else {
            setPoorEyeContactCount(0);
          }
        }
      }, 1000);
    }
    
    return () => clearInterval(analysisInterval);
  }, [isRecording, isReady, duration, videoRef]);

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
      setFeedbackAlerts([]);
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

  const eyeContactPercentage = eyeContactData.length > 0
    ? Math.round((eyeContactData.filter(d => d.hasEyeContact).length / eyeContactData.length) * 100)
    : 0;

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
                  <Badge variant={currentEyeContact ? "default" : "secondary"} data-testid="badge-eye-contact">
                    {currentEyeContact ? "Good" : "Looking Away"}
                  </Badge>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${eyeContactPercentage}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {eyeContactPercentage}%
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
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={isRecording ? "default" : "secondary"}>
                    {isRecording ? "Recording" : "Ready"}
                  </Badge>
                </div>
              </div>
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

