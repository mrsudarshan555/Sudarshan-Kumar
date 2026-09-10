import speech_recognition as sr
import pyttsx3
import asyncio

class VoiceEngine:
    def __init__(self):
        self.engine = pyttsx3.init()
        self.recognizer = sr.Recognizer()

    def speak(self, text: str):
        """Text to speech synthesis."""
        self.engine.say(text)
        self.engine.runAndWait()

    def listen(self) -> str:
        """Captures microphone input and converts to text."""
        with sr.Microphone() as source:
            print("Mayra Listening...")
            self.recognizer.adjust_for_ambient_noise(source)
            audio = self.recognizer.listen(source)
            try:
                text = self.recognizer.recognize_whisper(audio, model="tiny")
                return text
            except Exception as e:
                return ""
