import React, { useState, useRef } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

const ScreenTool = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  const ffmpeg = createFFmpeg({ log: true });

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error capturing screen:", err);
    }
  };

  const stopCapture = async () => {
    mediaRecorderRef.current.stop();
    streamRef.current.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
  };

  const downloadVideo = async () => {
    if (recordedChunks.length === 0) {
      console.error("No recorded video to download.");
      return;
    }

    setIsConverting(true);

    // Initialize FFmpeg
    if (!ffmpeg.isLoaded()) await ffmpeg.load();

    // Convert webm to mp4
    const webmBlob = new Blob(recordedChunks, { type: "video/webm" });
    const webmFile = new File([webmBlob], "recording.webm");
    ffmpeg.FS("writeFile", "recording.webm", await fetchFile(webmFile));

    await ffmpeg.run("-i", "recording.webm", "recording.mp4");

    const mp4Data = ffmpeg.FS("readFile", "recording.mp4");
    const mp4Blob = new Blob([mp4Data.buffer], { type: "video/mp4" });

    // Download the MP4 file
    const url = URL.createObjectURL(mp4Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "screen-recording.mp4";
    a.click();
    URL.revokeObjectURL(url);

    setIsConverting(false);
  };

  return (
    <div style={{ textAlign: "center", margin: "20px" }}>
      <h1>Screen Recorder & Screenshot Taker</h1>
      <video ref={videoRef} autoPlay playsInline style={{ width: "80%", border: "1px solid black" }}></video>
      <div style={{ marginTop: "20px" }}>
        {isRecording ? (
          <button onClick={stopCapture} style={{ margin: "0 10px" }}>
            Stop Recording
          </button>
        ) : (
          <button onClick={startCapture} style={{ margin: "0 10px" }}>
            Start Recording
          </button>
        )}
        {recordedChunks.length > 0 && (
          <button
            onClick={downloadVideo}
            disabled={isConverting}
            style={{ margin: "0 10px" }}
          >
            {isConverting ? "Converting..." : "Download MP4"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ScreenTool;
