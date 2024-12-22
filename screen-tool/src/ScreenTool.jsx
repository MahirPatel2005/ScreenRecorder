import React, { useState, useRef } from "react";

const ScreenTool = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

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

  const stopCapture = () => {
    mediaRecorderRef.current.stop();
    streamRef.current.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
  };

  const downloadAsWebm = () => {
    if (recordedChunks.length === 0) {
      console.error("No recorded video to download.");
      return;
    }

    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "screen-recording.webm"; // Save as WEBM
    a.click();
    URL.revokeObjectURL(url);

    // Clear the recorded chunks after download
    setRecordedChunks([]);
  };

  const downloadAsMKV = () => {
    if (recordedChunks.length === 0) {
      console.error("No recorded video to convert.");
      return;
    }

    // Use the same blob, just rename the file extension to .mkv
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "screen-recording.mkv"; // Save as MKV
    a.click();
    URL.revokeObjectURL(url);

    // Clear the recorded chunks after download
    setRecordedChunks([]);
  };

  const takeScreenshot = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });
    const track = stream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(track);
    const bitmap = await imageCapture.grabFrame();

    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "screenshot.png";
    a.click();

    track.stop();
  };

  return (
    <div style={{ textAlign: "center", margin: "20px" }}>
      <h1>Screen Recorder & Screenshot Taker</h1>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: "80%", border: "1px solid black" }}
      ></video>
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
        <button onClick={takeScreenshot} style={{ margin: "0 10px" }}>
          Take Screenshot
        </button>
        {recordedChunks.length > 0 && (
          <>
            <button onClick={downloadAsWebm} style={{ margin: "0 10px" }}>
              Download WEBM
            </button>
            <button onClick={downloadAsMKV} style={{ margin: "0 10px" }}>
              Download as MKV
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ScreenTool;
