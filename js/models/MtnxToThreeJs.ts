import { IFormObj } from "./FORM";
import { $$hex } from "../utils/debug";
import { MTNX } from "./MTNX";
import * as THREE from "three";
import { degreesToRadians } from "../utils/number";

// Converts extracted MTNX (animation) data into a Three.js AnimationClip.
export class MtnxToThreeJs {
  public form!: IFormObj;

  constructor() {
  }

  createClip(mtnx: MTNX.IMTNXObj) {
    const tracks = this._createTracks(mtnx);
    const duration = this._framesToSeconds(mtnx.totalFrames);
    return new THREE.AnimationClip("MTNX", duration, tracks);
  }

  _createTracks(mtnx: MTNX.IMTNXObj) {
    const tracks = [];
    for (let i = 0; i < mtnx.tracks.length; i++) {
      const track = this._createTrack(mtnx.tracks[i]);
      if (track) {
        tracks.push(track);
      }
    }
    this._adjustTrackOrder(tracks);
    return tracks;
  }

  _createTrack(track: MTNX.ITrack) {
    const TrackType = MTNX.TrackType;

    switch (track.type) {
      case TrackType.Transform:
        return this._createTransformTrack(track);
      case TrackType.Rotation:
        return this._createRotationTrack(track);
      case TrackType.Scale:
        return this._createScaleTrack(track);
    }

    console.warn(`Unsupported track type ${$$hex(track.type)}`);
  }

  _createTransformTrack(track: MTNX.ITrack) {
    const name = this._createTransformTrackName(track);
    const keyframes = this._createKeyframeSecsArr(track.keyframes);
    const data = this._createTransformTrackData(track);
    return new (THREE as any).VectorKeyframeTrack(name, keyframes, data);
  }

  _createTransformTrackName(track: MTNX.ITrack) {
    const nodeName = this._getObjNameFromIndex(track.objIndex);
    const dimension = this._getDimensionProperty(track.dimension);
    return `${nodeName}.position[${dimension}]`;
  }

  _createTransformTrackData(track: MTNX.ITrack) {
    const data = [];
    for (let frame in track.keyframes) {
      let pos = track.keyframes[frame].value1;
      data.push(pos);
    }
    return data;
  }

  _createRotationTrack(track: MTNX.ITrack) {
    const name = this._createRotationTrackName(track);
    const keyframes = this._createKeyframeSecsArr(track.keyframes);
    const data = this._createRotationTrackData(track);
    return new (THREE as any).VectorKeyframeTrack(name, keyframes, data);
  }

  _createRotationTrackName(track: MTNX.ITrack) {
    const nodeName = this._getObjNameFromIndex(track.objIndex);
    const dimension = this._getDimensionProperty(track.dimension);
    return `${nodeName}.rotation[${dimension}]`;
  }

  _createRotationTrackData(track: MTNX.ITrack) {
    const data = [];
    for (let frame in track.keyframes) {
      const degrees = track.keyframes[frame].value1;
      const rads = degreesToRadians(degrees);
      data.push(rads);
    }
    return data;
  }

  _createQuaternion(dimension: MTNX.Dimension, degrees: number) {
    const quaternion = new THREE.Quaternion();

    const rads = degreesToRadians(degrees);

    const Dimension = MTNX.Dimension;
    switch (dimension) {
      case Dimension.X:
        quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), rads);
        break;
      case Dimension.Y:
        quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rads);
        break;
      case Dimension.Z:
        quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), rads);
        break;
      default:
        console.warn(`Didn't set quaternion value for ${$$hex(dimension)}`);
    }

    return quaternion;
  }

  _createScaleTrack(track: MTNX.ITrack) {
    const name = this._createScaleTrackName(track);
    const keyframes = this._createKeyframeSecsArr(track.keyframes);
    const data = this._createScaleTrackData(track);
    return new (THREE as any).VectorKeyframeTrack(name, keyframes, data);
  }

  _createScaleTrackName(track: MTNX.ITrack) {
    const nodeName = this._getObjNameFromIndex(track.objIndex);
    const dimension = this._getDimensionProperty(track.dimension);
    return `${nodeName}.scale[${dimension}]`;
  }

  _createScaleTrackData(track: MTNX.ITrack) {
    const data = [];
    for (let frame in track.keyframes) {
      let pos = track.keyframes[frame].value1;
      data.push(pos);
    }
    return data;
  }

  _createKeyframeSecsArr(keyframesObj: any): number[] {
    const arr: number[] = [];
    for (let frame in keyframesObj) {
      arr.push(this._framesToSeconds(parseInt(frame)));
    }
    return arr;
  }

  _getDimensionProperty(dimension: MTNX.Dimension) {
    const Dimension = MTNX.Dimension;
    switch (dimension) {
      case Dimension.X:
        return "x";
      case Dimension.Y:
        return "y";
      case Dimension.Z:
        return "z";
    }
    throw `Unknown dimension ${$$hex(dimension)}`;
  }

  _getObjNameFromIndex(index: number) {
    let cur3DIndex = -1;
    const objs = this.form.OBJ1[0].parsed.objects;
    for (let i = 0; i < objs.length; i++) {
      if (objs[i].objType === 0x3D) {
        cur3DIndex++;
        if (cur3DIndex === index) {
          return $$hex(objs[i].globalIndex);
        }
      }
    }

    console.warn(`Couldn't find associated object ${index} for track`);
    return $$hex(index); // Probably wrong
  }

  _framesToSeconds(frames: number) {
    return frames / 60;
  }

  _adjustTrackOrder(_tracks: any) {
    // for (let i = 0; i < tracks.length - 2; i++) {
    //   if (tracks[i].name.indexOf("quaternion") >= 0
    //       && tracks[i + 1] && tracks[i + 1].name === tracks[i].name
    //       && tracks[i + 2] && tracks[i + 2].name === tracks[i].name)
    //   {
    //     // Swap to ensure ZYX ordering
    //     [tracks[i], tracks[i + 1], tracks[i + 2]]
    //     = [tracks[i + 2], tracks[i + 1], tracks[i]];
    //   }
    // }
  }
}
