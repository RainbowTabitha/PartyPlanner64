// The parsing here is shamelessly derived from Subdrag's
// N64SoundTools / N64MidiTool MidiParse.cpp

// https://github.com/derselbst/N64SoundTools/blob/master/N64MidiTool/N64MidiLibrary/MidiParse.cpp#L296

import { copyRange } from "../utils/arrays";
import { assert } from "../utils/debug";

/* eslint-disable */

const LENGTH_HEADER = 0x44;
const MIDI_HEADER_MAGIC = 0x4d546864; // MThd
const MIDI_TRACK_MAGIC = 0x4d54726b; // MTrk

interface IRefs {
  altPattern: number[] | null;
  altOffset: number;
  altLength: number;
  position: number;
  original: number;
}

/**
 * This parses an entry of MIDI data that the S2 structure contains.
 */
export function parseGameMidi(
  inView: DataView,
  inputSize: number
): ArrayBuffer {
  // TODO: inputs?
  let usePitchBendSensitity: boolean = false;
  let pitchBendSensitity: number = 0;
  let extendTracksToHighest: boolean = false;
  let hasLoopPoint: boolean;
  let loopStart: number;
  let loopEnd: number;

  const out = new ArrayBuffer(100000); // TODO: How big?
  const outView = new DataView(out);

  const trackCount = _getTrackCount(inView);
  const division = inView.getUint32(0x40);
  _writeMidiHeader(outView, trackCount, division);

  let outPos = 14;

  let numInstruments = 0;
  let counterTrack = 0;
  let highestTrackLength = 0;
  for (let i = 0; i < LENGTH_HEADER - 4; i += 4) {
    let absoluteTime = 0;
    const offset = inView.getUint32(i);
    if (offset === 0) {
      continue;
    }

    let previousEventValue = 0;
    const loopEndsWithCount = new Map<number, number>();

    const refs: IRefs = {
      altPattern: null,
      altOffset: 0,
      altLength: 0,
      position: offset,
      original: -1,
    };

    let endFlag = false;
    while (refs.position < inputSize && !endFlag) {
      let timePosition = refs.position;

      refs.original = -1;
      let timeTag = _getVLBytes(inView, refs, true);

      absoluteTime += timeTag;
      if (absoluteTime > highestTrackLength) {
        highestTrackLength = absoluteTime;
      }

      let vlLength = 0;
      let returnByte = _readMidiByte(inView, refs, true);
      let eventVal = returnByte;
      let statusBit = eventVal < 0x80;

      if (eventVal === 0xff || (statusBit && previousEventValue === 0xff)) {
        // meta event
        let subType;
        if (statusBit) subType = eventVal;
        else subType = _readMidiByte(inView, refs, true);

        if (subType == 0x51) {
          // tempo
          let microsecondsSinceQuarterNote =
            (((_readMidiByte(inView, refs, true) << 8) |
              _readMidiByte(inView, refs, true)) <<
              8) |
            _readMidiByte(inView, refs, true);
        } else if (subType == 0x2d) {
          // end loop
          let loopCount = _readMidiByte(inView, refs, true);
          let currentLoopCount = _readMidiByte(inView, refs, true);
          let offsetToBeginningLoop =
            (((((_readMidiByte(inView, refs, false) << 8) |
              _readMidiByte(inView, refs, false)) <<
              8) |
              _readMidiByte(inView, refs, false)) <<
              8) |
            _readMidiByte(inView, refs, false);

          if (loopCount == 0xff || loopCount == 0x00) {
            break;
          } else {
            const it = loopEndsWithCount.get(refs.position);
            if (loopEndsWithCount.has(refs.position)) {
              let countLeft = it!;
              if (countLeft === 0) {
                loopEndsWithCount.delete(refs.position);
              } else {
                loopEndsWithCount.set(refs.position, countLeft - 1);
              }
            } else {
              loopEndsWithCount.set(refs.position, loopCount - 1);
            }

            if (refs.altPattern === null) {
              refs.position = refs.position - offsetToBeginningLoop;
            } else {
              loopEndsWithCount.delete(refs.position);
            }
          }
        } else if (subType == 0x2e) {
          // start loop
          let loopNumber = _readMidiByte(inView, refs, true);
          let endLoop = _readMidiByte(inView, refs, true); // Always FF
        } else if (subType == 0x2f) {
          endFlag = true;
        }

        if (!statusBit) {
          previousEventValue = eventVal;
        }
      } else if (
        (eventVal >= 0x90 && eventVal < 0xa0) ||
        (statusBit && previousEventValue >= 0x90 && previousEventValue < 0xa0)
      ) {
        let curEventVal;

        let noteNumber;
        if (statusBit) {
          noteNumber = eventVal;
          curEventVal = previousEventValue;
        } else {
          noteNumber = _readMidiByte(inView, refs, true);
          curEventVal = eventVal;
        }
        let velocity = _readMidiByte(inView, refs, true);
        let timeDuration = _getVLBytes(inView, refs, true);

        if (!statusBit) previousEventValue = eventVal;
      } else if (
        (eventVal >= 0xb0 && eventVal < 0xc0) ||
        (statusBit && previousEventValue >= 0xb0 && previousEventValue < 0xc0)
      ) {
        // controller change
        let controllerTypeText = "";
        let controllerType;
        if (statusBit) {
          controllerType = eventVal;
          //previousEventValue;
        } else {
          controllerType = _readMidiByte(inView, refs, true);
          //eventVal;
        }
        let controllerValue = _readMidiByte(inView, refs, true);

        if (!statusBit) previousEventValue = eventVal;
      } else if (
        (eventVal >= 0xc0 && eventVal < 0xd0) ||
        (statusBit && previousEventValue >= 0xc0 && previousEventValue < 0xd0)
      ) {
        // change instrument
        let instrument;
        if (statusBit) {
          instrument = eventVal;
          //previousEventValue;
        } else {
          instrument = _readMidiByte(inView, refs, true);
          //eventVal;
        }

        if (!statusBit) {
          previousEventValue = eventVal;
        }
      } else if (
        (eventVal >= 0xd0 && eventVal < 0xe0) ||
        (statusBit && previousEventValue >= 0xd0 && previousEventValue < 0xe0)
      ) {
        // channel aftertouch
        let amount;
        if (statusBit) {
          amount = eventVal;
          //previousEventValue;
        } else {
          amount = _readMidiByte(inView, refs, true);
          //eventVal;
        }

        if (!statusBit) {
          previousEventValue = eventVal;
        }
      } else if (
        (eventVal >= 0xe0 && eventVal < 0xf0) ||
        (statusBit && previousEventValue >= 0xe0 && previousEventValue < 0xf0)
      ) {
        // pitch bend
        let valueLSB;
        if (statusBit) {
          valueLSB = eventVal;
          //previousEventValue;
        } else {
          valueLSB = _readMidiByte(inView, refs, true);
          //eventVal;
        }

        let valueMSB = _readMidiByte(inView, refs, true);

        if (!statusBit) {
          previousEventValue = eventVal;
        }
      } else if (eventVal == 0xfe) {
        // repeat operation
        // should not be here...
        // no prev event set
      } else {
      }
    }
  }

  // Second loop over tracks.
  for (let i = 0; i < LENGTH_HEADER - 4; i += 4) {
    let absoluteTime = 0;

    let trackEventCountSub = 0;
    let trackEventsSub: TrackEvent[] = new Array(0x30000);

    for (let j = 0; j < 0x30000; j++) {
      trackEventsSub[j] = new TrackEvent();
    }

    let offset = inView.getUint32(i);

    if (offset != 0) {
      outView.setUint32(outPos, 0x4d54726b); // MTrk
      outPos += 4;

      let previousEventValue = 0;

      const loopEndsWithCount = new Map<number, number>();
      const loopNumbers: number[] = [];

      const refs: IRefs = {
        altPattern: null,
        altOffset: 0,
        altLength: 0,
        position: offset,
        original: -1,
      };

      let endFlag = false;

      if (usePitchBendSensitity) {
        //https://www.midikits.net/midi_analyser/pitch_bend.htm

        trackEventsSub[trackEventCountSub].type = 0xb0 | ((i / 4) & 0xf);
        trackEventsSub[trackEventCountSub].contentSize = 2;
        trackEventsSub[trackEventCountSub].contents = new Array(2);
        trackEventsSub[trackEventCountSub].contents![0] = 0x64;
        trackEventsSub[trackEventCountSub].contents![1] = 0x00;

        trackEventCountSub++;

        trackEventsSub[trackEventCountSub].type = 0xb0 | ((i / 4) & 0xf);
        trackEventsSub[trackEventCountSub].contentSize = 2;
        trackEventsSub[trackEventCountSub].contents = new Array(2);
        trackEventsSub[trackEventCountSub].contents![0] = 0x65;
        trackEventsSub[trackEventCountSub].contents![1] = 0x00;

        trackEventCountSub++;

        trackEventsSub[trackEventCountSub].type = 0xb0 | ((i / 4) & 0xf);
        trackEventsSub[trackEventCountSub].contentSize = 2;
        trackEventsSub[trackEventCountSub].contents = new Array(2);
        trackEventsSub[trackEventCountSub].contents![0] = 0x06;
        if (pitchBendSensitity > 0x18) pitchBendSensitity = 0x18;
        trackEventsSub[trackEventCountSub].contents![1] = pitchBendSensitity;

        trackEventCountSub++;

        trackEventsSub[trackEventCountSub].type = 0xb0 | ((i / 4) & 0xf);
        trackEventsSub[trackEventCountSub].contentSize = 2;
        trackEventsSub[trackEventCountSub].contents = new Array(2);
        trackEventsSub[trackEventCountSub].contents![0] = 0x64;
        trackEventsSub[trackEventCountSub].contents![1] = 0x7f;

        trackEventCountSub++;

        trackEventsSub[trackEventCountSub].type = 0xb0 | ((i / 4) & 0xf);
        trackEventsSub[trackEventCountSub].contentSize = 2;
        trackEventsSub[trackEventCountSub].contents = new Array(2);
        trackEventsSub[trackEventCountSub].contents![0] = 0x65;
        trackEventsSub[trackEventCountSub].contents![1] = 0x7f;

        trackEventCountSub++;
      }

      while (refs.position < inputSize && !endFlag) {
        if (extendTracksToHighest) {
          if (absoluteTime >= highestTrackLength) {
            trackEventsSub[trackEventCountSub].absoluteTime =
              highestTrackLength;
            trackEventsSub[trackEventCountSub].deltaTime =
              highestTrackLength - absoluteTime;

            trackEventsSub[trackEventCountSub].type = 0xff;
            trackEventsSub[trackEventCountSub].contentSize = 2;
            trackEventsSub[trackEventCountSub].contents = new Array(2);
            trackEventsSub[trackEventCountSub].contents![0] = 0x2f;
            trackEventsSub[trackEventCountSub].contents![1] = 0x0;

            trackEventCountSub++;

            endFlag = true;

            break;
          }
        }

        if (trackEventCountSub >= 0x30000) {
          for (
            let eventCount = 0;
            eventCount < trackEventCountSub;
            eventCount++
          ) {
            if (trackEventsSub[eventCount].contents != null) {
              trackEventsSub[eventCount].contents = null;
            }
          }

          // delete [] trackEventsSub;
          console.error("Overflow? trackEventCountSub >= 0x30000");
          return out;
        }

        let timePosition = refs.position;

        refs.original = -1;
        // trackEventsSub[trackEventCountSub].deltaTime is for loops
        let timeTag = _getVLBytes(inView, refs, true);

        if (extendTracksToHighest) {
          if (absoluteTime + timeTag > highestTrackLength) {
            trackEventsSub[trackEventCountSub].absoluteTime =
              highestTrackLength;
            trackEventsSub[trackEventCountSub].deltaTime =
              highestTrackLength - absoluteTime;

            trackEventsSub[trackEventCountSub].type = 0xff;
            trackEventsSub[trackEventCountSub].contentSize = 2;
            trackEventsSub[trackEventCountSub].contents = new Array(2);
            trackEventsSub[trackEventCountSub].contents![0] = 0x2f;
            trackEventsSub[trackEventCountSub].contents![1] = 0x0;

            trackEventCountSub++;

            endFlag = true;

            break;
          }
        }

        trackEventsSub[trackEventCountSub].deltaTime += timeTag;

        absoluteTime += timeTag;
        trackEventsSub[trackEventCountSub].absoluteTime = absoluteTime;

        let vlLength = 0;
        let eventVal = _readMidiByte(inView, refs, true);

        let statusBit = eventVal < 0x80;

        if (eventVal == 0xff || (statusBit && previousEventValue == 0xff)) {
          // meta event
          let subType;
          if (statusBit) subType = eventVal;
          else subType = _readMidiByte(inView, refs, true);

          if (subType == 0x51) {
            // tempo
            let microsecondsSinceQuarterNote =
              (((_readMidiByte(inView, refs, true) << 8) |
                _readMidiByte(inView, refs, true)) <<
                8) |
              _readMidiByte(inView, refs, true);

            trackEventsSub[trackEventCountSub].type = 0xff;
            trackEventsSub[trackEventCountSub].contentSize = 5;
            trackEventsSub[trackEventCountSub].contents = new Array(5);
            trackEventsSub[trackEventCountSub].contents![0] = 0x51;
            trackEventsSub[trackEventCountSub].contents![1] = 0x3;
            trackEventsSub[trackEventCountSub].contents![2] =
              (microsecondsSinceQuarterNote >> 16) & 0xff;
            trackEventsSub[trackEventCountSub].contents![3] =
              (microsecondsSinceQuarterNote >> 8) & 0xff;
            trackEventsSub[trackEventCountSub].contents![4] =
              (microsecondsSinceQuarterNote >> 0) & 0xff;

            trackEventCountSub++;

            const MICROSECONDS_PER_MINUTE = 60000000;
            let beatsPerMinute =
              MICROSECONDS_PER_MINUTE / microsecondsSinceQuarterNote; // float conversion
          } else if (subType == 0x2d) {
            // end loop
            let loopNumber = 0;
            if (loopNumbers.length > 0) {
              loopNumber = loopNumbers.pop()!;
            }

            // Fake loop end, controller 103
            trackEventsSub[trackEventCountSub].type = 0xb0 | ((i / 4) & 0xf);
            trackEventsSub[trackEventCountSub].contentSize = 2;
            trackEventsSub[trackEventCountSub].contents = new Array(2);
            trackEventsSub[trackEventCountSub].contents![0] = 103;
            trackEventsSub[trackEventCountSub].contents![1] = loopNumber;
            trackEventCountSub++;

            let loopCount = _readMidiByte(inView, refs, true);
            let currentLoopCount = _readMidiByte(inView, refs, true);
            let offsetToBeginningLoop =
              (((((_readMidiByte(inView, refs, false) << 8) |
                _readMidiByte(inView, refs, false)) <<
                8) |
                _readMidiByte(inView, refs, false)) <<
                8) |
              _readMidiByte(inView, refs, false);

            if (loopCount == 0xff || loopCount == 0x00) {
              hasLoopPoint = true;
              loopEnd = absoluteTime;

              if (extendTracksToHighest) {
                if (refs.altPattern === null) {
                  refs.position = refs.position - offsetToBeginningLoop;
                }
              }
            } else {
              let it = loopEndsWithCount.get(refs.position);
              if (loopEndsWithCount.has(refs.position)) {
                let countLeft = it!;

                if (countLeft == 0) {
                  loopEndsWithCount.delete(refs.position);
                } else {
                  loopEndsWithCount.set(refs.position, countLeft - 1);
                }
              } else {
                loopEndsWithCount.set(refs.position, loopCount - 1);
              }

              if (refs.altPattern === null) {
                refs.position = refs.position - offsetToBeginningLoop;
              } else {
                loopEndsWithCount.delete(refs.position);
              }
            }
          } else if (subType == 0x2e) {
            // start loop
            let loopNumber = _readMidiByte(inView, refs, true);
            let endLoop = _readMidiByte(inView, refs, true); // Always FF
            hasLoopPoint = true;
            loopStart = absoluteTime;

            // Fake loop start, controller 102
            trackEventsSub[trackEventCountSub].type = 0xb0 | ((i / 4) & 0xf);
            trackEventsSub[trackEventCountSub].contentSize = 2;
            trackEventsSub[trackEventCountSub].contents = new Array(2);
            trackEventsSub[trackEventCountSub].contents![0] = 102;
            trackEventsSub[trackEventCountSub].contents![1] = loopNumber;
            trackEventCountSub++;

            loopNumbers.push(loopNumber);
          } else if (subType == 0x2f) {
            trackEventsSub[trackEventCountSub].type = 0xff;
            trackEventsSub[trackEventCountSub].contentSize = 2;
            trackEventsSub[trackEventCountSub].contents = new Array(2);
            trackEventsSub[trackEventCountSub].contents![0] = 0x2f;
            trackEventsSub[trackEventCountSub].contents![1] = 0x0;

            trackEventCountSub++;

            endFlag = true;
          }

          if (!statusBit) previousEventValue = eventVal;
        } else if (
          (eventVal >= 0x90 && eventVal < 0xa0) ||
          (statusBit && previousEventValue >= 0x90 && previousEventValue < 0xa0)
        ) {
          let curEventVal;

          let noteNumber: number;
          if (statusBit) {
            trackEventsSub[trackEventCountSub].type = previousEventValue;
            noteNumber = eventVal;
            curEventVal = previousEventValue;
          } else {
            trackEventsSub[trackEventCountSub].type = eventVal;
            noteNumber = _readMidiByte(inView, refs, true);
            curEventVal = eventVal;
          }
          let velocity = _readMidiByte(inView, refs, true);

          let timeDuration = _getVLBytes(inView, refs, true);

          trackEventsSub[trackEventCountSub].durationTime = timeDuration; // to be filled in
          trackEventsSub[trackEventCountSub].contentSize = 2;
          trackEventsSub[trackEventCountSub].contents = new Array(2);
          trackEventsSub[trackEventCountSub].contents![0] = noteNumber;
          trackEventsSub[trackEventCountSub].contents![1] = velocity;

          trackEventCountSub++;

          if (!statusBit) previousEventValue = eventVal;
        } else if (
          (eventVal >= 0xb0 && eventVal < 0xc0) ||
          (statusBit && previousEventValue >= 0xb0 && previousEventValue < 0xc0)
        ) {
          // controller change
          let controllerTypeText = "";
          let controllerType;

          if (statusBit) {
            controllerType = eventVal;
            trackEventsSub[trackEventCountSub].type = previousEventValue;
          } else {
            controllerType = _readMidiByte(inView, refs, true);
            trackEventsSub[trackEventCountSub].type = eventVal;
          }
          let controllerValue = _readMidiByte(inView, refs, true);

          trackEventsSub[trackEventCountSub].contentSize = 2;
          trackEventsSub[trackEventCountSub].contents = new Array(2);
          trackEventsSub[trackEventCountSub].contents![0] = controllerType;
          trackEventsSub[trackEventCountSub].contents![1] = controllerValue;

          trackEventCountSub++;

          if (!statusBit) previousEventValue = eventVal;
        } else if (
          (eventVal >= 0xc0 && eventVal < 0xd0) ||
          (statusBit && previousEventValue >= 0xc0 && previousEventValue < 0xd0)
        ) {
          // change instrument
          let instrument;
          if (statusBit) {
            instrument = eventVal;
            trackEventsSub[trackEventCountSub].type = previousEventValue;
          } else {
            instrument = _readMidiByte(inView, refs, true);
            trackEventsSub[trackEventCountSub].type = eventVal;
          }

          trackEventsSub[trackEventCountSub].contentSize = 1;
          trackEventsSub[trackEventCountSub].contents = [instrument];
          if (instrument >= numInstruments) {
            numInstruments = instrument + 1;
          }

          trackEventCountSub++;

          if (!statusBit) previousEventValue = eventVal;
        } else if (
          (eventVal >= 0xd0 && eventVal < 0xe0) ||
          (statusBit && previousEventValue >= 0xd0 && previousEventValue < 0xe0)
        ) {
          // channel aftertouch
          let amount;
          if (statusBit) {
            amount = eventVal;
            trackEventsSub[trackEventCountSub].type = previousEventValue;
          } else {
            amount = _readMidiByte(inView, refs, true);
            trackEventsSub[trackEventCountSub].type = eventVal;
          }

          trackEventsSub[trackEventCountSub].contentSize = 1;
          trackEventsSub[trackEventCountSub].contents = [amount];

          trackEventCountSub++;

          if (!statusBit) previousEventValue = eventVal;
        } else if (
          (eventVal >= 0xe0 && eventVal < 0xf0) ||
          (statusBit && previousEventValue >= 0xe0 && previousEventValue < 0xf0)
        ) {
          // pitch bend
          let valueLSB;
          if (statusBit) {
            valueLSB = eventVal;
            trackEventsSub[trackEventCountSub].type = previousEventValue;
          } else {
            valueLSB = _readMidiByte(inView, refs, true);
            trackEventsSub[trackEventCountSub].type = eventVal;
          }

          let valueMSB = _readMidiByte(inView, refs, true);

          trackEventsSub[trackEventCountSub].contentSize = 2;
          trackEventsSub[trackEventCountSub].contents = [valueLSB, valueMSB];

          trackEventCountSub++;

          if (!statusBit) previousEventValue = eventVal;
        } else if (eventVal == 0xfe) {
          // repeat operation
          // should not be here...
          // no prev event set
        } else {
          console.error(`${eventVal} ERROR MISSING PARSE OF TYPE`);
        }
      }

      for (let eventCount = 0; eventCount < trackEventCountSub; eventCount++) {
        if (trackEventCountSub >= 0x30000) {
          for (
            let eventCount = 0;
            eventCount < trackEventCountSub;
            eventCount++
          ) {
            if (trackEventsSub[eventCount].contents !== null) {
              //delete [] trackEventsSub[eventCount].contents;
              trackEventsSub[eventCount].contents = null;
            }
          }

          //delete [] trackEventsSub;
          console.error("Overflow 2? trackEventCountSub >= 0x30000");
          return out;
        }

        let trackEvent = trackEventsSub[eventCount];
        if (trackEvent.type >= 0x90 && trackEvent.type < 0xa0) {
          // need to split out
          if (trackEvent.durationTime > 0) {
            let shutoffTime = trackEvent.absoluteTime + trackEvent.durationTime;
            if (eventCount != trackEventCountSub - 1) {
              for (let e = eventCount + 1; e < trackEventCountSub; e++) {
                if (
                  trackEventsSub[e].absoluteTime >= shutoffTime &&
                  e != trackEventCountSub - 1
                ) {
                  for (let j = trackEventCountSub - 1; j >= e; j--) {
                    trackEventsSub[j + 1].absoluteTime =
                      trackEventsSub[j].absoluteTime;
                    trackEventsSub[j + 1].contentSize =
                      trackEventsSub[j].contentSize;
                    if (trackEventsSub[j + 1].contents !== null) {
                      //delete [] trackEventsSub[j+1].contents;
                      trackEventsSub[j + 1].contents = null;
                    }
                    trackEventsSub[j + 1].contents = new Array(
                      trackEventsSub[j].contentSize
                    );
                    for (let r = 0; r < trackEventsSub[j].contentSize; r++) {
                      trackEventsSub[j + 1].contents![r] =
                        trackEventsSub[j].contents![r];
                    }
                    trackEventsSub[j + 1].deltaTime =
                      trackEventsSub[j].deltaTime;
                    trackEventsSub[j + 1].durationTime =
                      trackEventsSub[j].durationTime;
                    trackEventsSub[j + 1].obsoleteEvent =
                      trackEventsSub[j].obsoleteEvent;
                    trackEventsSub[j + 1].type = trackEventsSub[j].type;
                  }

                  trackEventsSub[e].type = trackEventsSub[eventCount].type;
                  trackEventsSub[e].absoluteTime = shutoffTime;
                  trackEventsSub[e].deltaTime =
                    trackEventsSub[e].absoluteTime -
                    trackEventsSub[e - 1].absoluteTime;
                  trackEventsSub[e].contentSize =
                    trackEventsSub[eventCount].contentSize;
                  trackEventsSub[e].durationTime = 0;

                  trackEventsSub[e].contents = new Array(
                    trackEventsSub[e].contentSize
                  );
                  trackEventsSub[e].contents![0] =
                    trackEventsSub[eventCount].contents![0];
                  trackEventsSub[e].contents![1] = 0;

                  trackEventsSub[e + 1].deltaTime =
                    trackEventsSub[e + 1].absoluteTime -
                    trackEventsSub[e].absoluteTime;

                  if (trackEventsSub[e].deltaTime > 0xff000000) {
                    let a = 1;
                  }

                  trackEventCountSub++;
                  break;
                } else if (e == trackEventCountSub - 1) {
                  trackEventsSub[e + 1].absoluteTime = shutoffTime; // move end to end
                  trackEventsSub[e + 1].contentSize =
                    trackEventsSub[e].contentSize;
                  if (trackEventsSub[e + 1].contents !== null) {
                    trackEventsSub[e + 1].contents = null;
                  }
                  trackEventsSub[e + 1].contents = new Array(
                    trackEventsSub[e].contentSize
                  );
                  for (let r = 0; r < trackEventsSub[e].contentSize; r++) {
                    trackEventsSub[e + 1].contents![r] =
                      trackEventsSub[e].contents![r];
                  }
                  trackEventsSub[e + 1].deltaTime = trackEventsSub[e].deltaTime;
                  trackEventsSub[e + 1].durationTime =
                    trackEventsSub[e].durationTime;
                  trackEventsSub[e + 1].obsoleteEvent =
                    trackEventsSub[e].obsoleteEvent;
                  trackEventsSub[e + 1].type = trackEventsSub[e].type;

                  trackEventsSub[e].type = trackEventsSub[eventCount].type;
                  trackEventsSub[e].absoluteTime = shutoffTime;
                  trackEventsSub[e].deltaTime =
                    trackEventsSub[e].absoluteTime -
                    trackEventsSub[e - 1].absoluteTime;
                  trackEventsSub[e].contentSize =
                    trackEventsSub[eventCount].contentSize;
                  trackEventsSub[e].durationTime = 0;

                  trackEventsSub[e].contents = new Array(
                    trackEventsSub[e].contentSize
                  );
                  trackEventsSub[e].contents![0] =
                    trackEventsSub[eventCount].contents![0];
                  trackEventsSub[e].contents![1] = 0;

                  trackEventsSub[e + 1].deltaTime =
                    trackEventsSub[e + 1].absoluteTime -
                    trackEventsSub[e].absoluteTime;

                  trackEventCountSub++;
                  break;
                }
              }
            } else {
              trackEventsSub[eventCount + 1].absoluteTime = shutoffTime; // move end to end
              trackEventsSub[eventCount + 1].contentSize =
                trackEventsSub[eventCount].contentSize;
              if (trackEventsSub[eventCount + 1].contents !== null) {
                //delete [] trackEventsSub[eventCount+1].contents;
                trackEventsSub[eventCount + 1].contents = null;
              }
              trackEventsSub[eventCount + 1].contents = new Array(
                trackEventsSub[eventCount].contentSize
              );
              for (let r = 0; r < trackEventsSub[eventCount].contentSize; r++) {
                trackEventsSub[eventCount + 1].contents![r] =
                  trackEventsSub[eventCount].contents![r];
              }
              trackEventsSub[eventCount + 1].deltaTime =
                trackEventsSub[eventCount].deltaTime;
              trackEventsSub[eventCount + 1].durationTime =
                trackEventsSub[eventCount].durationTime;
              trackEventsSub[eventCount + 1].obsoleteEvent =
                trackEventsSub[eventCount].obsoleteEvent;
              trackEventsSub[eventCount + 1].type =
                trackEventsSub[eventCount].type;

              trackEventsSub[eventCount].type = trackEventsSub[eventCount].type;
              trackEventsSub[eventCount].absoluteTime = shutoffTime;
              if (
                trackEventsSub[eventCount].absoluteTime -
                  trackEventsSub[eventCount - 1].absoluteTime >
                0xff000000
              ) {
                let a = 1;
              }
              trackEventsSub[eventCount].deltaTime =
                trackEventsSub[eventCount].absoluteTime -
                trackEventsSub[eventCount - 1].absoluteTime;
              trackEventsSub[eventCount].contentSize =
                trackEventsSub[eventCount].contentSize;
              trackEventsSub[eventCount].durationTime = 0;
              trackEventsSub[eventCount].contents = new Array(
                trackEventsSub[eventCount].contentSize
              );
              trackEventsSub[eventCount].contents![0] =
                trackEventsSub[eventCount].contents![0];
              trackEventsSub[eventCount].contents![1] = 0;

              trackEventsSub[eventCount + 1].deltaTime =
                trackEventsSub[eventCount + 1].absoluteTime -
                trackEventsSub[eventCount].absoluteTime;
              if (trackEventsSub[eventCount].deltaTime > 0xff000000) {
                let a = 1;
              }
              trackEventCountSub++;
            }
          }
        }
      }

      let timeOffset = 0;

      let sizeData = 0;
      let previousTrackEvent = 0x0;

      for (let j = 0; j < trackEventCountSub; j++) {
        let trackEvent = trackEventsSub[j];
        if (trackEvent.obsoleteEvent) {
          timeOffset += trackEvent.deltaTime;
        } else {
          let [timeDelta, lengthTimeDelta] = _returnVLBytes(
            trackEvent.deltaTime + timeOffset
          );
          timeOffset = 0;

          sizeData += lengthTimeDelta;

          if (
            trackEvent.type !== previousTrackEvent ||
            trackEvent.type === 0xff
          ) {
            sizeData += 1;
          }

          sizeData += trackEvent.contentSize;

          previousTrackEvent = trackEvent.type;
        }
      }

      outView.setUint32(outPos, sizeData);
      outPos += 4;

      timeOffset = 0;
      previousTrackEvent = 0x0;
      for (let eventCount = 0; eventCount < trackEventCountSub; eventCount++) {
        let trackEvent = trackEventsSub[eventCount];

        if (trackEvent.obsoleteEvent) {
          timeOffset += trackEvent.deltaTime;
        } else {
          let [timeDelta, lengthTimeDelta] = _returnVLBytes(
            trackEvent.deltaTime + timeOffset
          );
          timeOffset = 0;
          outPos = _writeVLBytes(
            outView,
            outPos,
            timeDelta,
            lengthTimeDelta,
            true
          );

          if (
            trackEvent.type != previousTrackEvent ||
            trackEvent.type == 0xff
          ) {
            outView.setUint8(outPos, trackEvent.type);
            outPos++;
          }

          for (let z = 0; z < trackEvent.contentSize; z++) {
            outView.setUint8(outPos, trackEvent.contents![z]);
            outPos++;
          }

          previousTrackEvent = trackEvent.type;
        }
      }
    } else {
    }

    for (let eventCount = 0; eventCount < trackEventCountSub; eventCount++) {
      if (trackEventsSub[eventCount].contents !== null) {
        // delete [] trackEventsSub[eventCount].contents;
        trackEventsSub[eventCount].contents = null;
      }
    }

    counterTrack++;

    //delete [] trackEventsSub;
  }

  return out.slice(0, outPos);
}

interface ICreateGameMidiOptions {
  loop?: boolean;
}

/**
 * Converts a normal midi file to a midi that can be put in the game.
 *
 * https://github.com/derselbst/N64SoundTools/blob/master/N64MidiTool/N64MidiLibrary/MidiParse.cpp#L12837
 *
 * @param midiFile Normal midi file.
 */
export function createGameMidi(
  midiFile: ArrayBuffer,
  options?: ICreateGameMidiOptions
): ArrayBuffer | null {
  const loop = options?.loop || false;
  const loopPoint = 0;
  const useRepeaters = false;

  let trackEventCount: number[] = [];
  let trackEvents: TrackEvent[][] = [];
  for (let x = 0; x < 32; x++) {
    trackEvents.push([]);
    trackEventCount.push(0);
  }

  const dataView = new DataView(midiFile);

  if (dataView.getUint32(0) !== MIDI_HEADER_MAGIC) {
    return null;
  }

  const headerLength = dataView.getUint32(4);
  const type = dataView.getUint16(8);
  let numTracks = dataView.getUint16(10);
  const tempo = dataView.getUint16(12);

  if (numTracks > 16) {
    console.log("Too many tracks, truncating to 16.");
    numTracks = 16;
  }

  if (type !== 0 && type !== 1) {
    console.log("Invalid midi type");
    return null;
  }

  let refs: IRefs = {
    altPattern: null,
    altOffset: 0,
    altLength: 0,
    position: 0xe,
    original: 0,
  };
  let unknownsHit = false;

  let highestAbsoluteTime = 0;
  let highestAbsoluteTimeByTrack = [];
  for (let x = 0; x < 16; x++) {
    highestAbsoluteTimeByTrack[x] = 0;
  }

  for (let trackNum = 0; trackNum < numTracks; trackNum++) {
    let absoluteTime = 0;

    if (dataView.getUint32(refs.position) !== MIDI_TRACK_MAGIC) {
      console.log("Invalid track midi header");
      return null;
    }

    const trackLength = dataView.getUint32(refs.position + 4);
    refs.position += 8;

    let previousEventValue = 0xff;
    let endFlag = false;

    while (!endFlag && refs.position < midiFile.byteLength) {
      refs.original = 0;
      let timeTag = _getVLBytes(dataView, refs, false);
      absoluteTime += timeTag;

      let eventVal = _readMidiByte(dataView, refs, false);
      let statusBit = eventVal <= 0x7f ? true : false;

      if (eventVal === 0xff) {
        // meta event.
        let subType = _readMidiByte(dataView, refs, false);

        if (subType === 0x2f) {
          // End of Track Event.
          absoluteTime -= timeTag;
          endFlag = true;
          let length = _readMidiByte(dataView, refs, false); // end 00 in real mid
        } else if (subType === 0x51) {
          // Set Tempo Event.
          let length = _readMidiByte(dataView, refs, false);
          _readMidiByte(dataView, refs, false);
          _readMidiByte(dataView, refs, false);
          _readMidiByte(dataView, refs, false);
        } else if (subType < 0x7f && !(subType === 0x51 || subType === 0x2f)) {
          // Various Unused Meta Events.
          let length = _getVLBytes(dataView, refs, false); // Was _readMidiByte in Subdrag code.
          for (let i = 0; i < length; i++) {
            _readMidiByte(dataView, refs, false);
          }
        } else if (subType === 0x7f) {
          // Unused Sequencer Specific Event
          let length = _getVLBytes(dataView, refs, false);
          for (let i = 0; i < length; i++) {
            _readMidiByte(dataView, refs, false);
          }
        }

        previousEventValue = eventVal;
      } else if (
        (eventVal >= 0x80 && eventVal < 0x90) ||
        (statusBit && previousEventValue >= 0x80 && previousEventValue < 0x90)
      ) {
        let curEventVal;
        let noteNumber;
        if (statusBit) {
          noteNumber = eventVal;
          curEventVal = previousEventValue;
        } else {
          noteNumber = _readMidiByte(dataView, refs, false);
          curEventVal = eventVal;
        }
        let velocity = _readMidiByte(dataView, refs, false);
        if (!statusBit) {
          previousEventValue = eventVal;
        }
      } else if (
        (eventVal >= 0x90 && eventVal < 0xa0) ||
        (statusBit && previousEventValue >= 0x90 && previousEventValue < 0xa0)
      ) {
        let curEventVal;
        let noteNumber;
        if (statusBit) {
          noteNumber = eventVal;
          curEventVal = previousEventValue;
        } else {
          noteNumber = _readMidiByte(dataView, refs, false);
          curEventVal = eventVal;
        }
        let velocity = _readMidiByte(dataView, refs, false);
        if (!statusBit) previousEventValue = eventVal;
      } else if (
        (eventVal >= 0xb0 && eventVal < 0xc0) ||
        (statusBit && previousEventValue >= 0xb0 && previousEventValue < 0xc0)
      ) {
        // controller change
        let controllerType;
        if (statusBit) {
          controllerType = eventVal;
        } else {
          controllerType = _readMidiByte(dataView, refs, false);
        }
        let controllerValue = _readMidiByte(dataView, refs, false);
        if (!statusBit) previousEventValue = eventVal;
      } else if (
        (eventVal >= 0xc0 && eventVal < 0xd0) ||
        (statusBit && previousEventValue >= 0xc0 && previousEventValue < 0xd0)
      ) {
        // change instrument
        let instrument;
        if (statusBit) {
          instrument = eventVal;
        } else {
          instrument = _readMidiByte(dataView, refs, false);
        }

        if (!statusBit) previousEventValue = eventVal;
      } else if (
        (eventVal >= 0xd0 && eventVal < 0xe0) ||
        (statusBit && previousEventValue >= 0xd0 && previousEventValue < 0xe0)
      ) {
        // channel aftertouch
        let amount;
        if (statusBit) {
          amount = eventVal;
        } else {
          amount = _readMidiByte(dataView, refs, false);
        }

        if (!statusBit) previousEventValue = eventVal;
      } else if (
        (eventVal >= 0xe0 && eventVal < 0xf0) ||
        (statusBit && previousEventValue >= 0xe0 && previousEventValue < 0xf0)
      ) {
        // pitch bend
        let valueLSB;
        if (statusBit) {
          valueLSB = eventVal;
        } else {
          valueLSB = _readMidiByte(dataView, refs, false);
        }
        let valueMSB = _readMidiByte(dataView, refs, false);
        if (!statusBit) previousEventValue = eventVal;
      } else if (eventVal == 0xf0 || eventVal == 0xf7) {
        let length = _getVLBytes(dataView, refs, false);
        // subtract length
        for (let i = 0; i < length; i++) {
          _readMidiByte(dataView, refs, false);
        }
      } else {
        if (!unknownsHit) {
          console.warn("Invalid midi character found");
          unknownsHit = true;
        }
      }
    }

    if (absoluteTime > highestAbsoluteTime) {
      highestAbsoluteTime = absoluteTime;
    }
    if (absoluteTime > highestAbsoluteTimeByTrack[trackNum]) {
      highestAbsoluteTimeByTrack[trackNum] = absoluteTime;
    }
  }

  refs = {
    altPattern: null,
    altOffset: 0,
    altLength: 0,
    position: 0xe,
    original: 0,
  };

  for (let trackNum = 0; trackNum < numTracks; trackNum++) {
    let absoluteTime = 0;
    if (dataView.getUint32(refs.position) !== MIDI_TRACK_MAGIC) {
      console.log("Invalid track midi header");
      return null;
    }

    const trackLength = dataView.getUint32(refs.position + 4);
    refs.position += 8;

    let previousEventValue = 0xff;
    let endFlag = false;
    let didLoop = false;

    if (loop && loopPoint === 0 && highestAbsoluteTimeByTrack[trackNum] > 0) {
      const newTrackEvent = (trackEvents[trackNum][trackEventCount[trackNum]] =
        new TrackEvent());
      newTrackEvent.type = 0xff;
      newTrackEvent.absoluteTime = 0;
      newTrackEvent.contentSize = 3;
      newTrackEvent.contents = [0x2e, 0x00, 0xff];
      newTrackEvent.deltaTime = 0;
      newTrackEvent.obsoleteEvent = false;

      trackEventCount[trackNum]++;
      didLoop = true;
    }

    while (!endFlag && refs.position < midiFile.byteLength) {
      refs.original = 0;
      let timeTag = _getVLBytes(dataView, refs, false);
      absoluteTime += timeTag;

      let newTrackEvent = (trackEvents[trackNum][trackEventCount[trackNum]] =
        new TrackEvent());
      newTrackEvent.deltaTime = timeTag;
      newTrackEvent.obsoleteEvent = false;
      newTrackEvent.contents = null;
      newTrackEvent.absoluteTime = absoluteTime;

      if (
        loop &&
        !didLoop &&
        highestAbsoluteTimeByTrack[trackNum] > loopPoint
      ) {
        if (absoluteTime == loopPoint) {
          newTrackEvent.type = 0xff;
          newTrackEvent.absoluteTime = absoluteTime;
          newTrackEvent.contentSize = 3;
          newTrackEvent.contents = [0x2e, 0x00, 0xff];
          newTrackEvent.deltaTime = timeTag;
          newTrackEvent.obsoleteEvent = false;

          trackEventCount[trackNum]++;

          newTrackEvent = trackEvents[trackNum][trackEventCount[trackNum]] =
            new TrackEvent();
          newTrackEvent.deltaTime = timeTag;
          newTrackEvent.obsoleteEvent = false;
          newTrackEvent.contents = null;
          newTrackEvent.absoluteTime = absoluteTime;

          didLoop = true;
        } else if (absoluteTime > loopPoint) {
          newTrackEvent.type = 0xff;
          newTrackEvent.absoluteTime = loopPoint;
          newTrackEvent.contentSize = 3;
          newTrackEvent.contents = [0x2e, 0x00, 0xff];
          if (trackEventCount[trackNum] > 0)
            newTrackEvent.deltaTime =
              loopPoint -
              trackEvents[trackNum][trackEventCount[trackNum] - 1].absoluteTime;
          else newTrackEvent.deltaTime = loopPoint;
          newTrackEvent.obsoleteEvent = false;

          trackEventCount[trackNum]++;

          newTrackEvent = trackEvents[trackNum][trackEventCount[trackNum]] =
            new TrackEvent();
          newTrackEvent.deltaTime = absoluteTime - loopPoint;
          newTrackEvent.obsoleteEvent = false;
          newTrackEvent.contents = null;
          newTrackEvent.absoluteTime = absoluteTime;

          didLoop = true;
        }
      }

      let eventVal = _readMidiByte(dataView, refs, false);
      let statusBit = eventVal <= 0x7f ? true : false;
      if (eventVal === 0xff) {
        let subType = _readMidiByte(dataView, refs, false);
        if (subType === 0x2f) {
          endFlag = true;
          if (loop && highestAbsoluteTimeByTrack[trackNum] > loopPoint) {
            let prevEvent =
              trackEvents[trackNum][trackEventCount[trackNum] - 1];
            if (
              prevEvent.type === 0xff &&
              prevEvent.contentSize > 0 &&
              prevEvent.contents![0] === 0x2e
            ) {
              newTrackEvent = prevEvent;
              newTrackEvent.type = 0xff;
              newTrackEvent.contentSize = 1;
              newTrackEvent.contents = [0x2f];
            } else {
              let newTrackEventLast = (trackEvents[trackNum][
                trackEventCount[trackNum] + 1
              ] = new TrackEvent());
              newTrackEventLast.absoluteTime = highestAbsoluteTime;
              newTrackEventLast.deltaTime = 0;
              newTrackEventLast.durationTime = newTrackEvent.durationTime;
              newTrackEventLast.obsoleteEvent = newTrackEvent.obsoleteEvent;

              newTrackEventLast.type = 0xff;
              newTrackEventLast.contentSize = 1;
              newTrackEventLast.contents = [0x2f];

              newTrackEvent.type = 0xff;
              if (
                highestAbsoluteTime >
                prevEvent.absoluteTime + prevEvent.durationTime
              ) {
                newTrackEvent.deltaTime =
                  highestAbsoluteTime -
                  (prevEvent.absoluteTime + prevEvent.durationTime);
                newTrackEvent.absoluteTime = highestAbsoluteTime;
              } else {
                newTrackEvent.deltaTime = 0;
                newTrackEvent.absoluteTime = prevEvent.absoluteTime;
              }

              newTrackEvent.contentSize = 7;
              newTrackEvent.contents = [
                0x2d,
                0xff,
                0xff,
                0x0, // todo write location
                0x0,
                0x0,
                0x0,
              ];
              newTrackEvent.obsoleteEvent = false;

              trackEventCount[trackNum]++;
            }
          } else {
            newTrackEvent.type = 0xff;
            newTrackEvent.contentSize = 1;
            newTrackEvent.contents = [0x2f];
          }

          let length = _readMidiByte(dataView, refs, false); // end 00 in real midi
        } else if (subType === 0x51) {
          let length = _readMidiByte(dataView, refs, false);

          newTrackEvent.type = 0xff;
          newTrackEvent.contentSize = 4;
          newTrackEvent.contents = [
            0x51,
            _readMidiByte(dataView, refs, false),
            _readMidiByte(dataView, refs, false),
            _readMidiByte(dataView, refs, false),
          ];
        } else if (subType < 0x7f && !(subType == 0x51 || subType == 0x2f)) {
          newTrackEvent.type = 0xff;
          let length = _getVLBytes(dataView, refs, false); // Was _readMidiByte in Subdrag code.
          for (let i = 0; i < length; i++) {
            _readMidiByte(dataView, refs, false);
          }
          newTrackEvent.obsoleteEvent = true;
        } else if (subType === 0x7f) {
          // Unused sequencer specific event.
          newTrackEvent.type = 0xff;
          let length = _getVLBytes(dataView, refs, false);
          for (let i = 0; i < length; i++) {
            _readMidiByte(dataView, refs, false);
          }
          newTrackEvent.obsoleteEvent = true;
        }

        previousEventValue = eventVal;
      } else if (
        (eventVal >= 0x80 && eventVal < 0x90) ||
        (statusBit && previousEventValue >= 0x80 && previousEventValue < 0x90)
      ) {
        let curEventVal;
        let noteNumber;
        if (statusBit) {
          newTrackEvent.type = previousEventValue;
          noteNumber = eventVal;
          curEventVal = previousEventValue;
        } else {
          newTrackEvent.type = eventVal;
          noteNumber = _readMidiByte(dataView, refs, false);
          curEventVal = eventVal;
        }
        let velocity = _readMidiByte(dataView, refs, false);

        for (
          let testBackwards = trackEventCount[trackNum] - 1;
          testBackwards >= 0;
          testBackwards--
        ) {
          if (
            trackEvents[trackNum][testBackwards].type ==
              (0x90 | (curEventVal & 0xf)) &&
            !trackEvents[trackNum][testBackwards].obsoleteEvent
          ) {
            if (
              trackEvents[trackNum][testBackwards].contents![0] == noteNumber
            ) {
              trackEvents[trackNum][testBackwards].durationTime =
                absoluteTime -
                trackEvents[trackNum][testBackwards].absoluteTime;
              break;
            }
          }
        }

        newTrackEvent.durationTime = 0;
        newTrackEvent.contentSize = 2;
        newTrackEvent.contents = [noteNumber, velocity];
        newTrackEvent.obsoleteEvent = true;

        if (!statusBit) previousEventValue = eventVal;
      } else if (
        (eventVal >= 0x90 && eventVal < 0xa0) ||
        (statusBit && previousEventValue >= 0x90 && previousEventValue < 0xa0)
      ) {
        let curEventVal;
        let noteNumber;
        if (statusBit) {
          newTrackEvent.type = previousEventValue;
          noteNumber = eventVal;
          curEventVal = previousEventValue;
        } else {
          newTrackEvent.type = eventVal;
          noteNumber = _readMidiByte(dataView, refs, false);
          curEventVal = eventVal;
        }
        let velocity = _readMidiByte(dataView, refs, false);

        if (velocity === 0) {
          // simulate note off
          for (
            let testBackwards = trackEventCount[trackNum] - 1;
            testBackwards >= 0;
            testBackwards--
          ) {
            if (
              trackEvents[trackNum][testBackwards].type == curEventVal &&
              !trackEvents[trackNum][testBackwards].obsoleteEvent
            ) {
              if (
                trackEvents[trackNum][testBackwards].contents![0] == noteNumber
              ) {
                trackEvents[trackNum][testBackwards].durationTime =
                  absoluteTime -
                  trackEvents[trackNum][testBackwards].absoluteTime;
                break;
              }
            }
          }

          newTrackEvent.durationTime = 0;
          newTrackEvent.contentSize = 2;
          newTrackEvent.contents = [noteNumber, velocity];
          newTrackEvent.obsoleteEvent = true;
        } else {
          // check if no note off received, if so, turn it off and restart note
          for (
            let testBackwards = trackEventCount[trackNum] - 1;
            testBackwards >= 0;
            testBackwards--
          ) {
            if (
              trackEvents[trackNum][testBackwards].type == curEventVal &&
              !trackEvents[trackNum][testBackwards].obsoleteEvent
            ) {
              if (
                trackEvents[trackNum][testBackwards].contents![0] == noteNumber
              ) {
                if (trackEvents[trackNum][testBackwards].durationTime == 0)
                  // means unfinished note
                  trackEvents[trackNum][testBackwards].durationTime =
                    absoluteTime -
                    trackEvents[trackNum][testBackwards].absoluteTime;
                break;
              }
            }
          }

          newTrackEvent.durationTime = 0; // to be filled in
          newTrackEvent.contentSize = 2;
          newTrackEvent.contents = [noteNumber, velocity];
        }

        if (!statusBit) previousEventValue = eventVal;
      } else if (
        (eventVal >= 0xb0 && eventVal < 0xc0) ||
        (statusBit && previousEventValue >= 0xb0 && previousEventValue < 0xc0)
      ) {
        // controller change
        let controllerType;
        if (statusBit) {
          controllerType = eventVal;
          newTrackEvent.type = previousEventValue;
        } else {
          controllerType = _readMidiByte(dataView, refs, false);
          newTrackEvent.type = eventVal;
        }

        let controllerValue = _readMidiByte(dataView, refs, false);

        newTrackEvent.contentSize = 2;
        newTrackEvent.contents = [controllerType, controllerValue];

        if (!statusBit) previousEventValue = eventVal;
      } else if (
        (eventVal >= 0xc0 && eventVal < 0xd0) ||
        (statusBit && previousEventValue >= 0xc0 && previousEventValue < 0xd0)
      ) {
        // change instrument
        let instrument;
        if (statusBit) {
          instrument = eventVal;
          newTrackEvent.type = previousEventValue;
        } else {
          instrument = _readMidiByte(dataView, refs, false);
          newTrackEvent.type = eventVal;
        }

        if ((eventVal & 0xf) === 9)
          // Drums in GM
          instrument = instrument;
        else instrument = instrument;

        newTrackEvent.contentSize = 1;
        newTrackEvent.contents = [instrument];

        if (!statusBit) previousEventValue = eventVal;
      } else if (
        (eventVal >= 0xd0 && eventVal < 0xe0) ||
        (statusBit && previousEventValue >= 0xd0 && previousEventValue < 0xe0)
      ) {
        // channel aftertouch
        newTrackEvent.type = eventVal;
        let amount;
        if (statusBit) {
          amount = eventVal;
          newTrackEvent.type = previousEventValue;
        } else {
          amount = _readMidiByte(dataView, refs, false);
          newTrackEvent.type = eventVal;
        }

        newTrackEvent.contentSize = 1;
        newTrackEvent.contents = [amount];
        //newTrackEvent.obsoleteEvent = true; // temporary?

        if (!statusBit) previousEventValue = eventVal;
      } else if (
        (eventVal >= 0xe0 && eventVal < 0xf0) ||
        (statusBit && previousEventValue >= 0xe0 && previousEventValue < 0xf0)
      ) {
        // pitch bend
        newTrackEvent.type = eventVal;
        let valueLSB;
        if (statusBit) {
          valueLSB = eventVal;
          newTrackEvent.type = previousEventValue;
        } else {
          valueLSB = _readMidiByte(dataView, refs, false);
          newTrackEvent.type = eventVal;
        }

        let valueMSB = _readMidiByte(dataView, refs, false);

        newTrackEvent.contentSize = 2;
        newTrackEvent.contents = [valueLSB, valueMSB];
        //newTrackEvent.obsoleteEvent = true; // temporary?

        if (!statusBit) previousEventValue = eventVal;
      } else if (eventVal == 0xf0 || eventVal == 0xf7) {
        newTrackEvent.type = eventVal;
        let length = _getVLBytes(dataView, refs, false);
        // subtract length
        for (let i = 0; i < length; i++) {
          _readMidiByte(dataView, refs, false);
        }

        newTrackEvent.obsoleteEvent = true;
      } else {
        if (!unknownsHit) {
          console.error("Invalid midi character found");
          unknownsHit = true;
        }
      }

      trackEventCount[trackNum]++;
    }
  }

  let outFile = new ArrayBuffer(0x100000); // TOOD: What size?
  let outView = new DataView(outFile);
  let outPos = 0;

  let timeOffset = 0;
  let startPosition = 0x44;
  for (let i = 0; i < numTracks; i++) {
    let sizeData = 0;
    let loopStartPosition = 0;
    let foundLoopStart = false;
    let previousTrackEvent = 0;

    if (trackEventCount[i] > 0) {
      outView.setUint32(outPos, startPosition);
      outPos += 4;

      for (let j = 0; j < trackEventCount[i]; j++) {
        const trackEvent = trackEvents[i][j];
        let [timeDelta, lengthTimeDelta] = _returnVLBytes(
          trackEvent.deltaTime + timeOffset
        );

        if (trackEvent.obsoleteEvent) {
          timeOffset += trackEvent.deltaTime;
        } else {
          if (trackEvent.type === 0xff && trackEvent.contents![0] === 0x2e) {
            foundLoopStart = true;
            loopStartPosition =
              startPosition +
              sizeData +
              1 +
              trackEvent.contentSize +
              lengthTimeDelta;
          }

          timeOffset = 0;
          sizeData += lengthTimeDelta;

          if (trackEvent.type === 0xff && trackEvent.contents![0] === 0x2d) {
            let offsetBack = startPosition + sizeData - loopStartPosition + 8;
            trackEvent.contents![3] = (offsetBack >> 24) & 0xff;
            trackEvent.contents![4] = (offsetBack >> 16) & 0xff;
            trackEvent.contents![5] = (offsetBack >> 8) & 0xff;
            trackEvent.contents![6] = (offsetBack >> 0) & 0xff;
          }

          if (
            trackEvent.type !== previousTrackEvent ||
            trackEvent.type === 0xff
          ) {
            sizeData += 1;
          }

          sizeData += trackEvent.contentSize;

          if (trackEvent.type >= 0x90 && trackEvent.type < 0xa0) {
            let [duration, lengthDurationBytes] = _returnVLBytes(
              trackEvent.durationTime
            );

            sizeData += lengthDurationBytes;
          }

          previousTrackEvent = trackEvent.type;
        }
      }
      startPosition += sizeData;
    } else {
      outView.setUint32(outPos, 0);
      outPos += 4;
    }
  }

  for (let i = numTracks; i < 16; i++) {
    outView.setUint32(outPos, 0);
    outPos += 4;
  }

  outView.setUint32(outPos, tempo);
  outPos += 4;

  for (let i = 0; i < numTracks; i++) {
    if (trackEventCount[i] > 0) {
      let previousTrackEvent = 0;
      for (let j = 0; j < trackEventCount[i]; j++) {
        let trackEvent = trackEvents[i][j];
        if (trackEvent.obsoleteEvent) {
          timeOffset += trackEvent.deltaTime;
        } else {
          let [timeDelta, lengthTimeDelta] = _returnVLBytes(
            trackEvent.deltaTime + timeOffset
          );
          timeOffset = 0;
          outPos = _writeVLBytes(
            outView,
            outPos,
            timeDelta,
            lengthTimeDelta,
            false
          );

          if (
            trackEvent.type !== previousTrackEvent ||
            trackEvent.type === 0xff
          ) {
            outView.setUint8(outPos, trackEvent.type);
            outPos++;
          }

          copyRange(
            outView,
            trackEvent.contents!,
            outPos,
            0,
            trackEvent.contentSize
          );
          outPos += trackEvent.contentSize;

          if (trackEvent.type >= 0x90 && trackEvent.type < 0xa0) {
            let [duration, lengthDurationBytes] = _returnVLBytes(
              trackEvent.durationTime
            );
            outPos = _writeVLBytes(
              outView,
              outPos,
              duration,
              lengthDurationBytes,
              false
            );
          }

          previousTrackEvent = trackEvent.type;
        }
      }
    }
  }

  const inArray = outFile.slice(0, outPos);
  const inArrayDataView = new DataView(inArray);
  let offsetheader = [];
  let extraOffsets = [];
  for (let x = 0; x < 0x40; x += 4) {
    offsetheader[x / 4] =
      (((((inArrayDataView.getUint8(x) << 8) |
        inArrayDataView.getUint8(x + 1)) <<
        8) |
        inArrayDataView.getUint8(x + 2)) <<
        8) |
      inArrayDataView.getUint8(x + 3);
    extraOffsets[x / 4] = 0;
  }

  for (let x = 0; x < outPos; x++) {
    if (x > 0x44) {
      if (inArrayDataView.getUint8(x) === 0xfe) {
        // need to write twice
        for (let y = 0; y < numTracks; y++) {
          if (offsetheader[y] > x) {
            extraOffsets[y]++;
          }
        }
      }
    }
  }

  for (let x = 0; x < 16; x++) {
    inArrayDataView.setUint32(x * 4, offsetheader[x] + extraOffsets[x]);
  }

  let outPosNew = 0;
  for (let x = 0; x < outPos; x++) {
    outView.setUint8(outPosNew, inArrayDataView.getUint8(x));
    outPosNew++;
    if (x > 0x44) {
      if (inArrayDataView.getUint8(x) === 0xfe) {
        // need to write twice
        outView.setUint8(outPosNew, inArrayDataView.getUint8(x));
        outPosNew++;
      }
    }
  }

  assert(outPosNew >= outPos);

  // if (useRepeaters) // TODO?

  return outFile.slice(0, outPosNew);
}

/**
 * The start of the MIDI data in the ROM is a bunch of
 * offsets to track data. This counts these offsets.
 */
function _getTrackCount(inView: DataView): number {
  let trackCount = 0;

  // -4 because the last number in the header is the "division"
  // which is not an offset.
  for (let i = 0; i < LENGTH_HEADER - 4; i += 4) {
    const trackOffset = inView.getUint32(i);

    // At some point the offsets end and there are zeroes.
    if (trackOffset !== 0) {
      trackCount++;
    }
  }
  return trackCount;
}

function _writeMidiHeader(
  outView: DataView,
  trackCount: number,
  division: number
): void {
  // Write magic "MThd"
  outView.setUint32(0, 0x4d546864);
  // Write header length
  outView.setUint32(4, 0x00000006);
  // Write MIDI format, always 1 (multi-track)
  outView.setUint16(8, 1);
  // Write track count
  outView.setUint16(10, trackCount);
  // Write division
  outView.setUint16(12, division);
}

function _getVLBytes(inView: DataView, refs: IRefs, includeFERepeats: boolean) {
  let VLVal = 0;
  let tempByte = 0;

  while (true) {
    if (refs.altPattern !== null) {
      tempByte = refs.altPattern[refs.altOffset];
      refs.altOffset++;
      if (refs.altOffset === refs.altLength) {
        refs.altPattern = null;
        refs.altOffset = 0;
        refs.altLength = 0;
      }
    } else {
      tempByte = inView.getUint8(refs.position);
      refs.position++;
      const byteAtPosition = inView.getUint8(refs.position);
      if (includeFERepeats && tempByte === 0xfe) {
        if (byteAtPosition !== 0xfe) {
          let repeatFirstByte = byteAtPosition;
          refs.position++;

          const repeatDistanceFromBeginningMarker =
            (repeatFirstByte << 8) | inView.getUint8(refs.position);
          refs.position++;
          const repeatCount = inView.getUint8(refs.position);
          refs.position++;

          refs.altPattern = new Array(repeatCount);
          const altPatternStart =
            refs.position - 4 - repeatDistanceFromBeginningMarker;
          const altPatternEnd = altPatternStart + repeatCount;
          for (let copy = altPatternStart; copy < altPatternEnd; copy++) {
            refs.altPattern[copy - altPatternStart] = inView.getUint8(copy);
          }
          refs.altOffset = 0;
          refs.altLength = repeatCount;
          tempByte = refs.altPattern[refs.altOffset];
          refs.altOffset++;
        } else {
          // byteAtPosition === 0xFE
          // Skip duplicate 0xFE
          refs.position++;
        }

        if (refs.altOffset === refs.altLength && refs.altPattern !== null) {
          refs.altPattern = null;
          refs.altOffset = 0;
          refs.altLength = 0;
        }
      }
    }

    if (tempByte >> 7 === 0x1) {
      VLVal += tempByte;
      VLVal = VLVal << 8;
    } else {
      VLVal += tempByte;
      break;
    }
  }

  refs.original = VLVal;

  let Vlength = 0;
  for (let c = 0, a = 0; ; c += 8, a += 7) {
    Vlength += ((VLVal >> c) & 0x7f) << a;
    if (c == 24) break;
  }

  return Vlength;
}

function _readMidiByte(
  inView: DataView,
  refs: IRefs,
  includeFERepeats: boolean
) {
  let returnByte: number;
  if (refs.altPattern !== null) {
    returnByte = refs.altPattern[refs.altOffset];
    refs.altOffset++;
  } else {
    returnByte = inView.getUint8(refs.position);
    refs.position++;

    if (includeFERepeats && returnByte === 0xfe) {
      const byteAtPosition = inView.getUint8(refs.position);
      if (byteAtPosition !== 0xfe) {
        let repeatFirstByte = byteAtPosition;
        refs.position++;

        const repeatDistanceFromBeginningMarker =
          (repeatFirstByte << 8) | inView.getUint8(refs.position);
        refs.position++;
        const repeatCount = inView.getUint8(refs.position);
        refs.position++;

        refs.altPattern = new Array(repeatCount);
        const altPatternStart =
          refs.position - 4 - repeatDistanceFromBeginningMarker;
        const altPatternEnd = altPatternStart + repeatCount;
        for (let copy = altPatternStart; copy < altPatternEnd; copy++) {
          refs.altPattern[copy - altPatternStart] = inView.getUint8(copy);
        }
        refs.altOffset = 0;
        refs.altLength = repeatCount;
        returnByte = refs.altPattern[refs.altOffset];
        refs.altOffset++;
      } else {
        // Skip duplicate 0xFE
        refs.position++;
      }
    }
  }

  if (refs.altOffset === refs.altLength && refs.altPattern !== null) {
    refs.altPattern = null;
    refs.altOffset = 0;
    refs.altLength = 0;
  }

  return returnByte;
}

/**
 * Writes variable-length bytes to DataView.
 * @param outView
 * @param outPos
 * @param value
 * @param len
 * @param includeFERepeats
 * @returns New outPos value.
 */
function _writeVLBytes(
  outView: DataView,
  outPos: number,
  value: number,
  len: number,
  includeFERepeats: boolean
) {
  let tempByte: number;
  if (len === 1) {
    tempByte = value & 0xff;
    outView.setUint8(outPos, tempByte);
    outPos += 1;
  } else if (len === 2) {
    tempByte = (value >> 8) & 0xff;
    outView.setUint8(outPos, tempByte);
    outPos += 1;
    tempByte = value & 0xff;
    outView.setUint8(outPos, tempByte);
    outPos += 1;
  } else if (len === 3) {
    tempByte = (value >> 16) & 0xff;
    outView.setUint8(outPos, tempByte);
    outPos += 1;
    tempByte = (value >> 8) & 0xff;
    outView.setUint8(outPos, tempByte);
    outPos += 1;
    tempByte = value & 0xff;
    outView.setUint8(outPos, tempByte);
    outPos += 1;
  } else {
    tempByte = (value >> 24) & 0xff;
    outView.setUint8(outPos, tempByte);
    outPos += 1;
    tempByte = (value >> 8) & 0xff;
    outView.setUint8(outPos, tempByte);
    outPos += 1;
    tempByte = value & 0xff;
    outView.setUint8(outPos, tempByte);
    outPos += 1;
  }
  return outPos;
}

function _returnVLBytes(value: number): [number, number] {
  let subValue1 = (value >> 21) & 0x7f;
  let subValue2 = (value >> 14) & 0x7f;
  let subValue3 = (value >> 7) & 0x7f;
  let subValue4 = (value >> 0) & 0x7f;

  if (subValue1 > 0) {
    let newValue = 0x80808000;
    newValue |= subValue1 << 24;
    newValue |= subValue2 << 16;
    newValue |= subValue3 << 8;
    newValue |= subValue4;
    const length = 4;
    return [newValue, length];
  } else if (subValue2 > 0) {
    let newValue = 0x00808000;
    newValue |= subValue2 << 16;
    newValue |= subValue3 << 8;
    newValue |= subValue4;
    const length = 3;
    return [newValue, length];
  } else if (subValue3 > 0) {
    let newValue = 0x00008000;
    newValue |= subValue3 << 8;
    newValue |= subValue4;
    const length = 2;
    return [newValue, length];
  } else {
    const length = 1;
    return [value, length];
  }
}

class TrackEvent {
  obsoleteEvent: boolean = false;
  deltaTime: number = 0;
  durationTime: number = 0;
  absoluteTime: number = 0;
  type: number = 0x00;
  contents: number[] | null = null;
  contentSize: number = 0;
}
