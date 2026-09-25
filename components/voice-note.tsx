'use client';
import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2, LoaderCircle } from 'lucide-react';

export function VoiceNote({ disabled, onTranscript, onBusyChange }: { disabled: boolean; onTranscript: (text: string) => void; onBusyChange: (busy: boolean) => void }) {
  const [recording, setRecording] = useState(false), [pending, setPending] = useState(false), [seconds, setSeconds] = useState(0);
  const [audio, setAudio] = useState<Blob | null>(null), [url, setUrl] = useState(''), [error, setError] = useState('');
  const audioUrl = useRef('');
  function replaceAudio(blob: Blob | null) { if (audioUrl.current) URL.revokeObjectURL(audioUrl.current); const next = blob ? URL.createObjectURL(blob) : ''; audioUrl.current = next; setAudio(blob); setUrl(next); }
  const recorder = useRef<MediaRecorder | null>(null), stream = useRef<MediaStream | null>(null), alive = useRef(true), controller = useRef<AbortController | null>(null);
  useEffect(() => { alive.current = true; return () => { alive.current = false; if (audioUrl.current) URL.revokeObjectURL(audioUrl.current); controller.current?.abort(); if (recorder.current?.state === 'recording') recorder.current.stop(); stream.current?.getTracks().forEach(t => t.stop()); }; }, []);
  useEffect(() => { onBusyChange(recording || pending); }, [recording, pending, onBusyChange]);
  useEffect(() => {
    if (!recording) return;
    const started = Date.now();
    const timer = window.setInterval(() => { const elapsed = Math.floor((Date.now() - started) / 1000); setSeconds(elapsed); if (elapsed >= 60 && recorder.current?.state === 'recording') recorder.current.stop(); }, 250);
    return () => window.clearInterval(timer);
  }, [recording]);
  async function start() {
    setError(''); setPending(true); replaceAudio(null); setSeconds(0);
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('Voice recording is unavailable in this browser. You can type your request instead.');
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current) { media.getTracks().forEach(t => t.stop()); return; }
      stream.current = media;
      const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(t => MediaRecorder.isTypeSupported(t));
      if (!type) throw new Error('This browser does not support a compatible recording format. Please type your request.');
      const device = new MediaRecorder(media, { mimeType: type, audioBitsPerSecond: 64000 });
      recorder.current = device; const parts: Blob[] = []; let size = 0;
      device.ondataavailable = event => { if (event.data.size) { size += event.data.size; parts.push(event.data); if (size > 4 * 1024 * 1024 && device.state === 'recording') device.stop(); } };
      device.onstop = () => {
        media.getTracks().forEach(t => t.stop()); stream.current = null;
        if (!alive.current) return;
        setRecording(false);
        if (size > 4 * 1024 * 1024) { setError('That recording is too large. Try a shorter voice note.'); return; }
        if (parts.length) replaceAudio(new Blob(parts, { type: type.split(';')[0] }));
      };
      device.onerror = () => { media.getTracks().forEach(t => t.stop()); if (alive.current) { setRecording(false); setError('Recording stopped. Please try again or type your request.'); } };
      device.start(500); setRecording(true);
    } catch (e) {
      stream.current?.getTracks().forEach(t => t.stop());
      if (alive.current) setError(e instanceof DOMException && e.name === 'NotAllowedError' ? 'Microphone access was not granted. You can type your request instead.' : e instanceof Error ? e.message : 'Unable to start recording.');
    } finally { if (alive.current) setPending(false); }
  }
  async function transcribe() {
    if (!audio) return; setPending(true); setError(''); controller.current = new AbortController();
    try {
      const form = new FormData(); form.set('audio', audio, audio.type.includes('mp4') ? 'delivery.mp4' : 'delivery.webm');
      const response = await fetch('/api/estimate/transcribe', { method: 'POST', body: form, signal: controller.current.signal });
      const result = await response.json() as { text?: string; error?: string };
      if (!response.ok || !result.text) throw new Error(result.error || 'Unable to transcribe the recording.');
      if (alive.current) { onTranscript(result.text); replaceAudio(null); }
    } catch (e) { if (alive.current && !(e instanceof DOMException && e.name === 'AbortError')) setError(e instanceof Error ? e.message : 'Please try again.'); }
    finally { if (alive.current) setPending(false); }
  }
  return <div className="voice-note">
    <div className="voice-controls"><button type="button" className="secondary" disabled={disabled || pending} onClick={() => recording ? recorder.current?.stop() : void start()}>{pending ? <LoaderCircle size={18} className="spin" aria-hidden="true" /> : recording ? <Square size={17} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}{recording ? 'Stop recording' : pending ? 'Please wait…' : 'Speak your request'}</button><span role="status">{recording ? `Recording: ${seconds}s / 60s` : 'Or type below. Up to 60 seconds.'}</span></div>
    {audio && <div className="voice-review"><audio src={url} controls aria-label="Review your voice recording" /><div><button type="button" className="secondary" disabled={pending || disabled} onClick={() => void transcribe()}>Transcribe with OpenAI</button><button type="button" className="text-button" disabled={pending} onClick={() => replaceAudio(null)}><Trash2 size={16} aria-hidden="true" /> Discard</button></div><p>Your recording is sent only when you transcribe. Check and edit the text before estimating.</p></div>}
    {error && <p className="voice-error" role="alert">{error}</p>}
  </div>;
}
