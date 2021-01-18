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

## Run tests

```sh
npm test
```

## Maintainer

**Krivega Dmitriy**

- Website: https://krivega.com
- Github: [@Krivega](https://github.com/Krivega)

## Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/Krivega/repeated-calls/issues). You can also take a look at the [contributing guide](https://github.com/Krivega/repeated-calls/blob/master/CONTRIBUTING.md).

## 📝 License

Copyright © 2020 [Krivega Dmitriy](https://github.com/Krivega).<br />
This project is [MIT](https://github.com/Krivega/repeated-calls/blob/master/LICENSE) licensed.
