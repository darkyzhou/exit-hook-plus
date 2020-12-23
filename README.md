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

### Examples

#### A `unhandledRejection` or `uncaughtException` event (exit code: `1`)

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
  // trigger an  event
  return Promise.reject(new Error('test error'));
})();
```

#### A `SIGHUP`, `SIGINT`, `SIGTERM` or `SIGBREAK` signal

the exit codes follow UNIX's convention:

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
