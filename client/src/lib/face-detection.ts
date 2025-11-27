import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

let detector: faceLandmarksDetection.FaceLandmarksDetector | null = null;

export async function loadFaceDetector() {
  if (detector) return detector;
  
  await tf.ready();
  const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
  const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshTfjsModelConfig = {
    runtime: 'tfjs' as const,
    refineLandmarks: false,
  };
  
  detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
  return detector;
}

export async function detectFaces(video: HTMLVideoElement) {
  if (!detector) {
    detector = await loadFaceDetector();
  }
  
  try {
    const faces = await detector.estimateFaces(video, { flipHorizontal: false });
    return faces;
  } catch (error) {
    console.error('Face detection error:', error);
    return [];
  }
}

export function calculateEyeContact(faces: any[]): boolean {
  if (faces.length === 0) return false;
  
  const face = faces[0];
  if (!face.keypoints) return false;
  
  // Use more robust keypoint detection
  const leftEye = face.keypoints.find((kp: any) => kp.name === 'leftEye');
  const rightEye = face.keypoints.find((kp: any) => kp.name === 'rightEye');
  const noseTip = face.keypoints.find((kp: any) => kp.name === 'noseTip');
  const leftEyebrow = face.keypoints.find((kp: any) => kp.name === 'leftEyebrow');
  
  if (!leftEye || !rightEye) return false;
  
  // Check if face is looking towards camera (eyes should be roughly centered horizontally in face)
  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;
  
  // More lenient thresholds for better detection
  if (noseTip) {
    const horizontalDiff = Math.abs(eyeCenterX - noseTip.x);
    const verticalDiff = Math.abs(eyeCenterY - noseTip.y);
    // Relaxed from 30/40 to 60/80 for better accuracy
    return horizontalDiff < 60 && verticalDiff < 80;
  }
  
  // Fallback: check if both eyes are visible and face appears forward
  const eyeDistance = Math.abs(rightEye.x - leftEye.x);
  const verticalAlignment = Math.abs(rightEye.y - leftEye.y);
  
  // Eyes should be roughly at same height and reasonable distance apart
  return eyeDistance > 30 && verticalAlignment < 20;
}
