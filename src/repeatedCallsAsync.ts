import { validateParams, createError, promisedCall } from './utils';
import type { TTargetFunction, TIsComplete, TCheckEnded } from './utils';

const repeatedCallsAsync = <T = any>({
  targetFunction,
  isComplete,
  callLimit = Infinity,
  isRejectAsValid = false,
  delay = 300,
}: {
  targetFunction: TTargetFunction<Promise<T>>;
  isComplete: TIsComplete<T>;
  callLimit?: number;
  isRejectAsValid?: boolean;
  delay?: number;
}) => {
  const validation = validateParams({ targetFunction, isComplete });

  if (!validation.valid) {
    return Promise.reject(validation.error);
  }

  let timeout: NodeJS.Timeout;
  let countCalls = 0;
  const checkEnded: TCheckEnded<T> = async ({ resolve, reject, lastResult }) => {
    clearTimeout(timeout);

    if (isComplete()) {
      return resolve();
    }

    if (countCalls >= callLimit) {
      return reject(createError(callLimit, lastResult));
    }

    let result: T;

    try {
      result = await targetFunction();
    } catch (error) {
      result = error as T;

      if (!isRejectAsValid) {
        return reject(error);
      }
    }

    countCalls += 1;

    if (isComplete(result)) {
      return resolve(result);
    }

    if (delay && delay > 0) {
      timeout = setTimeout(() => {
        return checkEnded({ resolve, reject, lastResult: result });
      }, delay);
    } else {
      checkEnded({ resolve, reject, lastResult: result });
    }

    return undefined;
  };

  return promisedCall(checkEnded);
};

export default repeatedCallsAsync;
