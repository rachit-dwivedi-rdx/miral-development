# Troubleshooting Guide - Live Metrics & Face Detection

## If you see "Out of Frame" when you're clearly visible:

### Step 1: Check Browser Console
1. Press **F12** to open Developer Tools
2. Go to **Console** tab
3. Look for these messages:
   - ✅ "Loading ML models..." → Should see "ML models loaded successfully"
   - ✅ "Face detector loaded successfully"
   - ✅ "Face detection: { facesDetected: 1, hasKeypoints: true }"

### Step 2: Verify Browser Support
**Required:**
- **Chrome** (recommended) or **Edge** (Chromium-based)
- **NOT Safari or Firefox** (TensorFlow.js works better in Chromium browsers)

**Check WebGL Support:**
1. Go to: https://get.webgl.org/
2. You should see a spinning cube
3. If not, your browser doesn't support WebGL (needed for face detection)

### Step 3: Check Camera Permissions
1. Click the **lock icon** in browser address bar
2. Ensure **Camera** and **Microphone** are set to **Allow**
3. Refresh the page if you changed permissions

### Step 4: Verify TensorFlow.js Models Loaded
In browser console, type:
```javascript
tf.engine().backend
```
Should return: `"webgl"` or `"cpu"`

### Step 5: Test Face Detection Manually
In browser console (while on Practice page), type:
```javascript
// Check if detector is loaded
window.detectorCheck = async () => {
  const video = document.querySelector('video');
  if (!video) return 'No video element';
  
  const { detectFaces } = await import('./src/lib/face-detection.ts');
  const faces = await detectFaces(video);
  console.log('Faces detected:', faces.length);
  if (faces.length > 0) {
    console.log('Face keypoints:', faces[0].keypoints?.length);
    console.log('Face box:', faces[0].box);
  }
  return faces;
};
window.detectorCheck();
```

## Common Issues & Solutions

### Issue: "Out of Frame" always showing
**Solution:**
- Make sure you're using **Chrome** browser
- Check console for errors
- Ensure good lighting (face detection needs clear visibility)
- Sit closer to camera (face should be clearly visible)

### Issue: Eye Contact always shows 0%
**Solution:**
- Look directly at the camera lens (not the screen)
- Ensure your face is centered
- Check if face detection is working (see Step 5 above)

### Issue: Posture always shows "Unknown"
**Solution:**
- Ensure your upper body is visible
- Sit up straight
- Make sure camera can see your shoulders

### Issue: Models not loading
**Solution:**
- Check internet connection (models download on first use)
- Clear browser cache and reload
- Try incognito/private mode

## Required Installations

### For Backend (FastAPI):
1. **Python 3.10+** ✅ (you have this)
2. **Ollama** ✅ (you have this)
3. **ffmpeg** - For audio conversion
   - Download from: https://ffmpeg.org/download.html
   - Add to PATH
   - Test: `ffmpeg -version` in PowerShell
4. **Vosk Model** - For speech-to-text
   - Download: https://alphacephei.com/vosk/models
   - Extract to folder (e.g., `E:\models\vosk-model-small-en-us-0.15`)
   - Set in `.env`: `VOSK_MODEL_PATH=E:\models\vosk-model-small-en-us-0.15`

### For Frontend (React):
1. **Node.js 18+** ✅ (you have this)
2. **Chrome Browser** - Required for TensorFlow.js
3. **WebGL Support** - Usually enabled by default

## Testing Checklist

- [ ] Browser console shows "Face detector loaded successfully"
- [ ] Browser console shows "ML models loaded successfully"  
- [ ] Camera permission is granted
- [ ] Video element shows your face clearly
- [ ] Console shows "Face detection: { facesDetected: 1 }" when recording
- [ ] Eye Contact % updates when you look at/away from camera
- [ ] Position badge changes when you move left/right
- [ ] Posture updates when you sit up/slouch

## Still Not Working?

1. **Hard Refresh**: `Ctrl + Shift + R` (clears cache)
2. **Check Console Errors**: Copy any red error messages
3. **Try Different Browser**: Use Chrome if on Edge, or vice versa
4. **Check Lighting**: Ensure face is well-lit
5. **Camera Position**: Ensure camera is at eye level

