import { EventActivationType, EventExecutionType } from "../types";

/** Listing of events for a space. */
export class SpaceEventList {
  private _entries: SpaceEventListEntry[];

  constructor() {
    this._entries = [];
  }

  /*
  * Populates this SpaceEventTable from an event table existing in the buffer.
  */
  parse(buffer: ArrayBuffer, offset: number) {
    let dataView = new DataView(buffer, offset);
    let currentOffset = 0;
    let activationType, executionType, address;
    while ((activationType = dataView.getUint16(currentOffset)) !== 0) {
      executionType = dataView.getUint16(currentOffset + 2);
      address = dataView.getUint32(currentOffset + 4);
      this.add(activationType, executionType, address);
      currentOffset += 8;
    }
  }

  /*
  * Writes the current entries back to the buffer at an offset.
  * Returns length of bytes written (equal to calling byteLength())
  */
  write(buffer: ArrayBuffer, offset: number) {
    let dataView = new DataView(buffer, offset);
    let currentOffset = 0;
    this.forEach(entry => {
      this._writeEntry(dataView, currentOffset, entry.activationType, entry.executionType, entry.address);
      currentOffset += 8;
    });
    this._writeEntry(dataView, currentOffset, 0, 0);
    currentOffset += 8;

    return currentOffset;
  }

  _writeEntry(dataView: DataView, currentOffset: number,
    activationType: EventActivationType,
    executionType: EventExecutionType, address: number = 0)
  {
    dataView.setUint16(currentOffset, activationType);
    dataView.setUint16(currentOffset + 2, executionType);
    if (!address && (activationType || executionType))
      throw `Tried to write null address from SpaceEventList.`;
    dataView.setUint32(currentOffset + 4, address);
  }

  add(activationType: EventActivationType,
    executionType: EventExecutionType, address: number = 0)
  {
    this._entries.push(new SpaceEventListEntry(activationType, executionType, address));
  }

  setAddress(entryIndex: number, address: number = 0) {
    this._entries[entryIndex].address = address >>> 0;
  }

  forEach(fn: (entry: SpaceEventListEntry) => any) {
    this._entries.forEach(fn);
  }

  byteLength() {
    // Each entry is 8 bytes, plus the last null entry.
    return (this._entries.length * 8) + 8;
  }

  static byteLength(entryCount: number) {
    return (entryCount * 8) + 8;
  }
}

export class SpaceEventListEntry {
  public activationType: EventActivationType;
  public executionType: EventExecutionType;
  public address: number;

  constructor(activationType: EventActivationType,
    executionType: EventExecutionType, address: number)
  {
    this.activationType = activationType;
    this.executionType = executionType;
    this.address = address;
  }
}