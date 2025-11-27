import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';

let detector: poseDetection.PoseDetector | null = null;

export async function loadPostureDetector() {
  if (detector) return;
  
  await tf.ready();
  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.BlazePose,
    { runtime: 'tfjs' }
  );
}

export interface PostureAnalysis {
  posture: 'good' | 'slouching' | 'leaning' | 'unknown';
  confidence: number;
  details: {
    shoulderAlignment: 'aligned' | 'misaligned';
    backStraight: boolean;
    headPosition: 'forward' | 'tilted' | 'backward';
  };
  improvements: string[];
}

export async function analyzePosture(videoElement: HTMLVideoElement): Promise<PostureAnalysis> {
  if (!detector) {
    await loadPostureDetector();
  }

  try {
    const poses = await detector!.estimatePoses(videoElement);
    
    if (poses.length === 0) {
      return {
        posture: 'unknown',
        confidence: 0,
        details: {
          shoulderAlignment: 'misaligned',
          backStraight: false,
          headPosition: 'forward',
        },
        improvements: ['Ensure you are visible to the camera'],
      };
    }

    const pose = poses[0];
    const keypoints = pose.keypoints;

    // Get key body points
    const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
    const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');
    const leftEar = keypoints.find(k => k.name === 'left_ear');
    const rightEar = keypoints.find(k => k.name === 'right_ear');
    const leftHip = keypoints.find(k => k.name === 'left_hip');
    const rightHip = keypoints.find(k => k.name === 'right_hip');
    const nose = keypoints.find(k => k.name === 'nose');

    if (!leftShoulder || !rightShoulder || !leftEar || !rightEar) {
      return {
        posture: 'unknown',
        confidence: 0,
        details: {
          shoulderAlignment: 'misaligned',
          backStraight: false,
          headPosition: 'forward',
        },
        improvements: ['Position yourself clearly in front of the camera'],
      };
    }

    // Analyze shoulder alignment - more lenient thresholds
    const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
    const shoulderAlignment = shoulderDiff < 35 ? 'aligned' : 'misaligned';

    // Analyze head position relative to shoulders
    const earAvg = (leftEar.y + rightEar.y) / 2;
    const shoulderAvg = (leftShoulder.y + rightShoulder.y) / 2;
    const headDiff = earAvg - shoulderAvg;
    
    let headPosition: 'forward' | 'tilted' | 'backward' = 'forward';
    if (headDiff > 80) headPosition = 'backward';
    else if (headDiff < -50) headPosition = 'tilted';
    else headPosition = 'forward';

    // Analyze back straightness - check vertical alignment of shoulders to hips
    const shoulderToHipAlignment = leftHip && rightHip
      ? Math.abs((leftShoulder.y - leftHip.y) - (rightShoulder.y - rightHip.y)) < 50
      : true;
    const backStraight = shoulderAlignment === 'aligned' && shoulderToHipAlignment;

    // Determine overall posture with improved confidence scoring
    let posture: 'good' | 'slouching' | 'leaning' | 'unknown' = 'good';
    let confidence = 90;
    const improvements: string[] = [];

    // More forgiving scoring system
    if (!backStraight) {
      posture = 'slouching';
      confidence -= 15;
      improvements.push('Keep your back straight');
    }

    if (shoulderAlignment === 'misaligned') {
      posture = shoulderDiff > 50 ? 'leaning' : 'slouching';
      confidence -= 12;
      improvements.push('Keep your shoulders level');
    }

    if (headPosition !== 'forward') {
      confidence -= 8;
      if (headPosition === 'tilted') improvements.push('Keep your head upright');
      if (headPosition === 'backward') improvements.push('Move your head slightly forward');
    }

    // Higher minimum confidence
    confidence = Math.max(60, confidence);

    return {
      posture,
      confidence,
      details: {
        shoulderAlignment,
        backStraight,
        headPosition,
      },
      improvements,
    };
  } catch (error) {
    console.error('Error analyzing posture:', error);
    return {
      posture: 'unknown',
      confidence: 0,
      details: {
        shoulderAlignment: 'misaligned',
        backStraight: false,
        headPosition: 'forward',
      },
      improvements: ['Unable to analyze posture at this moment'],
    };
  }
}

export function getPostureColor(posture: string): string {
  switch (posture) {
    case 'good': return 'text-green-600';
    case 'slouching': return 'text-amber-600';
    case 'leaning': return 'text-orange-600';
    default: return 'text-gray-600';
  }
}
