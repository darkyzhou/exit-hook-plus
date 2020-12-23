export type ExitReason =
  | ExitReasonTrivial
  | ExitReasonException
  | ExitReasonSignal
  | ExitReasonManual;

export type ExitReasonTrivial = {
  category: 'trivial';
  exitCode: number;
};

export type ExitReasonException = {
  category: 'exception';
  errorOrReason?: Error | any;
};

export type ExitReasonSignal = {
  category: 'signal';
  signal: 'SIGHUP' | 'SIGINT' | 'SIGTERM' | 'SIGBREAK';
};

export type ExitReasonManual = {
  category: 'manual';
  extra?: any;
};

export type ExitHook = { _executed?: boolean } & (
  | ((reason: ExitReason) => Promise<void>)
  | ((reason: ExitReason) => void)
);

let exitHooks: ExitHook[] = [];
const TRIGGER_ERRORS = ['unhandledRejection', 'uncaughtException'];
const TRIGGER_SIGNALS = [
  ['SIGHUP', 128 + 1],
  ['SIGINT', 128 + 2],
  ['SIGTERM', 128 + 15],
  ['SIGBREAK', 128 + 21]
] as const;

export function addExitHook(hook: ExitHook) {
  if (typeof hook !== 'function') {
    throw new Error(`invalid argument, expected function but got ${typeof hook}`);
  }
  exitHooks.push(hook);
}

export function removeExitHook(hook: ExitHook) {
  exitHooks = exitHooks.filter((h) => h !== hook);
}

export function executeAllHooksAndTerminate(exitCode: number, extra: any) {
  runHooks({ category: 'manual', extra }).finally(() => process.exit(exitCode));
}

process.on('beforeExit', async (code) => {
  await runHooks({ category: 'trivial', exitCode: code });
});

process.on('exit', (code) => {
  runSyncHooks({ category: 'trivial', exitCode: code });
});

TRIGGER_ERRORS.forEach((errorType) => {
  process.on(errorType, async (errorOrReason: any) => {
    await runHooks({ category: 'exception', errorOrReason });
    process.exit(1);
  });
});

TRIGGER_SIGNALS.forEach(([signal, exitCode]) => {
  process.on(signal, async (signal) => {
    await runHooks({ category: 'signal', signal: signal as any });
    process.exit(exitCode);
  });
});

function runSyncHooks(reason: ExitReason) {
  const hooks = [...exitHooks]
    .filter((h) => !h._executed)
    .filter((h) => h.constructor.name !== 'AsyncFunction');
  for (const hook of hooks) {
    hook._executed = true;
    try {
      hook(reason);
    } catch {}
  }
}

async function runHooks(reason: ExitReason) {
  const hooks = [...exitHooks].filter((h) => !h._executed);
  for (const hook of hooks) {
    hook._executed = true;
    try {
      if (hook.constructor.name === 'AsyncFunction') {
        await hook(reason);
      } else {
        hook(reason);
      }
    } catch {}
  }
}
