const { addExitHook, removeExitHook } = require('../../dist');

const hook1 = () => {
  console.log('1');
};

const hook2 = () => {
  console.log('2');
};

addExitHook(hook1);
addExitHook(hook2);
removeExitHook(hook1);
removeExitHook(hook2);
addExitHook(hook2);
