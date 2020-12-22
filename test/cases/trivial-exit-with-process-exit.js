const { addExitHook } = require('../../dist');

addExitHook(async (reason) => {
  console.log(JSON.stringify([0, reason.category, reason.exitCode]));
});

addExitHook((reason) => {
  console.log(JSON.stringify([1, reason.category, reason.exitCode]));
});

process.exit(1);
