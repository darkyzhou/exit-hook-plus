# exit-hook-plus

![](https://github.com/darkyzhou/exit-hook-plus/workflows/Node.js%20CI/badge.svg)

Do something and then automatically exit the program when these cases happen:

- an `unhandledRejection` or `uncaughtException` event occurred
- received a `SIGHUP`, `SIGINT`, `SIGTERM` or `SIGBREAK` signal

Or do something before the program exits due to:

- No more operations are pending (normal exit)
- a `process.exit` call (synchronous hooks only, read the text below)

## Install

The library comes with `.d.ts`, so you are free from installing something like `@types/exit-hook-plus`.

```text
$ npm install exit-hook-plus
```

## Usage

### APIs

```typescript
// Remove the default exit logger for exit reasons with category 'exception' and 'signal'.
// For category 'exception' reasons, the logger will print 'the program is now exiting due to unhandled exception: (reason.errorOrReason or its stack when it's an error)'.
// For category 'signal' reasons, the logger will print 'the program is now exiting due to receiving signal: (signal name)'.
function disableDefaultExitLogger() {}

// Add an exit hook function.
// The function can be either sync or async.
// When using async hooks, you should be aware that they will NOT be executed if you manually
// call process.exit to termintate the program, see the "Warnings" below.
function addExitHook(hook: ExitHook) {}

// Remove an existing hook function.
// It will do nothing if the given hook does not exist.
function removeExitHook(hook: ExitHook) {}

// Pass the 'extra' object to all the hooks and automatically call process.exit with 'exitCode'.
// Notice that by this way you are free from the async hook issue above.
// It is a sync function but under the hood it asynchronously executes the hooks and terminate the program
// so you should treat it as the last action in your program and DO NOT run other codes after calling it.
// If you call it without any arguments, the exitCode will default to 0 and extra to undefined.
function executeAllHooksAndTerminate(exitCode: number = 0, extra?: any) {}
```

### Examples

#### A `unhandledRejection` or `uncaughtException` event

In this case, `exit-hook-plus` will **automatically terminate the program with exit code 1** after executing all the exit hook functions.

```javascript
const { addExitHook } = require('exit-hook-plus');

// the hook can be either async or sync
// it will be executed after the Promise.reject is called
addExitHook(async (reason) => {
  // reason.category === 'exception'
  // reason.errorOrReason is the argument of Promise.reject() in this case
  // so reason.errorOrReason.message === 'test error'
  console.dir(reason);
});

(function () {
  // trigger an unhandledRejection event
  return Promise.reject(new Error('test error'));
})();
```

#### A `SIGHUP`, `SIGINT`, `SIGTERM` or `SIGBREAK` signal

In this case, `exit-hook-plus` will terminate the program with following exit code after executing all the exit hook functions:

- `SIGUP`: 128+1 = 129
- `SIGINT`: 128+2 = 130
- `SIGTERM`: 128+15 = 143
- `SIGBREAK`: 128+21 = 149

```javascript
const { addExitHook } = require('exit-hook-plus');

// the hook can be either async or sync
// it will be executed after a SIGHUP, SIGINT, SIGTERM or SIGBREAK signal was sent
// you can try it manually by pressing Ctrl+C to emit an SIGINT signal
addExitHook(async (reason) => {
  // reason.category === 'signal'
  // reason.signal === 'SIGINT'
  console.dir(reason);
});

// wait for signals
setTimeout(() => {}, 100000);
```

#### A normal exit or a `process.exit` call

```javascript
const { addExitHook } = require('exit-hook-plus');

// when you use process.exit to end the process
// no async hooks can be used!
addExitHook((reason) => {
  // reason.category === 'trivial'
  // reason.exitCode === 88
  console.dir(reason);
});

process.exit(88);
```

#### A real world example

```javascript
const { addExitHook, executeAllHooksAndTerminate } = require('exit-hook-plus');

// we initialize connections to kafka and mongodb
// and add the exit hook for disconnect functions
// it's a bit like the 'defer' keyword in golang :D
console.info('connecting to kafka');
await kafkaDataConsumer.connect();
for (const topic of TARGET_TOPICS) {
  await kafkaDataConsumer.subscribe({ topic });
}
addExitHook(async () => await kafkaDataConsumer.disconnect());

console.info('connecting to mongodb');
await mongo.connect();
addExitHook(async () => await mongo.close());

if (liveStreamEnded) {
  console.info('live stream ended, program will exit soon');
  // now terminate the program
  // here we should NOT use process.exit because it will make async hooks unable to execute, see the "Warnings" below
  executeAllHooksAndTerminate();
}
```

### Warnings

#### Hooks and `try-catch`

All the hooks specified by `addExitHook(...)` will each run with `try-catch` folded under the hood and remains quiet even if it runs into error.
As a result, you should prepare your own `try-catch` block in the hook function if needed.

#### Asynchronous hooks and `process.exit()`

If the program is called to exit using `process.exit()`, only the synchronous hooks will be executed rather than the asynchronous ones because during the process the event loop is no longer available. For details, check out https://nodejs.org/api/process.html#process_event_exit.

#### Windows and `process.kill(signal)`

According to [Tappi/async-exit-hook](https://github.com/Tapppi/async-exit-hook/blob/master/readme.md#windows-and-processkillsignal).
On windows `process.kill(signal)` immediately kills the process, and does not fire signal events, and as such, cannot be used to gracefully exit.

#### Hook `unhandledRejection` and `uncaughtException` events properly

The correct use of hooking them is mainly to perform cleanup of allocated resources (e.g. file descriptors, connections, etc) before shutting down the process.
It is not safe to resume normal operation after these events happened. For details, please refer to https://nodejs.org/api/process.html#process_warning_using_uncaughtexception_correctly.

## Compatibility

The library is written in TypeScript 4.1.3 and Node v14, but is compiled into ES5 and tested in Node v10, v12 and v14 environment.

## Reference

- https://github.com/Tapppi/async-exit-hook
- https://nodejs.org/api/process.html
- https://blog.heroku.com/best-practices-nodejs-errors
