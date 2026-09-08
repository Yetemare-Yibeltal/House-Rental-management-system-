// nestfind/nestfind/client/src/hooks/useVoice.js

import { useState, useCallback, useRef, useEffect } from "react";
import toast from "react-hot-toast";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const speechSynthesis = window.speechSynthesis;

export const useVoice = (options = {}) => {
  const {
    language = "en-US",
    continuous = false,
    interimResults = true,
    onResult,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);

  useEffect(() => {
    setIsSupported(!!SpeechRecognition && !!speechSynthesis);
  }, []);

  // ── SPEECH RECOGNITION (Input) ──────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognition.onresult = (event) => {
      let final = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript((prev) => prev + final);
        if (onResult) onResult(final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error !== "aborted") {
        const message = `Voice input error: ${event.error}`;
        toast.error(message);
        if (onError) onError(event.error);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language, continuous, interimResults, onResult, onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  // ── SPEECH SYNTHESIS (Output) ────────────────────────────────────────────────
  const speak = useCallback(
    (text, voiceOptions = {}) => {
      if (!speechSynthesis) {
        toast.error("Text-to-speech is not supported in this browser");
        return;
      }

      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voiceOptions.language || language;
      utterance.rate = voiceOptions.rate || 1.0;
      utterance.pitch = voiceOptions.pitch || 1.0;
      utterance.volume = voiceOptions.volume || 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    },
    [language],
  );

  const stopSpeaking = useCallback(() => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const getAvailableVoices = useCallback(() => {
    if (!speechSynthesis) return [];
    return speechSynthesis.getVoices();
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (speechSynthesis) speechSynthesis.cancel();
    };
  }, []);

  return {
    isListening,
    isSpeaking,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
    speak,
    stopSpeaking,
    getAvailableVoices,
  };
};
