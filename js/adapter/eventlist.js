PP64.ns("adapters");

// Listing of events for a space.
PP64.adapters.SpaceEventList = class SpaceEventList {
  constructor() {
    this._entries = [];
  }

  /*
   * Populates this SpaceEventTable from an event table existing in the buffer.
   */
  parse(buffer, offset) {
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
  write(buffer, offset) {
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

  _writeEntry(dataView, currentOffset, activationType, executionType, address) {
    dataView.setUint16(currentOffset, activationType);
    dataView.setUint16(currentOffset + 2, executionType);
    if (!address && (activationType || executionType))
      throw `Tried to write null address from SpaceEventList.`;
    dataView.setUint32(currentOffset + 4, address);
  }

  add(activationType, executionType, address = 0) {
    this._entries.push(new PP64.adapters.SpaceEventListEntry(activationType, executionType, address));
  }

  setAddress(entryIndex, address = 0) {
    this._entries[entryIndex].address = address >>> 0;
  }

  forEach(fn) {
    this._entries.forEach(fn);
  }

  byteLength() {
    // Each entry is 8 bytes, plus the last null entry.
    return (this._entries.length * 8) + 8;
  }

  static byteLength(entryCount) {
    return (entryCount * 8) + 8;
  }
}

PP64.adapters.SpaceEventListEntry = class SpaceEventListEntry {
  constructor(activationType, executionType, address) {
    this.activationType = activationType;
    this.executionType = executionType;
    this.address = address;
  }
}
