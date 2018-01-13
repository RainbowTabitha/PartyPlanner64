PP64.ns("utils");

// Converts extracted MTNX (animation) data into a Three.js AnimationClip.
PP64.utils.MtnxToThreeJs = class MtnxToThreeJs {
  constructor() {
  }

  createClip(mtnx) {
    const tracks = this._createTracks(mtnx);
    const duration = this._framesToSeconds(mtnx.totalFrames);
    return new THREE.AnimationClip("MTNX", duration, tracks);
  }

  _createTracks(mtnx) {
    const tracks = [];
    for (let i = 0; i < mtnx.tracks.length; i++) {
      const track = this._createTrack(mtnx.tracks[i]);
      if (track) {
        tracks.push(track);
      }
    }
    return tracks;
  }

  _createTrack(track) {
    const TrackType = PP64.utils.MTNX.TrackType;

    switch (track.type) {
      case TrackType.Transform:
        return this._createTransformTrack(track);
      case TrackType.Rotation:
        return this._createRotationTrack(track);

    }

    console.warn(`Unsupported track type ${track.type}`);
  }

  _createTransformTrack(track) {
    const name = this._createTransformTrackName(track);
    const keyframes = this._createKeyframeSecsArr(track.keyframes);
    const data = this._createTransformTrackData(track.keyframes);
    return new THREE.VectorKeyframeTrack(name, keyframes, data);
  }

  _createTransformTrackName(track) {
    const nodeName = this._getObjNameFromId(track.objGlobalIndex);
    const dimension = this._getDimensionProperty(track.dimension);
    return `${nodeName}.position[${dimension}]`;
  }

  _createTransformTrackData(keyframesObj) {
    const data = [];
    for (let frame in keyframesObj) {
      data.push(keyframesObj[frame].value1);
    }
    return data;
  }

  _createRotationTrack(track) {
    const name = this._createRotationTrackName(track);
    const keyframes = this._createKeyframeSecsArr(track.keyframes);
    const data = this._createRotationTrackData(track);
    return new THREE.QuaternionKeyframeTrack(name, keyframes, data);
  }

  _createRotationTrackName(track) {
    const nodeName = this._getObjNameFromId(track.objGlobalIndex);
    //const dimension = this._getDimensionProperty(track.dimension);
    return `${nodeName}.quaternion`;
  }

  _createRotationTrackData(track) {
    const data = [];
    for (let frame in track.keyframes) {
      const degrees = track.keyframes[frame].value1;
      const quaternion = this._createQuaternion(track.dimension, degrees);
      data.push(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
    }
    return data;
  }

  _createQuaternion(dimension, degrees) {
    const quaternion = new THREE.Quaternion();

    const rads = $$number.degreesToRadians(degrees);

    const Dimension = PP64.utils.MTNX.Dimension;
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

  _createKeyframeSecsArr(keyframesObj) {
    const arr = [];
    for (let frame in keyframesObj) {
      arr.push(this._framesToSeconds(parseInt(frame)));
    }
    return arr;
  }

  _getDimensionProperty(dimension) {
    const Dimension = PP64.utils.MTNX.Dimension;
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

  _getObjNameFromId(id) {
    return $$hex(id);
  }

  _framesToSeconds(frames) {
    return frames / 30;
  }
};
