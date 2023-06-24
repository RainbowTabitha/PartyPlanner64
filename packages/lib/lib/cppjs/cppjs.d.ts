// cpp.js declaration file.

export interface ICppSettings {
    /**
     * signal string that starts a preprocessor command,
     * only honoured at the beginning of a line.
     */
    signal_char?: string;

    /**
     * function used to print warnings, the default
     * implementation logs to the console.
     */
    warn_func?: (message: string) => void;

    /**
     * function used to print critical errors, the default
     * implementation logs to the console and throws.
     */
    error_func?: (message: string) => void;

    /**
     * Pragma handling.
     */
    pragma_func?: (pragma: string) => void;

    /**
     * function to be invoked to fetch include files.
     */
    include_func?: (file: string, is_global: boolean, resumer: (includedText: string | null) => void) => void;

    /**
     * Called by cpp.js when processing is finished.
     */
    completion_func?: (preprocessedText: string) => void;

    /**
     * function used to strip comments from the input file.
     * The default implementation handles C and C++-style
     * comments and also removes line continuations.
     * Since this function is invoked on all files before
     * any preprocessing happens, it can be thought of as a
     * "preprocessor to the preprocessor".
     */
    comment_stripper?: (file: string) => string;
}

interface Cpp {
    clear(): void;
    defined(k: string): boolean;
    define(k: string, v: string): void;
    define_multiple(dict: { [sym: string]: string }): void;
    undefine(k: string): void;
    run(text: string, name?: string): string;
}

export function create(settings?: ICppSettings): Cpp;
