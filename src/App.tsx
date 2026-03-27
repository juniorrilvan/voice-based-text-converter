import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, Volume2, Play, Trash2, Send, Languages, FileText, Briefcase, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { transcribeAudio, convertMessage, generateSpeech } from './services/geminiService';

type MessageState = 'idle' | 'recording' | 'transcribing' | 'converting' | 'speaking';

export default function App() {
  const [state, setState] = useState<MessageState>('idle');
  const [transcription, setTranscription] = useState('');
  const [convertedText, setConvertedText] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleTranscription(audioBlob);
      };

      mediaRecorder.start();
      setState('recording');
      setError(null);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Microphone access denied. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleTranscription = async (blob: Blob) => {
    setState('transcribing');
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        const text = await transcribeAudio(base64Audio, 'audio/webm');
        setTranscription(text);
        setState('idle');
      };
    } catch (err) {
      console.error('Transcription error:', err);
      setError('Failed to transcribe audio. Please try again.');
      setState('idle');
    }
  };

  const handleConvert = async (transformation: string) => {
    if (!transcription) return;
    setState('converting');
    try {
      const text = await convertMessage(transcription, transformation);
      setConvertedText(text);
      setState('idle');
    } catch (err) {
      console.error('Conversion error:', err);
      setError('Failed to convert message.');
      setState('idle');
    }
  };

  const handleSpeak = async (text: string) => {
    if (!text) return;
    setState('speaking');
    try {
      const base64Audio = await generateSpeech(text);
      const audioBlob = await (await fetch(`data:audio/wav;base64,${base64Audio}`)).blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      const audio = new Audio(url);
      audio.onended = () => setState('idle');
      audio.play();
    } catch (err) {
      console.error('Speech generation error:', err);
      setError('Failed to generate speech.');
      setState('idle');
    }
  };

  const reset = () => {
    setTranscription('');
    setConvertedText('');
    setAudioUrl(null);
    setError(null);
    setState('idle');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tight text-zinc-900"
          >
            Voice Converter
          </motion.h1>
          <p className="text-zinc-500">Transform your voice messages into any style or language.</p>
        </div>

        {/* Main Interface */}
        <div className="glass-card p-6 sm:p-8 space-y-8">
          {/* Recording Section */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <AnimatePresence mode="wait">
              {state === 'recording' ? (
                <motion.button
                  key="stop"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={stopRecording}
                  className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-200 hover:bg-red-600 transition-colors"
                >
                  <Square className="w-8 h-8 fill-current" />
                </motion.button>
              ) : (
                <motion.button
                  key="start"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={startRecording}
                  disabled={state !== 'idle'}
                  className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center text-white shadow-lg shadow-zinc-200 hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {state === 'transcribing' ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </motion.button>
              )}
            </AnimatePresence>
            
            <div className="h-6">
              {state === 'recording' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-red-500 font-medium"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Recording...
                </motion.div>
              )}
              {state === 'transcribing' && (
                <span className="text-zinc-500 animate-pulse">Transcribing your message...</span>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100"
            >
              {error}
            </motion.div>
          )}

          {/* Content Sections */}
          <div className="space-y-6">
            {/* Transcription */}
            {transcription && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Original Message</h3>
                  <button onClick={() => handleSpeak(transcription)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 bg-zinc-100 rounded-xl text-zinc-800 leading-relaxed">
                  {transcription}
                </div>
                
                {/* Transformation Buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <TransformButton icon={<FileText className="w-4 h-4" />} label="Summarize" onClick={() => handleConvert('summarize')} active={state === 'converting'} />
                  <TransformButton icon={<Briefcase className="w-4 h-4" />} label="Formalize" onClick={() => handleConvert('formalize')} active={state === 'converting'} />
                  <TransformButton icon={<MessageCircle className="w-4 h-4" />} label="Casual" onClick={() => handleConvert('casual')} active={state === 'converting'} />
                  <TransformButton icon={<Languages className="w-4 h-4" />} label="Spanish" onClick={() => handleConvert('translate_es')} active={state === 'converting'} />
                  <TransformButton icon={<Languages className="w-4 h-4" />} label="French" onClick={() => handleConvert('translate_fr')} active={state === 'converting'} />
                </div>
              </motion.div>
            )}

            {/* Converted Text */}
            {convertedText && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 pt-4 border-t border-zinc-100"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Converted Message</h3>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleSpeak(convertedText)} 
                      disabled={state === 'speaking'}
                      className="text-zinc-400 hover:text-zinc-900 transition-colors disabled:opacity-50"
                    >
                      {state === 'speaking' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <button onClick={() => navigator.clipboard.writeText(convertedText)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-zinc-900 text-white rounded-xl leading-relaxed shadow-inner">
                  {convertedText}
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Controls */}
          {(transcription || convertedText) && (
            <div className="flex justify-center pt-4">
              <button 
                onClick={reset}
                className="flex items-center gap-2 text-zinc-400 hover:text-red-500 transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="text-center text-xs text-zinc-400">
          Powered by Gemini 3.1 Flash & 2.5 TTS
        </div>
      </div>
    </div>
  );
}

function TransformButton({ icon, label, onClick, active }: { icon: React.ReactNode, label: string, onClick: () => void, active?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={active}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-zinc-600 text-sm font-medium hover:border-zinc-900 hover:text-zinc-900 transition-all disabled:opacity-50"
    >
      {icon}
      {label}
    </button>
  );
}
