import { useState } from 'react';
import { useMeetingRecorder } from '../../hooks/useMeetingRecorder';
import { useTheme } from '../../contexts/ThemeContext';

export default function MeetingRecorder({ chatId }) {
  const { 
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
  } = useMeetingRecorder();
  
  const { getActiveTheme, themes } = useTheme();
  const [showRecordings, setShowRecordings] = useState(false);
  
  const theme = getActiveTheme(chatId);
  const styles = themes[theme] || themes.dark;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold flex items-center gap-2">
          <span>🎙️</span>
          Voice Meeting
        </h4>
        <div className="flex gap-2">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-500 animate-pulse' 
                : 'bg-violet-600 hover:bg-violet-500'
            }`}
          >
            {isRecording ? `⏹️ Stop (${formatTime(recordingTime)})` : '⏺️ Record'}
          </button>
          {recordings.length > 0 && (
            <button
              onClick={() => setShowRecordings(!showRecordings)}
              className="px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 text-sm"
            >
              📂 {recordings.length}
            </button>
          )}
        </div>
      </div>

      {/* Live Transcript */}
      {isRecording && transcript && (
        <div className="p-3 bg-white/5 rounded-lg mb-3">
          <p className="text-xs text-gray-500 mb-1">Live transcript:</p>
          <p className="text-sm text-gray-300 italic">{transcript}</p>
        </div>
      )}

      {/* Recordings List */}
      {showRecordings && recordings.length > 0 && (
        <div className="space-y-2 mb-3">
          {recordings.map(rec => (
            <div key={rec.id} className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">
                  {rec.createdAt.toLocaleString()} • {formatTime(rec.duration)}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => generateSummary()}
                    className="text-xs text-violet-400 hover:text-violet-300"
                  >
                    📝 Summarize
                  </button>
                  <button 
                    onClick={() => deleteRecording(rec.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <audio src={rec.url} controls className="w-full h-8" />
              {rec.transcript && (
                <p className="text-xs text-gray-400 mt-2 border-l-2 border-violet-500 pl-2">
                  {rec.transcript.substring(0, 100)}...
                </p>
              )}
            </div>
          ))}

          {summary && (
            <div className="p-3 bg-violet-500/10 rounded-lg border border-violet-500/30">
              <h5 className="text-sm font-medium text-violet-400 mb-2">AI Summary</h5>
              <p className="text-sm whitespace-pre-wrap">{summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
