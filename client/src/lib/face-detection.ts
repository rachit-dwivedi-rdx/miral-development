import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

let detector: faceLandmarksDetection.FaceLandmarksDetector | null = null;

export async function loadFaceDetector() {
  if (detector) return detector;
  
  try {
    await tf.ready();
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshTfjsModelConfig = {
      runtime: 'tfjs' as const,
      refineLandmarks: false,
    };
    
    console.log('Loading face detector model...');
    detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
    console.log('Face detector loaded successfully');
    return detector;
  } catch (error) {
    console.error('Error loading face detector:', error);
    throw error;
  }
}

export async function detectFaces(video: HTMLVideoElement) {
  // Ensure video is ready
  if (!video || video.readyState < 2) {
    return [];
  }
  
  // Check if video has valid dimensions
  const videoWidth = video.videoWidth || video.clientWidth;
  const videoHeight = video.videoHeight || video.clientHeight;
  if (!videoWidth || !videoHeight || videoWidth === 0 || videoHeight === 0) {
    return [];
  }
  
  if (!detector) {
    try {
      detector = await loadFaceDetector();
    } catch (error) {
      console.error('Failed to load detector:', error);
      return [];
    }
  }
  
  try {
    const faces = await detector.estimateFaces(video, { flipHorizontal: false });
    return faces || [];
  } catch (error) {
    console.error('Face detection error:', error);
    return [];
  }
}

export interface FaceAnalysis {
  hasEyeContact: boolean;
  isInFrame: boolean;
  position: 'center' | 'left' | 'right' | 'too-close' | 'too-far';
  headTilt: 'straight' | 'left' | 'right' | 'up' | 'down';
}

export function calculateEyeContact(faces: any[], videoElement?: HTMLVideoElement): boolean {
  const analysis = analyzeFace(faces, videoElement);
  return analysis.hasEyeContact && analysis.isInFrame;
}

export function analyzeFace(faces: any[], videoElement?: HTMLVideoElement): FaceAnalysis {
  const defaultResult: FaceAnalysis = {
    hasEyeContact: false,
    isInFrame: false,
    position: 'center',
    headTilt: 'straight',
  };

  // If no faces detected, mark as out of frame
  if (faces.length === 0) {
    return defaultResult;
  }
  
  const face = faces[0];
  
  // If we detected a face, assume in frame unless proven otherwise
  let isInFrame = true;
  
  // Check face bounding box if available - but be VERY lenient
  if (face.box && videoElement) {
    const videoWidth = videoElement.videoWidth || videoElement.clientWidth || 640;
    const videoHeight = videoElement.videoHeight || videoElement.clientHeight || 480;
    
    if (videoWidth > 0 && videoHeight > 0) {
      // Normalized coordinates (0-1)
      const boxX = face.box.xCenter;
      const boxY = face.box.yCenter;
      const boxWidth = face.box.width;
      const boxHeight = face.box.height;
      
      // VERY lenient bounds - only mark out of frame if face is clearly outside
      // Allow up to 50% of face to be outside frame before marking as "out"
      const margin = 0.5;
      const isXInBounds = boxX > -margin && boxX < 1 + margin;
      const isYInBounds = boxY > -margin && boxY < 1 + margin;
      const hasReasonableSize = boxWidth > 0.05 && boxHeight > 0.05; // At least 5% of frame
      
      // Only mark as out of frame if clearly outside bounds AND too small
      isInFrame = (isXInBounds && isYInBounds) || hasReasonableSize;
    }
  }
  
  // If we have keypoints, we're definitely in frame
  if (face.keypoints && face.keypoints.length > 0) {
    isInFrame = true;
  }
  
  // If no keypoints, still consider in frame if we detected a face
  if (!face.keypoints || face.keypoints.length === 0) {
    return {
      hasEyeContact: false,
      isInFrame: isInFrame,
      position: 'center',
      headTilt: 'straight',
    };
  }
  
  // Use more robust keypoint detection with fallbacks
  const leftEye = face.keypoints.find((kp: any) => 
    kp.name === 'leftEye' || 
    kp.name === 'leftEyeInnerCorner' || 
    kp.name === 'leftEyeOuterCorner' ||
    kp.name === 'leftEyeLeftCorner' ||
    kp.name === 'leftEyeRightCorner'
  );
  const rightEye = face.keypoints.find((kp: any) => 
    kp.name === 'rightEye' || 
    kp.name === 'rightEyeInnerCorner' || 
    kp.name === 'rightEyeOuterCorner' ||
    kp.name === 'rightEyeLeftCorner' ||
    kp.name === 'rightEyeRightCorner'
  );
  const noseTip = face.keypoints.find((kp: any) => 
    kp.name === 'noseTip' || 
    kp.name === 'nose' ||
    kp.name === 'noseLeft' ||
    kp.name === 'noseRight'
  );
  
  // If we have a face detected but missing critical keypoints, still consider in frame
  // but mark eye contact as false and estimate position from bounding box
  if (!leftEye || !rightEye) {
    // Try to use alternative keypoints or estimate from nose/box
    if (noseTip) {
      // Use nose position for center estimation
      const eyeCenterX = noseTip.x;
      let position: 'center' | 'left' | 'right' | 'too-close' | 'too-far' = 'center';
      
      // Estimate from bounding box if available
      if (face.box) {
        const boxWidth = face.box.width;
        if (boxWidth < 0.1) {
          position = 'too-far';
        } else if (boxWidth > 0.4) {
          position = 'too-close';
        } else if (eyeCenterX < 0.3) {
          position = 'left';
        } else if (eyeCenterX > 0.7) {
          position = 'right';
        }
      } else {
        // Use nose position
        if (eyeCenterX < 0.3) {
          position = 'left';
        } else if (eyeCenterX > 0.7) {
          position = 'right';
        }
      }
      
      return {
        hasEyeContact: false,
        isInFrame: true, // If we have nose, we're in frame
        position,
        headTilt: 'straight',
      };
    }
    // If we have a face but no keypoints, still mark as in frame
    return { 
      hasEyeContact: false,
      isInFrame: true, 
      position: 'center',
      headTilt: 'straight',
    };
  }
  
  // If we have both eyes, we're definitely in frame
  isInFrame = true;
  
  // Calculate face position relative to frame (normalized 0-1)
  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;
  
  // Determine position with more lenient thresholds
  let position: 'center' | 'left' | 'right' | 'too-close' | 'too-far' = 'center';
  const eyeDistance = Math.abs(rightEye.x - leftEye.x);
  
  // More realistic thresholds based on typical face sizes
  // Eye distance typically ranges from 50-100 pixels for normal distance
  if (eyeDistance < 30) {
    position = 'too-far';
  } else if (eyeDistance > 120) {
    position = 'too-close';
  } else {
    // Check horizontal position (normalized coordinates)
    // More lenient - only alert if significantly off-center
    if (eyeCenterX < 0.25) {
      position = 'left';
    } else if (eyeCenterX > 0.75) {
      position = 'right';
    } else {
      position = 'center';
    }
  }
  
  // Determine head tilt with more lenient thresholds
  let headTilt: 'straight' | 'left' | 'right' | 'up' | 'down' = 'straight';
  const verticalAlignment = Math.abs(rightEye.y - leftEye.y);
  
  if (noseTip) {
    const horizontalDiff = Math.abs(eyeCenterX - noseTip.x);
    const verticalDiff = eyeCenterY - noseTip.y;
    
    // More lenient tilt detection - only detect significant tilts
    if (verticalAlignment > 20) {
      headTilt = rightEye.y > leftEye.y ? 'right' : 'left';
    } else if (verticalDiff < -40) {
      headTilt = 'up';
    } else if (verticalDiff > 40) {
      headTilt = 'down';
    }
    
    // Check if face is looking towards camera
    const hasEyeContact = horizontalDiff < 70 && Math.abs(verticalDiff) < 90 && verticalAlignment < 25;
    
    return {
      hasEyeContact,
      isInFrame,
      position,
      headTilt,
    };
  }
  
  // Fallback if no nose tip
  const hasEyeContact = verticalAlignment < 20;
  
  return {
    hasEyeContact,
    isInFrame,
    position,
    headTilt,
  };
}
