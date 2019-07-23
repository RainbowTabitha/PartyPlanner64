// The parsing here is shamelessly derived from Subdrag's
// N64SoundTools / N64MidiTool MidiParse.cpp

// https://github.com/derselbst/N64SoundTools/blob/master/N64MidiTool/N64MidiLibrary/MidiParse.cpp#L296

/* eslint-disable */

const LENGTH_HEADER = 0x44;

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
export function parseGameMidi(inView: DataView, inputSize: number): ArrayBuffer {
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
      let statusBit = (eventVal < 0x80);

      if (eventVal === 0xFF || (statusBit && previousEventValue === 0xFF)) { // meta event
        let subType;
        if (statusBit)
          subType = eventVal;
        else
          subType = _readMidiByte(inView, refs, true);

        if (subType == 0x51) { // tempo
          let microsecondsSinceQuarterNote = ((((_readMidiByte(inView, refs, true) << 8)
            | _readMidiByte(inView, refs, true)) << 8)
            | _readMidiByte(inView, refs, true));
        }
        else if (subType == 0x2D) { // end loop
          let loopCount = _readMidiByte(inView, refs, true);
          let currentLoopCount = _readMidiByte(inView, refs, true);
          let offsetToBeginningLoop = ((((((_readMidiByte(inView, refs, false) << 8)
          | _readMidiByte(inView, refs, false)) << 8)
          | _readMidiByte(inView, refs, false)) << 8)
          | _readMidiByte(inView, refs, false));

          if ((loopCount == 0xFF) || (loopCount == 0x00)) {
            break;
          }
          else {
            const it = loopEndsWithCount.get(refs.position);
            if (loopEndsWithCount.has(refs.position)) {
              let countLeft = it!;
              if (countLeft === 0) {
                loopEndsWithCount.delete(refs.position);
              }
              else {
                loopEndsWithCount.set(refs.position, countLeft - 1);
              }
            }
            else {
              loopEndsWithCount.set(refs.position, loopCount - 1);
            }

            if (refs.altPattern === null) {
              refs.position = refs.position - offsetToBeginningLoop;
            }
            else {
              loopEndsWithCount.delete(refs.position);
            }
          }
        }
        else if (subType == 0x2E) { // start loop
          let loopNumber = _readMidiByte(inView, refs, true);
          let endLoop = _readMidiByte(inView, refs, true); // Always FF
        }
        else if (subType == 0x2F) {
          endFlag = true;
        }

        if (!statusBit) {
          previousEventValue = eventVal;
        }
      }
      else if ((eventVal >= 0x90 && eventVal < 0xA0)
        || (statusBit && (previousEventValue >= 0x90) && (previousEventValue < 0xA0)))
      {
        let curEventVal;

        let noteNumber;
        if (statusBit) {
          noteNumber = eventVal;
          curEventVal = previousEventValue;
        }
        else {
          noteNumber = _readMidiByte(inView, refs, true);
          curEventVal = eventVal;
        }
        let velocity = _readMidiByte(inView, refs, true);
        let timeDuration = _getVLBytes(inView, refs, true);

        if (!statusBit)
          previousEventValue = eventVal;
      }
      else if (((eventVal >= 0xB0) && (eventVal < 0xC0))
      || (statusBit && (previousEventValue >= 0xB0) && (previousEventValue < 0xC0))) // controller change
      {
        let controllerTypeText = "";
        let controllerType;
        if (statusBit) {
          controllerType = eventVal;
          //previousEventValue;
        }
        else {
          controllerType = _readMidiByte(inView, refs, true);
          //eventVal;
        }
        let controllerValue = _readMidiByte(inView, refs, true);

        if (!statusBit)
          previousEventValue = eventVal;
      }
      else if (((eventVal >= 0xC0) && (eventVal < 0xD0))
      || (statusBit && (previousEventValue >= 0xC0) && (previousEventValue < 0xD0))) // change instrument
      {
        let instrument;
        if (statusBit) {
          instrument = eventVal;
          //previousEventValue;
        }
        else {
          instrument = _readMidiByte(inView, refs, true);
          //eventVal;
        }

        if (!statusBit) {
          previousEventValue = eventVal;
        }
      }
      else if (((eventVal >= 0xD0) && (eventVal < 0xE0))
      || (statusBit && (previousEventValue >= 0xD0) && (previousEventValue < 0xE0))) // channel aftertouch
      {
        let amount;
        if (statusBit) {
          amount = eventVal;
          //previousEventValue;
        }
        else {
          amount = _readMidiByte(inView, refs, true);
          //eventVal;
        }

        if (!statusBit) {
          previousEventValue = eventVal;
        }
      }
      else if (((eventVal >= 0xE0) && (eventVal < 0xF0))
      || (statusBit && (previousEventValue >= 0xE0) && (previousEventValue < 0xF0))) // pitch bend
      {
        let valueLSB;
        if (statusBit) {
          valueLSB = eventVal;
          //previousEventValue;
        }
        else {
          valueLSB = _readMidiByte(inView, refs, true);
          //eventVal;
        }

        let valueMSB = _readMidiByte(inView, refs, true);

        if (!statusBit) {
          previousEventValue = eventVal;
        }
      }
      else if (eventVal == 0xFE) { // repeat operation
        // should not be here...
        // no prev event set
      }
      else {
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
      outView.setUint32(outPos, 0x4D54726B); // MTrk
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

        trackEventsSub[trackEventCountSub].type = 0xB0 | ((i / 4) & 0xF);
        trackEventsSub[trackEventCountSub].contentSize = 2;
        trackEventsSub[trackEventCountSub].contents = new Array(2);
        trackEventsSub[trackEventCountSub].contents![0] = 0x64;
        trackEventsSub[trackEventCountSub].contents![1] = 0x00;

        trackEventCountSub++;


        trackEventsSub[trackEventCountSub].type = 0xB0 | ((i / 4) & 0xF);
        trackEventsSub[trackEventCountSub].contentSize = 2;
        trackEventsSub[trackEventCountSub].contents = new Array(2);
        trackEventsSub[trackEventCountSub].contents![0] = 0x65;
        trackEventsSub[trackEventCountSub].contents![1] = 0x00;

        trackEventCountSub++;


        trackEventsSub[trackEventCountSub].type = 0xB0 | ((i / 4) & 0xF);
        trackEventsSub[trackEventCountSub].contentSize = 2;
        trackEventsSub[trackEventCountSub].contents = new Array(2);
        trackEventsSub[trackEventCountSub].contents![0] = 0x06;
        if (pitchBendSensitity > 0x18)
          pitchBendSensitity = 0x18;
        trackEventsSub[trackEventCountSub].contents![1] = pitchBendSensitity;

        trackEventCountSub++;

        trackEventsSub[trackEventCountSub].type = 0xB0 | ((i / 4) & 0xF);
        trackEventsSub[trackEventCountSub].contentSize = 2;
        trackEventsSub[trackEventCountSub].contents = new Array(2);
        trackEventsSub[trackEventCountSub].contents![0] = 0x64;
        trackEventsSub[trackEventCountSub].contents![1] = 0x7F;

        trackEventCountSub++;


        trackEventsSub[trackEventCountSub].type = 0xB0 | ((i / 4) & 0xF);
        trackEventsSub[trackEventCountSub].contentSize = 2;
        trackEventsSub[trackEventCountSub].contents = new Array(2);
        trackEventsSub[trackEventCountSub].contents![0] = 0x65;
        trackEventsSub[trackEventCountSub].contents![1] = 0x7F;

        trackEventCountSub++;
      }

      while ((refs.position < inputSize) && !endFlag) {
        if (extendTracksToHighest) {
          if (absoluteTime >= highestTrackLength) {
            trackEventsSub[trackEventCountSub].absoluteTime = highestTrackLength;
            trackEventsSub[trackEventCountSub].deltaTime = (highestTrackLength - absoluteTime);

            trackEventsSub[trackEventCountSub].type = 0xFF;
            trackEventsSub[trackEventCountSub].contentSize = 2;
            trackEventsSub[trackEventCountSub].contents = new Array(2);
            trackEventsSub[trackEventCountSub].contents![0] = 0x2F;
            trackEventsSub[trackEventCountSub].contents![1] = 0x0;

            trackEventCountSub++;

            endFlag = true;

            break;
          }
        }

        if (trackEventCountSub >= 0x30000) {
          for (let eventCount = 0; eventCount < trackEventCountSub; eventCount++) {
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
          if ((absoluteTime + timeTag) > highestTrackLength) {
            trackEventsSub[trackEventCountSub].absoluteTime = highestTrackLength;
            trackEventsSub[trackEventCountSub].deltaTime = (highestTrackLength - absoluteTime);

            trackEventsSub[trackEventCountSub].type = 0xFF;
            trackEventsSub[trackEventCountSub].contentSize = 2;
            trackEventsSub[trackEventCountSub].contents = new Array(2);
            trackEventsSub[trackEventCountSub].contents![0] = 0x2F;
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

        let statusBit = (eventVal < 0x80);

        if ((eventVal == 0xFF) || (statusBit && (previousEventValue == 0xFF))) { // meta event
          let subType;
          if (statusBit)
            subType = eventVal;
          else
            subType = _readMidiByte(inView, refs, true);

          if (subType == 0x51) { // tempo
            let microsecondsSinceQuarterNote = ((((_readMidiByte(inView, refs, true) << 8)
            | _readMidiByte(inView, refs, true)) << 8)
            | _readMidiByte(inView, refs, true));

            trackEventsSub[trackEventCountSub].type = 0xFF;
            trackEventsSub[trackEventCountSub].contentSize = 5;
            trackEventsSub[trackEventCountSub].contents = new Array(5);
            trackEventsSub[trackEventCountSub].contents![0] = 0x51;
            trackEventsSub[trackEventCountSub].contents![1] = 0x3;
            trackEventsSub[trackEventCountSub].contents![2] = ((microsecondsSinceQuarterNote >> 16) & 0xFF);
            trackEventsSub[trackEventCountSub].contents![3] = ((microsecondsSinceQuarterNote >> 8) & 0xFF);
            trackEventsSub[trackEventCountSub].contents![4] = ((microsecondsSinceQuarterNote >> 0) & 0xFF);

            trackEventCountSub++;

            const MICROSECONDS_PER_MINUTE = 60000000;
            let beatsPerMinute = MICROSECONDS_PER_MINUTE / microsecondsSinceQuarterNote; // float conversion
          }
          else if (subType == 0x2D) { // end loop
            let loopNumber = 0;
            if (loopNumbers.length > 0) {
              loopNumber = loopNumbers.pop()!;
            }

            // Fake loop end, controller 103
            trackEventsSub[trackEventCountSub].type = 0xB0 | ((i / 4) & 0xF);
            trackEventsSub[trackEventCountSub].contentSize = 2;
            trackEventsSub[trackEventCountSub].contents = new Array(2);
            trackEventsSub[trackEventCountSub].contents![0] = 103;
            trackEventsSub[trackEventCountSub].contents![1] = loopNumber;
            trackEventCountSub++;

            let loopCount = _readMidiByte(inView, refs, true);
            let currentLoopCount = _readMidiByte(inView, refs, true);
            let offsetToBeginningLoop = ((((((_readMidiByte(inView, refs, false) << 8)
            | _readMidiByte(inView, refs, false)) << 8)
            | _readMidiByte(inView, refs, false)) << 8)
            | _readMidiByte(inView, refs, false));

            if ((loopCount == 0xFF) || (loopCount == 0x00)) {
              hasLoopPoint = true;
              loopEnd = absoluteTime;

              if (extendTracksToHighest) {
                if (refs.altPattern === null) {
                  refs.position = refs.position - offsetToBeginningLoop;
                }
              }
            }
            else
            {
              let it = loopEndsWithCount.get(refs.position);
              if (loopEndsWithCount.has(refs.position)) {
                let countLeft = it!;

                if (countLeft == 0) {
                  loopEndsWithCount.delete(refs.position);
                }
                else {
                  loopEndsWithCount.set(refs.position, countLeft - 1);
                }
              }
              else {
                loopEndsWithCount.set(refs.position, loopCount - 1);
              }

              if (refs.altPattern === null) {
                refs.position = refs.position - offsetToBeginningLoop;
              }
              else {
                loopEndsWithCount.delete(refs.position);
              }
            }
          }
          else if (subType == 0x2E) { // start loop
            let loopNumber = _readMidiByte(inView, refs, true);
            let endLoop = _readMidiByte(inView, refs, true); // Always FF
            hasLoopPoint = true;
            loopStart = absoluteTime;

            // Fake loop start, controller 102
            trackEventsSub[trackEventCountSub].type = 0xB0 | ((i / 4) & 0xF);
            trackEventsSub[trackEventCountSub].contentSize = 2;
            trackEventsSub[trackEventCountSub].contents = new Array(2);
            trackEventsSub[trackEventCountSub].contents![0] = 102;
            trackEventsSub[trackEventCountSub].contents![1] = loopNumber;
            trackEventCountSub++;

            loopNumbers.push(loopNumber);
          }
          else if (subType == 0x2F) {
            trackEventsSub[trackEventCountSub].type = 0xFF;
            trackEventsSub[trackEventCountSub].contentSize = 2;
            trackEventsSub[trackEventCountSub].contents = new Array(2);
            trackEventsSub[trackEventCountSub].contents![0] = 0x2F;
            trackEventsSub[trackEventCountSub].contents![1] = 0x0;

            trackEventCountSub++;

            endFlag = true;
          }

          if (!statusBit)
            previousEventValue = eventVal;
        }
        else if ((eventVal >= 0x90 && eventVal < 0xA0)
        || (statusBit && (previousEventValue >= 0x90) && (previousEventValue < 0xA0)))
        {
          let curEventVal;

          let noteNumber: number;
          if (statusBit) {
            trackEventsSub[trackEventCountSub].type = previousEventValue;
            noteNumber = eventVal;
            curEventVal = previousEventValue;
          }
          else {
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

          if (!statusBit)
            previousEventValue = eventVal;
        }
        else if (((eventVal >= 0xB0) && (eventVal < 0xC0))
        || (statusBit && (previousEventValue >= 0xB0) && (previousEventValue < 0xC0))) // controller change
        {
          let controllerTypeText = "";
          let controllerType;

          if (statusBit) {
            controllerType = eventVal;
            trackEventsSub[trackEventCountSub].type = previousEventValue;
          }
          else {
            controllerType = _readMidiByte(inView, refs, true);
            trackEventsSub[trackEventCountSub].type = eventVal;
          }
          let controllerValue = _readMidiByte(inView, refs, true);

          trackEventsSub[trackEventCountSub].contentSize = 2;
          trackEventsSub[trackEventCountSub].contents = new Array(2);
          trackEventsSub[trackEventCountSub].contents![0] = controllerType;
          trackEventsSub[trackEventCountSub].contents![1] = controllerValue;

          trackEventCountSub++;

          if (!statusBit)
            previousEventValue = eventVal;
        }
        else if (((eventVal >= 0xC0) && (eventVal < 0xD0))
        || (statusBit && (previousEventValue >= 0xC0) && (previousEventValue < 0xD0))) // change instrument
        {
          let instrument;
          if (statusBit) {
            instrument = eventVal;
            trackEventsSub[trackEventCountSub].type = previousEventValue;
          }
          else {
            instrument = _readMidiByte(inView, refs, true);
            trackEventsSub[trackEventCountSub].type = eventVal;
          }

          trackEventsSub[trackEventCountSub].contentSize = 1;
          trackEventsSub[trackEventCountSub].contents = [instrument];
          if (instrument >= numInstruments) {
            numInstruments = (instrument + 1);
          }

          trackEventCountSub++;

          if (!statusBit)
            previousEventValue = eventVal;
        }
        else if (((eventVal >= 0xD0) && (eventVal < 0xE0))
        || (statusBit && (previousEventValue >= 0xD0) && (previousEventValue < 0xE0))) // channel aftertouch
        {
          let amount;
          if (statusBit)
          {
            amount = eventVal;
            trackEventsSub[trackEventCountSub].type = previousEventValue;
          }
          else
          {
            amount = _readMidiByte(inView, refs, true);
            trackEventsSub[trackEventCountSub].type = eventVal;
          }

          trackEventsSub[trackEventCountSub].contentSize = 1;
          trackEventsSub[trackEventCountSub].contents = [amount];

          trackEventCountSub++;

          if (!statusBit)
            previousEventValue = eventVal;
        }
        else if (((eventVal >= 0xE0) && (eventVal < 0xF0))
        || (statusBit && (previousEventValue >= 0xE0) && (previousEventValue < 0xF0))) // pitch bend
        {
          let valueLSB;
          if (statusBit) {
            valueLSB = eventVal;
            trackEventsSub[trackEventCountSub].type = previousEventValue;
          }
          else {
            valueLSB = _readMidiByte(inView, refs, true);
            trackEventsSub[trackEventCountSub].type = eventVal;
          }

          let valueMSB = _readMidiByte(inView, refs, true);

          trackEventsSub[trackEventCountSub].contentSize = 2;
          trackEventsSub[trackEventCountSub].contents = [valueLSB, valueMSB];

          trackEventCountSub++;

          if (!statusBit)
            previousEventValue = eventVal;
        }
        else if (eventVal == 0xFE) { // repeat operation
          // should not be here...
          // no prev event set
        }
        else {
          console.error(`${eventVal} ERROR MISSING PARSE OF TYPE`);
        }
      }

      for (let eventCount = 0; eventCount < trackEventCountSub; eventCount++) {
        if (trackEventCountSub >= 0x30000) {
          for (let eventCount = 0; eventCount < trackEventCountSub; eventCount++)
          {
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
        if ((trackEvent.type >= 0x90) && (trackEvent.type < 0xA0)) {
          // need to split out
          if (trackEvent.durationTime > 0) {
            let shutoffTime = (trackEvent.absoluteTime + trackEvent.durationTime);
            if (eventCount != (trackEventCountSub - 1)) {
              for (let e = (eventCount+1); e < trackEventCountSub; e++) {
                if ((trackEventsSub[e].absoluteTime >= shutoffTime) && (e != (trackEventCountSub - 1))) {
                  for (let j = (trackEventCountSub - 1); j >= e; j--)
                  {
                    trackEventsSub[j+1].absoluteTime = trackEventsSub[j].absoluteTime;
                    trackEventsSub[j+1].contentSize = trackEventsSub[j].contentSize;
                    if (trackEventsSub[j+1].contents !== null) {
                      //delete [] trackEventsSub[j+1].contents;
                      trackEventsSub[j+1].contents = null;
                    }
                    trackEventsSub[j+1].contents = new Array(trackEventsSub[j].contentSize);
                    for (let r = 0; r < trackEventsSub[j].contentSize; r++) {
                      trackEventsSub[j+1].contents![r] = trackEventsSub[j].contents![r];
                    }
                    trackEventsSub[j+1].deltaTime = trackEventsSub[j].deltaTime;
                    trackEventsSub[j+1].durationTime = trackEventsSub[j].durationTime;
                    trackEventsSub[j+1].obsoleteEvent = trackEventsSub[j].obsoleteEvent;
                    trackEventsSub[j+1].type = trackEventsSub[j].type;
                  }

                  trackEventsSub[e].type = trackEventsSub[eventCount].type;
                  trackEventsSub[e].absoluteTime = shutoffTime;
                  trackEventsSub[e].deltaTime = (trackEventsSub[e].absoluteTime - trackEventsSub[e - 1].absoluteTime);
                  trackEventsSub[e].contentSize = trackEventsSub[eventCount].contentSize;
                  trackEventsSub[e].durationTime = 0;

                  trackEventsSub[e].contents = new Array(trackEventsSub[e].contentSize);
                  trackEventsSub[e].contents![0] = trackEventsSub[eventCount].contents![0];
                  trackEventsSub[e].contents![1] = 0;

                  trackEventsSub[e + 1].deltaTime = (trackEventsSub[e + 1].absoluteTime - trackEventsSub[e].absoluteTime);

                  if (trackEventsSub[e].deltaTime > 0xFF000000) {
                    let a = 1;
                  }

                  trackEventCountSub++;
                  break;
                }
                else if (e == (trackEventCountSub - 1)) {
                  trackEventsSub[e + 1].absoluteTime = shutoffTime; // move end to end
                  trackEventsSub[e + 1].contentSize = trackEventsSub[e].contentSize;
                  if (trackEventsSub[e + 1].contents !== null) {
                    trackEventsSub[e + 1].contents = null;
                  }
                  trackEventsSub[e + 1].contents = new Array(trackEventsSub[e].contentSize);
                  for (let r = 0; r < trackEventsSub[e].contentSize; r++) {
                    trackEventsSub[e + 1].contents![r] = trackEventsSub[e].contents![r];
                  }
                  trackEventsSub[e + 1].deltaTime = trackEventsSub[e].deltaTime;
                  trackEventsSub[e + 1].durationTime = trackEventsSub[e].durationTime;
                  trackEventsSub[e + 1].obsoleteEvent = trackEventsSub[e].obsoleteEvent;
                  trackEventsSub[e + 1].type = trackEventsSub[e].type;

                  trackEventsSub[e].type = trackEventsSub[eventCount].type;
                  trackEventsSub[e].absoluteTime = shutoffTime;
                  trackEventsSub[e].deltaTime = (trackEventsSub[e].absoluteTime - trackEventsSub[e - 1].absoluteTime);
                  trackEventsSub[e].contentSize = trackEventsSub[eventCount].contentSize;
                  trackEventsSub[e].durationTime = 0;

                  trackEventsSub[e].contents = new Array(trackEventsSub[e].contentSize);
                  trackEventsSub[e].contents![0] = trackEventsSub[eventCount].contents![0];
                  trackEventsSub[e].contents![1] = 0;

                  trackEventsSub[e + 1].deltaTime = (trackEventsSub[e + 1].absoluteTime - trackEventsSub[e].absoluteTime);

                  trackEventCountSub++;
                  break;
                }
              }
            }
            else {
              trackEventsSub[eventCount+1].absoluteTime = shutoffTime; // move end to end
              trackEventsSub[eventCount+1].contentSize = trackEventsSub[eventCount].contentSize;
              if (trackEventsSub[eventCount+1].contents !== null) {
                //delete [] trackEventsSub[eventCount+1].contents;
                trackEventsSub[eventCount+1].contents = null;
              }
              trackEventsSub[eventCount+1].contents = new Array(trackEventsSub[eventCount].contentSize);
              for (let r = 0; r < trackEventsSub[eventCount].contentSize; r++) {
                trackEventsSub[eventCount+1].contents![r] = trackEventsSub[eventCount].contents![r];
              }
              trackEventsSub[eventCount+1].deltaTime = trackEventsSub[eventCount].deltaTime;
              trackEventsSub[eventCount+1].durationTime = trackEventsSub[eventCount].durationTime;
              trackEventsSub[eventCount+1].obsoleteEvent = trackEventsSub[eventCount].obsoleteEvent;
              trackEventsSub[eventCount+1].type = trackEventsSub[eventCount].type;

              trackEventsSub[eventCount].type = trackEventsSub[eventCount].type;
              trackEventsSub[eventCount].absoluteTime = shutoffTime;
              if ((trackEventsSub[eventCount].absoluteTime - trackEventsSub[eventCount - 1].absoluteTime) > 0xFF000000) {
                let a =1;
              }
              trackEventsSub[eventCount].deltaTime = (trackEventsSub[eventCount].absoluteTime - trackEventsSub[eventCount - 1].absoluteTime);
              trackEventsSub[eventCount].contentSize = trackEventsSub[eventCount].contentSize;
              trackEventsSub[eventCount].durationTime = 0;
              trackEventsSub[eventCount].contents = new Array(trackEventsSub[eventCount].contentSize);
              trackEventsSub[eventCount].contents![0] = trackEventsSub[eventCount].contents![0];
              trackEventsSub[eventCount].contents![1] = 0;

              trackEventsSub[eventCount+1].deltaTime =
                (trackEventsSub[eventCount+1].absoluteTime - trackEventsSub[eventCount].absoluteTime);
              if (trackEventsSub[eventCount].deltaTime > 0xFF000000) {
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
        let trackEvent =  trackEventsSub[j];
        if (trackEvent.obsoleteEvent) {
          timeOffset += trackEvent.deltaTime;
        }
        else {
          let [timeDelta, lengthTimeDelta] = _returnVLBytes(trackEvent.deltaTime + timeOffset);
          timeOffset = 0;

          sizeData += lengthTimeDelta;

          if ((trackEvent.type !== previousTrackEvent) || (trackEvent.type === 0xFF)) {
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
        }
        else {
          let [timeDelta, lengthTimeDelta] = _returnVLBytes(trackEvent.deltaTime + timeOffset);
          timeOffset = 0;
          outPos = _writeVLBytes(outView, outPos, timeDelta, lengthTimeDelta, true);

          if ((trackEvent.type != previousTrackEvent) || (trackEvent.type == 0xFF)) {
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
    }
    else {
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

function _writeMidiHeader(outView: DataView, trackCount: number, division: number): void {
  // Write magic "MThd"
  outView.setUint32(0, 0x4D546864);
  // Write header length
  outView.setUint32(4, 0x00000006);
  // Write MIDI format, always 1 (multi-track)
  outView.setUint16(8, 1);
  // Write track count
  outView.setUint16(10, trackCount);
  // Write division
  outView.setUint16(12, division);
}

function _getVLBytes(inView: DataView, refs: IRefs, includeFERepeats: boolean)
{
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
    }
    else {
      tempByte = inView.getUint8(refs.position);
      refs.position++;
      const byteAtPosition = inView.getUint8(refs.position);
      if (includeFERepeats && tempByte === 0xFE) {
        if (byteAtPosition !== 0xFE) {
          let repeatFirstByte = byteAtPosition;
          refs.position++;

          const repeatDistanceFromBeginningMarker = (repeatFirstByte << 8) | inView.getUint8(refs.position);
          refs.position++;
          const repeatCount = inView.getUint8(refs.position);
          refs.position++;

          refs.altPattern = new Array(repeatCount);
          const altPatternStart = (refs.position - 4) - repeatDistanceFromBeginningMarker;
          const altPatternEnd = altPatternStart + repeatCount;
          for (let copy = altPatternStart; copy < altPatternEnd; copy++) {
            refs.altPattern[copy - altPatternStart] = inView.getUint8(copy);
          }
          refs.altOffset = 0;
          refs.altLength = repeatCount;
          tempByte = refs.altPattern[refs.altOffset];
          refs.altOffset++;
        }
        else { // byteAtPosition === 0xFE
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

    if ((tempByte >> 7) === 0x1) {
      VLVal += tempByte;
      VLVal = VLVal << 8;
    }
    else {
      VLVal += tempByte;
      break;
    }
  }

  refs.original = VLVal;

  let Vlength = 0;
  for (let c = 0, a = 0; ; c += 8, a += 7) {
    Vlength += (((VLVal >> c) & 0x7F) << a);
    if (c == 24)
      break;
  }

  return Vlength;
}

function _readMidiByte(inView: DataView, refs: IRefs, includeFERepeats: boolean)
{
  let returnByte: number;
  if (refs.altPattern !== null) {
    returnByte = refs.altPattern[refs.altOffset];
    refs.altOffset++;
  }
  else {
    returnByte = inView.getUint8(refs.position);
    refs.position++;

    if (includeFERepeats && returnByte === 0xFE) {
      const byteAtPosition = inView.getUint8(refs.position);
      if (byteAtPosition !== 0xFE) {
        let repeatFirstByte = byteAtPosition;
        refs.position++;

        const repeatDistanceFromBeginningMarker = (repeatFirstByte << 8) | inView.getUint8(refs.position);
        refs.position++;
        const repeatCount = inView.getUint8(refs.position);
        refs.position++;

        refs.altPattern = new Array(repeatCount);
        const altPatternStart = (refs.position - 4) - repeatDistanceFromBeginningMarker;
        const altPatternEnd = altPatternStart + repeatCount;
        for (let copy = altPatternStart; copy < altPatternEnd; copy++) {
          refs.altPattern[copy - altPatternStart] = inView.getUint8(copy);
        }
        refs.altOffset = 0;
        refs.altLength = repeatCount;
        returnByte = refs.altPattern[refs.altOffset];
        refs.altOffset++;
      }
      else {
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

function _writeVLBytes(outView: DataView, outPos: number, value: number, len: number, includeFERepeats: boolean) {
  let tempByte: number;
  if (len === 1) {
    tempByte = value & 0xFF;
    outView.setUint8(outPos, tempByte);
    outPos += 1;
  }
  else if (len === 2) {
    tempByte = (value >> 8) & 0xFF;
    outView.setUint8(outPos, tempByte);
    outPos += 1;
    tempByte = value & 0xFF;
    outView.setUint8(outPos, tempByte);
    outPos += 1;
  }
  else if (len === 3) {
    tempByte = (value >> 16) & 0xFF;
    outView.setUint8(outPos, tempByte);
    outPos += 1;
    tempByte = (value >> 8) & 0xFF;
    outView.setUint8(outPos, tempByte);
    outPos += 1;
    tempByte = value & 0xFF;
    outView.setUint8(outPos, tempByte);
    outPos += 1;
  }
  else {
    tempByte = (value >> 24) & 0xFF;
    outView.setUint8(outPos, tempByte);
    outPos += 1;
    tempByte = (value >> 8) & 0xFF;
    outView.setUint8(outPos, tempByte);
    outPos += 1;
    tempByte = value & 0xFF;
    outView.setUint8(outPos, tempByte);
    outPos += 1;
  }
  return outPos;
}

function _returnVLBytes(value: number): [number, number]
{
  let subValue1 = (value >> 21) & 0x7F;
  let subValue2 = (value >> 14) & 0x7F;
  let subValue3 = (value >> 7) & 0x7F;
  let subValue4 = (value >> 0) & 0x7F;

  if (subValue1 > 0) {
    let newValue = 0x80808000;
    newValue |= (subValue1 << 24);
    newValue |= (subValue2 << 16);
    newValue |= (subValue3 << 8);
    newValue |= subValue4;
    const length = 4;
    return [newValue, length];
  }
  else if (subValue2 > 0) {
    let newValue = 0x00808000;
    newValue |= (subValue2 << 16);
    newValue |= (subValue3 << 8);
    newValue |= subValue4;
    const length = 3;
    return [newValue, length];
  }
  else if (subValue3 > 0) {
    let newValue = 0x00008000;
    newValue |= (subValue3 << 8);
    newValue |= subValue4;
    const length = 2;
    return [newValue, length];
  }
  else {
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
