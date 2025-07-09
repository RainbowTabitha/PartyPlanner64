// Define EmscriptenModule interface for TypeScript
interface EmscriptenModule {
  _malloc: (size: number) => number;
  setValue: (ptr: number, value: number, type: string) => void;
  getValue: (ptr: number, type: string) => number;
  FS: {
    writeFile: (path: string, data: string) => void;
    readFile: (path: string, options?: { encoding: string }) => string;
    mkdir: (path: string) => void;
  };
}

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

export interface BoxedWineGCCCompiler {
  compile(filename: string, source: string): Promise<string>;
}

export interface BoxedWineGCCOptions extends Partial<BoxedWineGCCModule> {
  // BoxedWine specific options
  winePrefix?: string;
  gccPath?: string;
  tempDir?: string;
  mountPoints?: Array<{ host: string; wine: string }>;
}

export default function BoxedWineGCC(opts?: BoxedWineGCCOptions): Promise<BoxedWineGCCCompiler>; 