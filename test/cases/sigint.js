const { addExitHook, disableDefaultExitLogger } = require('../../dist');

addExitHook(async (reason) => {
  console.log(JSON.stringify([reason.category, reason.signal]));
});

disableDefaultExitLogger();

// wait for signal
setTimeout(() => {}, 100000);
