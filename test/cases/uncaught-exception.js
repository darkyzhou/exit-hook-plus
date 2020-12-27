const { addExitHook, disableDefaultExitLogger } = require('../../dist');

addExitHook(async (reason) => {
  console.log(JSON.stringify([reason.category, reason.errorOrReason.message]));
});

disableDefaultExitLogger();

throw new Error('test error');
