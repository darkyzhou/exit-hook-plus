const { addExitHook, disableDefaultExitLogger } = require('../../dist');

addExitHook(async (reason) => {
  console.log(JSON.stringify([reason.category, reason.errorOrReason.message]));
});

disableDefaultExitLogger();

(function () {
  return Promise.reject(new Error('test error'));
})();
