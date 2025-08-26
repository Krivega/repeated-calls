# repeated-calls

Repeated calls to the function

[![npm](https://img.shields.io/npm/v/repeated-calls?style=flat-square)](https://www.npmjs.com/package/repeated-calls)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/repeated-calls?style=flat-square)

A stack of tasks that are executed one by one, but the result is taken from the last.
Identical functions on the stack (check by reference) are executed only once.

## Install

npm

```sh
npm install repeated-calls
```

yarn

```sh
yarn add repeated-calls
```

## Usage

```js
import repeatedCalls from 'repeated-calls';

const targetFunction = function innerTargetFunction() {
  innerTargetFunction.count = innerTargetFunction.count || 0;

  innerTargetFunction.count += 1;

  return innerTargetFunction.count;
};
const isComplete = (callCount) => callCount === 3;

return repeatedCalls({ targetFunction, isComplete }).then((callCount) => {
  console.log(callCount); // 3
});
```

### Complete if the limit is reached

```js
import repeatedCalls from 'repeated-calls';

const targetFunction = function innerTargetFunction() {
  innerTargetFunction.count = innerTargetFunction.count || 0;

  innerTargetFunction.count += 1;

  return innerTargetFunction.count;
};
const isComplete = (callCount) => callCount === 3;
const callLimit = 3;

return repeatedCalls({ targetFunction, isComplete, callLimit }).catch((error) => {
  console.log(error); // call limit (3) is reached
});
```

### Use async targetFunction

```js
import { repeatedCallsAsync } from 'repeated-calls';

const targetFunction = function innerTargetFunction() {
  innerTargetFunction.count = innerTargetFunction.count || 0;

  innerTargetFunction.count += 1;

  return Promise.resolve(innerTargetFunction.count);
};
const isComplete = (callCount) => callCount === 3;

return repeatedCallsAsync({ targetFunction, isComplete }).then((callCount) => {
  console.log(callCount); // 3
});
```

### Stop repeated calls

Both `repeatedCalls` and `repeatedCallsAsync` support stopping further attempts using `stopRepeatedCalls()` method:

```js
import { repeatedCallsAsync } from 'repeated-calls';

const targetFunction = async () => {
  // Simulate some async work
  await new Promise((resolve) => setTimeout(resolve, 100));
  return Math.random();
};

const isComplete = () => false; // Never complete
const promise = repeatedCallsAsync({ targetFunction, isComplete, callLimit: 1000 });

// Stop further calls after the current one completes
promise.stopRepeatedCalls();

promise.catch((error) => {
  if (error.message === 'canceled') {
    console.log('Repeated calls stopped');
  }
});
```

### Cancel execution

You can also cancel the execution immediately using `cancel()` method:

```js
import repeatedCalls from 'repeated-calls';

const targetFunction = () => Math.random();
const isComplete = () => false;
const promise = repeatedCalls({ targetFunction, isComplete, callLimit: 1000 });

// Cancel immediately
promise.cancel();

promise.catch((error) => {
  if (error.message === 'canceled') {
    console.log('Execution canceled');
  }
});
```

## API

### repeatedCalls(options)

Synchronous version for functions that return values directly.

**Options:**

- `targetFunction`: Function to call repeatedly
- `isComplete`: Function that determines if the result is complete
- `callLimit` (optional): Maximum number of calls (default: Infinity)
- `delay` (optional): Delay between calls in milliseconds (default: 300)
- `isCheckBeforeCall` (optional): Check completion before calling (default: true)
- `onAfterCancel` (optional): Callback after cancellation

**Returns:** Promise with methods:

- `cancel()`: Cancel execution immediately
- `stopRepeatedCalls()`: Stop further attempts after current call completes

### repeatedCallsAsync(options)

Asynchronous version for functions that return Promises.

**Options:**

- `targetFunction`: Async function to call repeatedly
- `isComplete`: Function that determines if the result is complete
- `callLimit` (optional): Maximum number of calls (default: Infinity)
- `delay` (optional): Delay between calls in milliseconds (default: 300)
- `isCheckBeforeCall` (optional): Check completion before calling (default: true)
- `isRejectAsValid` (optional): Treat rejections as valid results (default: false)
- `onAfterCancel` (optional): Callback after cancellation

**Returns:** Promise with methods:

- `cancel()`: Cancel execution immediately
- `stopRepeatedCalls()`: Stop further attempts after current call completes

## Run tests

```sh
npm test
```

## Maintainer

**Krivega Dmitriy**

- Website: <https://krivega.com>
- Github: [@Krivega](https://github.com/Krivega)

## Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/Krivega/repeated-calls/issues). You can also take a look at the [contributing guide](https://github.com/Krivega/repeated-calls/blob/master/CONTRIBUTING.md).

## 📝 License

Copyright © 2020 - 2025 [Krivega Dmitriy](https://github.com/Krivega).<br />
This project is [MIT](https://github.com/Krivega/repeated-calls/blob/master/LICENSE) licensed.
