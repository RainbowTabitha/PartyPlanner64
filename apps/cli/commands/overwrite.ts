import { readFile, writeFile } from "fs/promises";
import { getROMAdapter } from "../../../packages/lib/adapter/adapters";
import { fixPotentiallyOldBoard } from "../../../packages/lib/boards";
import { romhandler } from "../../../packages/lib/romhandler";

export interface OverwriteOptions {
  romFile: string;
  targetBoardIndex: number;
  boardFile: string;
  outputFile: string;
}

export async function overwrite({
  romFile,
  targetBoardIndex,
  boardFile,
  outputFile,
}: OverwriteOptions): Promise<void> {
  const romBuffer = await readFile(romFile);
  const romArrayBuffer = romBuffer.buffer;

  const romLoadResult = await romhandler.setROMBuffer(
    romArrayBuffer,
    false,
    (err) => {
      console.error(err);
    }
  );
  if (!romLoadResult) {
    return;
  }

  const boardJson = await readFile(boardFile, { encoding: "utf-8" });
  let board = JSON.parse(boardJson);
  board = fixPotentiallyOldBoard(board);

  const adapter = getROMAdapter({});
  if (!adapter) {
    console.error("Could not get ROM adapter");
    return;
  }

  adapter.loadBoards();

  try {
    await adapter.overwriteBoard(targetBoardIndex, board);
  } catch (e) {
    console.error("Error overwriting board:\n", e);
    return;
  }

  const newROMArrayBuffer = romhandler.saveROM(false);
  await writeFile(outputFile, Buffer.from(newROMArrayBuffer));
}
