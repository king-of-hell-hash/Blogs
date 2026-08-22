import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  UploadCloud,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  FileAudio,
  AlertCircle,
  ArrowRight,
  Radio
} from 'lucide-react';

interface AudioTranscriberProps {
  onApplyTranscription?: (text: string, actionType?: 'topic' | 'notes' | 'generate') => void;
  isOpen?: boolean;
  onClose?: () => void;
  inlineMode?: boolean;
}

export const AudioTranscriber: React.FC<AudioTranscriberProps> = ({
  onApplyTranscription,
  isOpen = true,
  onClose,
  inlineMode = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [transcriptionModel, setTranscriptionModel] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecordingTracks();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const stopRecordingTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    setError(null);
    setTranscribedText('');
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Audio visualizer setup
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateVisualizer = () => {
          if (analyserRef.current && isRecording) {
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          }
          animFrameRef.current = requestAnimationFrame(updateVisualizer);
        };
        animFrameRef.current = requestAnimationFrame(updateVisualizer);
      } catch (e) {
        console.warn('AudioContext visualizer setup non-critical notice:', e);
      }

      // Determine supported mime type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/wav',
      ];
      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      const options = selectedMime ? { mimeType: selectedMime } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, {
          type: selectedMime || 'audio/webm',
        });
        setAudioBlob(finalBlob);
        const newUrl = URL.createObjectURL(finalBlob);
        setAudioUrl(newUrl);
        stopRecordingTracks();
        if (timerRef.current) clearInterval(timerRef.current);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        setAudioLevel(0);
      };

      mediaRecorder.start(250); // Collect in 250ms chunks
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      let msg = 'Could not access microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Microphone permission was denied. Please allow microphone access in your browser.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No microphone device found on this system.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setError('Please upload a valid audio file (e.g. MP3, WAV, M4A, WEBM).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError('Audio file size exceeds 25MB limit. Please upload a shorter audio snippet.');
      return;
    }

    setError(null);
    setAudioBlob(file);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const newUrl = URL.createObjectURL(file);
    setAudioUrl(newUrl);
    setTranscribedText('');
  };

  // Convert Blob to Base64 and send to Gemini 3.5 Flash transcribe API
  const handleTranscribe = async () => {
    if (!audioBlob) {
      setError('No recorded audio or file to transcribe.');
      return;
    }

    setIsTranscribing(true);
    setError(null);

    try {
      // Convert Blob to Base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string) || '';
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioBase64,
          mimeType: audioBlob.type || 'audio/webm',
          contextPrompt: 'User voice input for an SEO blog topic, title, or post notes.',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error (${response.status}): Failed to transcribe audio.`);
      }

      if (data.transcription) {
        setTranscribedText(data.transcription);
        setTranscriptionModel(data.model || 'gemini-3.5-flash');
      } else {
        throw new Error('Transcription completed but no text was recognized in the audio.');
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(err.message || 'Failed to transcribe audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopy = () => {
    if (!transcribedText) return;
    navigator.clipboard.writeText(transcribedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleAudioPlayback = () => {
    if (!audioPreviewRef.current) return;
    if (isPlayingPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPreviewRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const content = (
    <div className="space-y-4">
      {/* Header Banner if standalone modal */}
      {!inlineMode && (
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
              <Mic className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                Voice Transcriber
                <span className="text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-200/60 px-2 py-0.5 rounded-full">
                  Gemini 3.5 Flash
                </span>
              </h3>
              <p className="text-xs text-slate-500">Record spoken ideas with your mic & transcribe with AI</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Recording & Input Zone */}
      <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200/80 flex flex-col items-center justify-center text-center space-y-4">
        {/* Visualizer and Pulsing Mic Ring */}
        <div className="relative flex items-center justify-center">
          {isRecording && (
            <>
              <div
                className="absolute w-24 h-24 rounded-full bg-red-400/20 animate-ping"
                style={{ transform: `scale(${1 + audioLevel / 100})` }}
              />
              <div
                className="absolute w-20 h-20 rounded-full bg-red-500/30 animate-pulse"
                style={{ transform: `scale(${1 + audioLevel / 150})` }}
              />
            </>
          )}

          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/30 scale-105'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25 hover:scale-105'
            }`}
            title={isRecording ? 'Click to stop recording' : 'Click to start microphone recording'}
          >
            {isRecording ? <Square className="w-6 h-6 fill-white" /> : <Mic className="w-7 h-7" />}
          </button>
        </div>

        {/* State Label & Timer */}
        <div>
          {isRecording ? (
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                <Radio className="w-3.5 h-3.5 animate-pulse text-red-600" />
                {isPaused ? 'Recording Paused' : 'Recording in Progress...'}
              </div>
              <div className="text-lg font-mono font-bold text-slate-800">
                {formatDuration(recordingDuration)}
              </div>
            </div>
          ) : audioBlob ? (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Audio ready ({Math.round(audioBlob.size / 1024)} KB)
              </span>
              <p className="text-[11px] text-slate-500">Ready to transcribe or record a new take</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700">Click microphone to start recording</p>
              <p className="text-[11px] text-slate-500">Speak clearly about your blog topic, outline, or key thoughts</p>
            </div>
          )}
        </div>

        {/* Action Controls for Recording */}
        {isRecording && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePause}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              Stop & Ready
            </button>
          </div>
        )}

        {/* Audio Player and Transcribe Action */}
        {!isRecording && audioBlob && (
          <div className="w-full space-y-3 pt-2">
            {audioUrl && (
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleAudioPlayback}
                    className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center transition-colors"
                  >
                    {isPlayingPreview ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                  <Volume2 className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-700">Audio Preview</span>
                </div>
                <audio
                  ref={audioPreviewRef}
                  src={audioUrl}
                  onEnded={() => setIsPlayingPreview(false)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={startRecording}
                  className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-[11px] font-medium"
                >
                  <RotateCcw className="w-3 h-3" /> Re-record
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleTranscribe}
              disabled={isTranscribing}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
                isTranscribing
                  ? 'bg-indigo-400 text-white cursor-wait'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
              }`}
            >
              {isTranscribing ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-indigo-100" />
                  Transcribing with Gemini 3.5 Flash...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Transcribe Audio with Gemini AI
                </>
              )}
            </button>
          </div>
        )}

        {/* Upload Audio File Alternative */}
        {!isRecording && !audioBlob && (
          <div className="w-full pt-1 border-t border-slate-200/60">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1.5 w-full py-1.5 hover:bg-indigo-50/50 rounded-lg transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Or upload an audio file (.mp3, .wav, .m4a, .webm)
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200/80 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Transcribed Text Output */}
      {transcribedText && (
        <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="text-xs font-bold text-slate-800">Transcribed Output</h4>
              {transcriptionModel && (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                  {transcriptionModel}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-50 transition-colors font-medium"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-800 leading-relaxed max-h-40 overflow-y-auto select-all">
            {transcribedText}
          </div>

          {/* Quick Apply Actions */}
          {onApplyTranscription && (
            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onApplyTranscription(transcribedText, 'topic')}
                className="flex-1 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <span>Set as Blog Topic</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onApplyTranscription(transcribedText, 'generate')}
                className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors shadow-xs"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Use & Generate</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (inlineMode) {
    return content;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {content}
      </div>
    </div>
  );
};
