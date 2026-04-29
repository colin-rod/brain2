'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Square, X, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  compact?: boolean;
}

const MAX_SECONDS = 90;

function pickMimeType(): { mime: string; ext: string } {
  if (typeof MediaRecorder === 'undefined') return { mime: 'audio/webm', ext: 'webm' };
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus'))
    return { mime: 'audio/webm;codecs=opus', ext: 'webm' };
  if (MediaRecorder.isTypeSupported('audio/webm')) return { mime: 'audio/webm', ext: 'webm' };
  if (MediaRecorder.isTypeSupported('audio/mp4')) return { mime: 'audio/mp4', ext: 'm4a' };
  return { mime: '', ext: 'webm' };
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function VoiceRecorder({ file, onFileChange, compact = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  }, []);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const { mime, ext } = pickMimeType();
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blobType = mime || recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: blobType });
        const audioFile = new File([blob], `voice-${Date.now()}.${ext}`, { type: blobType });
        onFileChange(audioFile);
        if (!compact) {
          setPreviewUrl(URL.createObjectURL(blob));
        }
        setIsRecording(false);
        cleanupStream();
      };

      recorder.start();
      setIsRecording(true);
      setElapsed(0);
      tickRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= MAX_SECONDS) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Microphone unavailable';
      setError(message);
      cleanupStream();
    }
  }, [cleanupStream, onFileChange, stopRecording, compact]);

  const handleClear = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setElapsed(0);
    setIsPlaying(false);
    onFileChange(null);
  }, [previewUrl, onFileChange]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupStream();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [cleanupStream, previewUrl]);

  if (compact) {
    if (file) return null;
    return (
      <div className="inline-flex items-center gap-north-sm">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          className={cn(
            'rounded-full p-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isRecording
              ? 'bg-status-failed text-white animate-pulse'
              : 'bg-surface-subtle text-foreground hover:bg-surface',
          )}
        >
          {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
        {isRecording ? (
          <span className="text-metadata text-foreground-muted">{formatTime(elapsed)}</span>
        ) : null}
        {error ? <span className="text-metadata text-status-failed">{error}</span> : null}
      </div>
    );
  }

  if (file && previewUrl) {
    return (
      <div className="rounded-md border border-border bg-surface p-north-md">
        <div className="flex items-center gap-north-sm">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause playback' : 'Play recording'}
            className="rounded-full bg-primary text-primary-foreground p-2 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <div className="flex-1 text-body">
            <div className="font-medium">Recorded {formatTime(elapsed)}</div>
            <div className="text-metadata text-foreground-muted truncate">{file.name}</div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            aria-label="Discard recording"
            className="rounded-full p-1.5 hover:bg-surface-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <audio
          ref={audioRef}
          src={previewUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-north-sm rounded-md border-2 border-dashed border-border p-north-xl">
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        className={cn(
          'rounded-full p-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isRecording
            ? 'bg-status-failed text-white animate-pulse'
            : 'bg-primary text-primary-foreground hover:opacity-90',
        )}
      >
        {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
      </button>
      <div className="text-center">
        <p className="text-body font-medium">
          {isRecording ? `Recording… ${formatTime(elapsed)}` : 'Tap to record a voice note'}
        </p>
        <p className="text-metadata text-foreground-muted mt-1">
          {isRecording ? `Auto-stops at ${formatTime(MAX_SECONDS)}` : 'Up to 90 seconds'}
        </p>
        {error ? <p className="text-metadata text-status-failed mt-1">{error}</p> : null}
      </div>
    </div>
  );
}
