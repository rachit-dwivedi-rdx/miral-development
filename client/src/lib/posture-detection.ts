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

    // Analyze shoulder alignment
    const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
    const shoulderAlignment = shoulderDiff < 20 ? 'aligned' : 'misaligned';

    // Analyze head position
    const earAvg = (leftEar.y + rightEar.y) / 2;
    const shoulderAvg = (leftShoulder.y + rightShoulder.y) / 2;
    const headDiff = earAvg - shoulderAvg;
    
    let headPosition: 'forward' | 'tilted' | 'backward' = 'forward';
    if (headDiff > 50) headPosition = 'backward';
    else if (headDiff < -30) headPosition = 'tilted';
    else headPosition = 'forward';

    // Analyze back straightness
    const shoulderToHipAlignment = leftHip && rightHip
      ? Math.abs((leftShoulder.y - leftHip.y) - (rightShoulder.y - rightHip.y)) < 30
      : true;
    const backStraight = shoulderAlignment === 'aligned' && shoulderToHipAlignment;

    // Determine overall posture
    let posture: 'good' | 'slouching' | 'leaning' | 'unknown' = 'good';
    let confidence = 85;
    const improvements: string[] = [];

    if (!backStraight) {
      posture = 'slouching';
      confidence -= 20;
      improvements.push('Keep your back straight');
    }

    if (shoulderAlignment === 'misaligned') {
      posture = shoulderDiff > 40 ? 'leaning' : 'slouching';
      confidence -= 15;
      improvements.push('Keep your shoulders level');
    }

    if (headPosition !== 'forward') {
      confidence -= 10;
      if (headPosition === 'tilted') improvements.push('Keep your head upright');
      if (headPosition === 'backward') improvements.push('Move your head slightly forward');
    }

    confidence = Math.max(20, confidence);

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
