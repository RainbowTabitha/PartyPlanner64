PP64.ns("utils");

// This is most likely animation data for models.
PP64.utils.MTNX = class MTNX {
  static isMtnx(viewOrBuffer) {
    if (!viewOrBuffer)
      return false;

    if (!(viewOrBuffer instanceof DataView))
      viewOrBuffer = new DataView(viewOrBuffer);

    return viewOrBuffer.getUint32(0) === 0x4D544E58; // "MTNX"
  }
};
