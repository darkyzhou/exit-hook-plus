const { addExitHook } = require('../../dist');

addExitHook(async (reason) => {
  console.log(JSON.stringify([reason.category, reason.exitCode]));
});
