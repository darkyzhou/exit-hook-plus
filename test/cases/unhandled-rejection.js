const { addExitHook } = require('../../dist');

addExitHook(async (reason) => {
  console.log(JSON.stringify([reason.category, reason.errorOrReason.message]));
});

(function () {
  return Promise.reject(new Error('test error'));
})();
