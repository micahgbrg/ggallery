import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface CameraAnimatorProps {
  targetPosition: [number, number, number];
  targetLookAt: [number, number, number];
  reducedMotion?: boolean;
  onArrival?: () => void;
}

export function CameraAnimator({
  targetPosition,
  targetLookAt,
  reducedMotion = false,
  onArrival
}: CameraAnimatorProps) {
  const { camera, invalidate, gl } = useThree();
  const currentPos = useRef(new THREE.Vector3());
  const currentQuat = useRef(new THREE.Quaternion());
  const destPos = useRef(new THREE.Vector3());
  const destTarget = useRef(new THREE.Vector3());
  const isAnimating = useRef(false);
  const isFirstRender = useRef(true);
  const hasArrived = useRef(false);

  // Mouse look state
  const angles = useRef({ yaw: 0, pitch: 0 });
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });

  // To avoid using function dependency, store it in ref
  const onArrivalRef = useRef(onArrival);
  useEffect(() => {
    onArrivalRef.current = onArrival;
  }, [onArrival]);

  useEffect(() => {
    // Reset angles on navigation
    angles.current = { yaw: 0, pitch: 0 };
    destPos.current.set(targetPosition[0], targetPosition[1], targetPosition[2]);
    destTarget.current.set(targetLookAt[0], targetLookAt[1], targetLookAt[2]);

    if (isFirstRender.current || reducedMotion) {
      currentPos.current.copy(destPos.current);

      const mat = new THREE.Matrix4().lookAt(destPos.current, destTarget.current, camera.up);
      currentQuat.current.setFromRotationMatrix(mat);

      camera.position.copy(currentPos.current);
      camera.quaternion.copy(currentQuat.current);
      invalidate();
      isFirstRender.current = false;
      isAnimating.current = false;
      hasArrived.current = true;
      if (onArrivalRef.current) onArrivalRef.current();
    } else {
      isAnimating.current = true;
      hasArrived.current = false;
      invalidate();
    }
  }, [
    targetPosition[0], targetPosition[1], targetPosition[2],
    targetLookAt[0], targetLookAt[1], targetLookAt[2],
    reducedMotion, camera, invalidate
  ]);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      isDragging.current = true;
      previousMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current || e.pointerType !== 'mouse') return;

      const deltaX = e.clientX - previousMouse.current.x;
      const deltaY = e.clientY - previousMouse.current.y;
      previousMouse.current = { x: e.clientX, y: e.clientY };

      const canvasWidth = gl.domElement.clientWidth || window.innerWidth;
      const canvasHeight = gl.domElement.clientHeight || window.innerHeight;

      // Calculate exact sensitivity based on camera FOV mapping screen pixels to view angles
      const cam = camera as THREE.PerspectiveCamera;
      const vFovRadians = THREE.MathUtils.degToRad(cam.fov || 50);
      const hFovRadians = 2 * Math.atan(Math.tan(vFovRadians / 2) * (canvasWidth / canvasHeight));

      const sensitivityX = hFovRadians / canvasWidth;
      const sensitivityY = vFovRadians / canvasHeight;

      angles.current.yaw += deltaX * sensitivityX * 2;
      angles.current.pitch += deltaY * sensitivityY * 2;

      const maxPitch = Math.PI / 3;
      angles.current.pitch = Math.max(-maxPitch, Math.min(maxPitch, angles.current.pitch));

      isAnimating.current = true;
      invalidate();
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      isDragging.current = false;
    };

    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [gl, invalidate]);

  useFrame(() => {
    if (!isAnimating.current) return;

    const factor = reducedMotion ? 1.0 : 0.2;

    // Apply mouse look angles using spherical coordinates for correct axis rotation regardless of hallway orientation
    const baseDir = new THREE.Vector3().subVectors(destTarget.current, destPos.current);
    const distance = baseDir.length() || 1;
    baseDir.normalize();

    const spherical = new THREE.Spherical().setFromVector3(baseDir);
    spherical.theta += angles.current.yaw;
    spherical.phi -= angles.current.pitch;

    // Clamp to prevent looking past zenith/nadir just in case
    spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, spherical.phi));

    const finalDir = new THREE.Vector3().setFromSpherical(spherical).multiplyScalar(distance);
    const destTargetOffset = new THREE.Vector3().copy(destPos.current).add(finalDir);

    currentPos.current.lerp(destPos.current, factor);

    const destMat = new THREE.Matrix4().lookAt(destPos.current, destTargetOffset, camera.up);
    const destQuat = new THREE.Quaternion().setFromRotationMatrix(destMat);
    currentQuat.current.slerp(destQuat, factor);

    camera.position.copy(currentPos.current);
    camera.quaternion.copy(currentQuat.current);
    invalidate();

    if (currentPos.current.distanceTo(destPos.current) < 0.01 && currentQuat.current.angleTo(destQuat) < 0.005) {
      currentPos.current.copy(destPos.current);
      currentQuat.current.copy(destQuat);
      camera.position.copy(currentPos.current);
      camera.quaternion.copy(currentQuat.current);

      if (!isDragging.current) {
        isAnimating.current = false;
      }

      if (!hasArrived.current) {
        hasArrived.current = true;
        if (onArrivalRef.current) onArrivalRef.current();
      }
    }
  });

  return null;
}
