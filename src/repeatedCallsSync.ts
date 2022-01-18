import { validateParams, createError, promisedCall } from './utils';
import type { TTargetFunction, TIsComplete, TCheckEnded } from './utils';

const repeatedCallsSync = <T = any>({
  targetFunction,
  isComplete,
  callLimit = Infinity,
  delay = 300,
}: {
  targetFunction: TTargetFunction<T>;
  isComplete: TIsComplete<T>;
  callLimit?: number;
  delay?: number;
}) => {
  const validation = validateParams({ targetFunction, isComplete });

  if (!validation.valid) {
    return Promise.reject(validation.error);
  }

  let timeout: NodeJS.Timeout;
  let countCalls = 0;
  const checkEnded: TCheckEnded<T> = ({ resolve, reject, lastResult }) => {
    clearTimeout(timeout);

    if (isComplete()) {
      return resolve();
    }

    if (countCalls >= callLimit) {
      return reject(createError<T>(callLimit, lastResult));
    }

    const result = targetFunction();

    countCalls += 1;

    if (isComplete(result)) {
      return resolve(result);
    }

    if (delay && delay > 0) {
      timeout = setTimeout(() => {
        return checkEnded({ resolve, reject, lastResult: result });
      }, delay);

      return undefined;
    }

    return checkEnded({ resolve, reject, lastResult: result });
  };

  return promisedCall(checkEnded);
};

export default repeatedCallsSync;
