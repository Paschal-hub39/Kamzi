import { useState, useRef, useCallback } from 'react';
import { useVoiceTranscription } from './useVoiceTranscription';

export function useMeetingRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState([]);
  const [summary, setSummary] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const { transcript, startTranscription, stopTranscription, clearTranscript } = useVoiceTranscription();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const duration = recordingTime;
        
        setRecordings(prev => [...prev, {
          id: Date.now(),
          url,
          blob,
          duration,
          transcript: transcript,
          createdAt: new Date()
        }]);
        
        chunksRef.current = [];
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start transcription
      startTranscription();
      
      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Recording failed:', err);
    }
  }, [recordingTime, transcript, startTranscription]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    stopTranscription();
    clearInterval(timerRef.current);
  }, [stopTranscription]);

  const generateSummary = useCallback(async () => {
    if (!transcript) return;
    
    // In production: call AI API
    const mockSummary = `Meeting Summary:\n\n• ${transcript.substring(0, 100)}...\n• Key points discussed\n• Action items identified`;
    setSummary(mockSummary);
    return mockSummary;
  }, [transcript]);

  const deleteRecording = useCallback((id) => {
    setRecordings(prev => prev.filter(r => r.id !== id));
  }, []);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    isRecording,
    recordingTime,
    recordings,
    summary,
    transcript,
    startRecording,
    stopRecording,
    generateSummary,
    deleteRecording,
    formatTime,
    clearTranscript
  };
}

