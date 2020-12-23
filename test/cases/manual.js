const { addExitHook, executeAllHooksAndTerminate } = require('../../dist');

addExitHook(async (reason) => {
  console.log(JSON.stringify([reason.category, reason.extra]));
});

executeAllHooksAndTerminate(99, 'test data');
