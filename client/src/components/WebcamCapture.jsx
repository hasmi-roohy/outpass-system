import { useRef, useState } from 'react'

export default function WebcamCapture({ onCapture }) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const [streaming, setStreaming] = useState(false)
  const [captured,  setCaptured]  = useState(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      videoRef.current.srcObject = stream
      videoRef.current.play()
      setStreaming(true)
      setCaptured(null)
    } catch {
      alert('Camera access denied. Please allow camera access.')
    }
  }

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject
    stream?.getTracks().forEach(track => track.stop())
    setStreaming(false)
  }

  const capturePhoto = () => {
  const canvas  = canvasRef.current
  const video   = videoRef.current
  canvas.width  = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d').drawImage(video, 0, 0)
  
  const imageFull = canvas.toDataURL('image/jpeg')
  const imagePure = imageFull.split(',')[1]  // ← strip prefix
  
  setCaptured(imageFull)   // full for preview
  stopCamera()
  if (onCapture) onCapture(imagePure)  // ← pure base64 to parent
}

  const retake = () => {
    setCaptured(null)
    startCamera()
  }

  return (
    <div style={styles.wrapper}>

      {/* Camera view */}
      {!captured && (
        <div style={styles.cameraBox}>
          <video
            ref={videoRef}
            style={styles.video}
            muted
          />
          {!streaming && (
            <div style={styles.placeholder}>
              📷 Camera not started
            </div>
          )}
        </div>
      )}

      {/* Captured photo */}
      {captured && (
        <div style={styles.cameraBox}>
          <img
            src={captured}
            alt='Captured'
            style={styles.video}
          />
        </div>
      )}

      {/* Hidden canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Controls */}
      <div style={styles.controls}>
        {!streaming && !captured && (
          <button style={styles.startBtn} onClick={startCamera}>
            📷 Start Camera
          </button>
        )}
        {streaming && (
          <>
            <button style={styles.captureBtn} onClick={capturePhoto}>
              📸 Capture
            </button>
            <button style={styles.stopBtn} onClick={stopCamera}>
              Stop
            </button>
          </>
        )}
        {captured && (
          <button style={styles.retakeBtn} onClick={retake}>
            🔄 Retake
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
    background:     '#000',
    borderRadius:   '10px',
    overflow:       'hidden',
    marginBottom:   '12px',
    minHeight:      '200px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center'
  },
  video: {
    width:  '100%',
    height: 'auto'
  },
  placeholder: {
    color:    '#888',
    fontSize: '16px'
  },
  controls: {
    display: 'flex',
    gap:     '10px'
  },
  startBtn: {
    background:   '#4f46e5',
    color:        '#fff',
    border:       'none',
    padding:      '10px 20px',
    borderRadius: '6px',
    cursor:       'pointer',
    fontWeight:   'bold'
  },
  captureBtn: {
    background:   '#28a745',
    color:        '#fff',
    border:       'none',
    padding:      '10px 20px',
    borderRadius: '6px',
    cursor:       'pointer',
    fontWeight:   'bold'
  },
  stopBtn: {
    background:   '#dc3545',
    color:        '#fff',
    border:       'none',
    padding:      '10px 20px',
    borderRadius: '6px',
    cursor:       'pointer'
  },
  retakeBtn: {
    background:   '#f59e0b',
    color:        '#fff',
    border:       'none',
    padding:      '10px 20px',
    borderRadius: '6px',
    cursor:       'pointer',
    fontWeight:   'bold'
  }
}
