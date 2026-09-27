import * as THREE from 'three';
export type Point = [number, number, number];
export const vector = (p: Point) => new THREE.Vector3(...p);
