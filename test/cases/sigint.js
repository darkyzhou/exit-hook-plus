const { addExitHook } = require('../../dist');

addExitHook(async (reason) => {
  console.log(JSON.stringify([reason.category, reason.signal]));
});

// wait for signal
setTimeout(() => {}, 100000);
