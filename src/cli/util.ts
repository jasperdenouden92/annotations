import { execFileSync } from "node:child_process";

/** Parsed command-line: positional args and `--flag[=value]` options. */
export interface Args {
  positionals: string[];
  flags: Record<string, string | true>;
}

/** Parses `argv` (without node/script) into positionals and flags. */
export function parseArgs(argv: string[]): Args {
  const positionals: string[] = [];
  const flags: Record<string, string | true> = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      if (eq !== -1) {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1);
      } else {
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith("--")) {
          flags[arg.slice(2)] = next;
          i++;
        } else {
          flags[arg.slice(2)] = true;
        }
      }
    } else {
      positionals.push(arg);
    }
  }

  return { positionals, flags };
}

/** Reads a flag as a string, or returns `fallback` when absent/boolean. */
export function flagStr(args: Args, name: string, fallback = ""): string {
  const v = args.flags[name];
  return typeof v === "string" ? v : fallback;
}

/** Reads a boolean flag (present, with or without a value). */
export function flagBool(args: Args, name: string): boolean {
  return args.flags[name] !== undefined;
}

/** Requires an environment variable, exiting with a clear message if unset. */
export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    fail(`Ontbrekende environment-variabele: ${name}`);
  }
  return v;
}

/** Prints an error to stderr and exits with code 1. */
export function fail(message: string): never {
  process.stderr.write(`orbit-feedback: ${message}\n`);
  process.exit(1);
}

/** Runs a command synchronously, returning trimmed stdout. Throws on failure. */
export function run(cmd: string, cmdArgs: string[]): string {
  return execFileSync(cmd, cmdArgs, { encoding: "utf8" }).trim();
}

/** Like `run`, but returns `{ ok, stdout, stderr }` instead of throwing. */
export function tryRun(
  cmd: string,
  cmdArgs: string[]
): { ok: boolean; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync(cmd, cmdArgs, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { ok: true, stdout: stdout.trim(), stderr: "" };
  } catch (err: unknown) {
    const e = err as { stdout?: Buffer | string; stderr?: Buffer | string };
    return {
      ok: false,
      stdout: e.stdout ? String(e.stdout).trim() : "",
      stderr: e.stderr ? String(e.stderr).trim() : "",
    };
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
