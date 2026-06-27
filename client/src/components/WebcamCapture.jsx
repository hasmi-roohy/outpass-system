import { useEffect, useRef, useState } from 'react'

export default function WebcamCapture({ onCapture }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [streaming, setStreaming] = useState(false)
  const [captured, setCaptured] = useState(null)
  const [error, setError] = useState('')

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject
    stream?.getTracks().forEach(track => track.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    setStreaming(false)
  }

  const startCamera = async () => {
    try {
      setError('')

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera is not available in this browser. Use Chrome or Edge on localhost/HTTPS.')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      })

      if (!videoRef.current) return

      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setStreaming(true)
      setCaptured(null)
    } catch (err) {
      setError(
        err.name === 'NotAllowedError'
          ? 'Camera access denied. Allow camera permission in the browser.'
          : 'Unable to start camera. Check if another app is using it.'
      )
    }
  }

  const capturePhoto = () => {
    const canvas = canvasRef.current
    const video = videoRef.current

    if (!canvas || !video || video.readyState < 2 || !video.videoWidth) {
      setError('Camera is still starting. Please try again in a moment.')
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageFull = canvas.toDataURL('image/jpeg', 0.9)
    const imagePure = imageFull.split(',')[1]

    setCaptured(imageFull)
    stopCamera()
    if (onCapture) onCapture(imagePure)
  }

  const retake = () => {
    setCaptured(null)
    startCamera()
  }

  useEffect(() => {
    return () => stopCamera()
  }, [])

  return (
    <div style={styles.wrapper}>
      {!captured && (
        <div style={styles.cameraBox}>
          <video ref={videoRef} style={styles.video} muted playsInline />
          {!streaming && (
            <div style={styles.placeholder}>
              Camera not started
            </div>
          )}
        </div>
      )}

      {captured && (
        <div style={styles.cameraBox}>
          <img src={captured} alt='Captured' style={styles.video} />
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.controls}>
        {!streaming && !captured && (
          <button type='button' style={styles.startBtn} onClick={startCamera}>
            Start Camera
          </button>
        )}
        {streaming && (
          <>
            <button type='button' style={styles.captureBtn} onClick={capturePhoto}>
              Capture
            </button>
            <button type='button' style={styles.stopBtn} onClick={stopCamera}>
              Stop
            </button>
          </>
        )}
        {captured && (
          <button type='button' style={styles.retakeBtn} onClick={retake}>
            Retake
          </button>
        )}
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    width: '100%'
  },
  cameraBox: {
    background: '#000',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '12px',
    minHeight: '220px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  video: {
    width: '100%',
    minHeight: '220px',
    objectFit: 'cover'
  },
  placeholder: {
    color: '#888',
    fontSize: '16px',
    position: 'absolute'
  },
  error: {
    background: '#fff0f0',
    color: '#dc2626',
    border: '1px solid #fecaca',
    padding: '8px 10px',
    borderRadius: '6px',
    fontSize: '13px',
    margin: '0 0 10px'
  },
  controls: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  startBtn: {
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  captureBtn: {
    background: '#28a745',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  stopBtn: {
    background: '#dc3545',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  retakeBtn: {
    background: '#f59e0b',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
}
