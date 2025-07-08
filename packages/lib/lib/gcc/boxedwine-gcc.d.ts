/// <reference path="./emscripten.d.ts" />

export interface BoxedWineGCCModule extends EmscriptenModule {
  // BoxedWine specific methods
  runWineCommand(command: string): number;
  getWineOutput(): string;
  getWineError(): string;
  mountDirectory(hostPath: string, winePath: string): void;
  unmountDirectory(winePath: string): void;
  writeFile(winePath: string, content: string): void;
  readFile(winePath: string): string;
  deleteFile(winePath: string): void;
  listDirectory(winePath: string): string[];
  createDirectory(winePath: string): void;
  directoryExists(winePath: string): boolean;
  
  // Configuration properties
  gccPath: string;
  winePrefix: string;
  tempDir: string;
}

export interface BoxedWineGCCOptions extends Partial<BoxedWineGCCModule> {
  // BoxedWine specific options
  winePrefix?: string;
  gccPath?: string;
  tempDir?: string;
  mountPoints?: Array<{ host: string; wine: string }>;
}

export default function BoxedWineGCC(opts?: BoxedWineGCCOptions): Promise<BoxedWineGCCModule>; 