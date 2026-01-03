import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { executeAction } from "./actionExecutor";
import { useAuth } from "../context/AuthContext";

const VoiceController = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const recognitionRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      console.error("Speech recognition not supported");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognitionRef.current = recognition;

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("🎙️ Voice:", transcript);

      try {
        const response = await fetch("http://localhost:5000/voice-command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command: transcript,
            role: (user && user.role) ? user.role : "guest"
          })
        });

        const action = await response.json();
        console.log("🤖 Action:", action);

        executeAction(action, navigate);
      } catch (err) {
        console.error("Backend error:", err);
      }
    };

    recognition.onerror = (e) => {
      console.warn("Speech error:", e.error);
    };

    recognition.onend = () => {
      if (startedRef.current) {
        recognition.start(); // restart safely
      }
    };

    const unlockMic = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      recognition.start();
      console.log("🎙️ Voice unlocked");
      document.removeEventListener("click", unlockMic);
    };

    // 🔑 ONE user interaction required
    document.addEventListener("click", unlockMic);

    return () => {
      recognition.stop();
      document.removeEventListener("click", unlockMic);
    };
  }, [navigate, user]);

  return null;
};

export default VoiceController;
