# exit-hook-plus

Do something and then automatically call `process.exit` when these cases happen:

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

### Warnings

#### Asynchronous hooks and `process.exit()`

If the program is called to exit using `process.exit()`, only the synchronous hooks will be executed rather than the asynchronous ones because during the process the event loop is no longer available. For details, check out https://nodejs.org/api/process.html#process_event_exit.

#### Windows and `process.kill(signal)`

According to [Tappi/async-exit-hook](https://github.com/Tapppi/async-exit-hook/blob/master/readme.md#windows-and-processkillsignal).
On windows `process.kill(signal)` immediately kills the process, and does not fire signal events, and as such, cannot be used to gracefully exit.

#### Hook `unhandledRejection` and `uncaughtException` events properly

The correct use of hooking them is mainly to perform cleanup of allocated resources (e.g. file descriptors, connections, etc) before shutting down the process.
It is not safe to resume normal operation after these events happened. For details, please refer to https://nodejs.org/api/process.html#process_warning_using_uncaughtexception_correctly.

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
  // trigger an unhandledRejection event
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

####

## Reference

- https://github.com/Tapppi/async-exit-hook
- https://nodejs.org/api/process.html
- https://blog.heroku.com/best-practices-nodejs-errors
