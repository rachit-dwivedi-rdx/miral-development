"""
Local speech-to-text using Vosk instead of OpenAI Whisper.
Keeps the same transcribe_audio(audio_file_path: str) interface
used by routes.py.
"""

import asyncio
import json
import os
import subprocess
import tempfile
import wave
from typing import Optional

from vosk import Model, KaldiRecognizer
  
from config import settings

_vosk_model: Optional[Model] = None


def _get_vosk_model() -> Model:
    """
    Lazily load the Vosk model from the path configured in .env.
    Expect env var: VOSK_MODEL_PATH pointing to an unpacked model folder.
    """
    global _vosk_model
    if _vosk_model is None:
        model_path = settings.vosk_model_path
        if not model_path:
            raise RuntimeError(
                "VOSK_MODEL_PATH not configured. Please download a Vosk model "
                "and set VOSK_MODEL_PATH in your .env file."
            )
        if not os.path.isdir(model_path):
            raise RuntimeError(f"Vosk model path does not exist: {model_path}")
        _vosk_model = Model(model_path)
    return _vosk_model


async def transcribe_audio(audio_file_path: str) -> str:
    """
    Transcribe audio file using local Vosk model.
    The input can be .webm from the browser; we convert it to 16kHz mono WAV
    using ffmpeg (must be installed on the system).
    """
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _transcribe_sync, audio_file_path)


def _transcribe_sync(audio_file_path: str) -> str:
    tmp_wav = None
    try:
        # Convert input audio to 16kHz mono WAV using ffmpeg
        fd, tmp_wav = tempfile.mkstemp(suffix=".wav")
        os.close(fd)

        ffmpeg_cmd = [
            "ffmpeg",
            "-y",
            "-i",
            audio_file_path,
            "-ar",
            "16000",
            "-ac",
            "1",
            "-f",
            "wav",
            tmp_wav,
        ]

        try:
            subprocess.run(
                ffmpeg_cmd,
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        except FileNotFoundError:
            raise RuntimeError(
                "ffmpeg not found. Please install ffmpeg and ensure it is on your PATH."
            )

        model = _get_vosk_model()

        wf = wave.open(tmp_wav, "rb")
        if wf.getnchannels() != 1 or wf.getsampwidth() != 2:
            raise RuntimeError("Audio must be 16-bit mono WAV after conversion.")

        rec = KaldiRecognizer(model, wf.getframerate())
        rec.SetWords(True)

        texts = []
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if rec.AcceptWaveform(data):
                res = json.loads(rec.Result())
                if "text" in res:
                    texts.append(res["text"])

        final_res = json.loads(rec.FinalResult())
        if "text" in final_res:
            texts.append(final_res["text"])

        transcript = " ".join(t.strip() for t in texts if t.strip())
        return transcript

    except Exception as e:
        print(f"Error in Vosk transcription: {e}")
        raise Exception(f"Failed to transcribe audio: {str(e)}")
    finally:
        if tmp_wav and os.path.exists(tmp_wav):
            try:
                os.remove(tmp_wav)
            except OSError:
                pass
