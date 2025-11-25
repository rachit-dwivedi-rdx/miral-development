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
  
  const leftEye = face.keypoints.find((kp: any) => kp.name === 'leftEye');
  const rightEye = face.keypoints.find((kp: any) => kp.name === 'rightEye');
  const nose = face.keypoints.find((kp: any) => kp.name === 'noseTip');
  
  if (!leftEye || !rightEye || !nose) return false;
  
  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;
  
  const horizontalDiff = Math.abs(eyeCenterX - nose.x);
  const verticalDiff = Math.abs(eyeCenterY - nose.y);
  
  return horizontalDiff < 30 && verticalDiff < 40;
}
