import type { TCheckEnded, TIsComplete, TTargetFunction } from './utils';
import {
  createReachedLimitError,
  promisedCall,
  rejectCancelablePromise,
  validateParams,
} from './utils';

const repeatedCallsAsync = <T = any, E = Error>({
  targetFunction,
  isComplete,
  callLimit = Infinity,
  isRejectAsValid = false,
  delay = 300,
}: {
  targetFunction: TTargetFunction<Promise<T>>;
  isComplete: TIsComplete<T | E>;
  callLimit?: number;
  isRejectAsValid?: boolean;
  delay?: number;
}) => {
  type TResult = T | E;

  const validation = validateParams({ targetFunction, isComplete });

  if (!validation.valid) {
    return rejectCancelablePromise(validation.error);
  }

  let timeout: NodeJS.Timeout;
  let countCalls = 0;
  let lastResultSaved: T | undefined;

  const checkEnded: TCheckEnded<TResult> = async ({ resolve, reject, lastResult }) => {
    clearTimeout(timeout);

    if (isComplete()) {
      return resolve();
    }

    if (countCalls >= callLimit) {
      return reject(createReachedLimitError(callLimit, lastResult));
    }

    let result: TResult;

    try {
      result = await targetFunction();
      lastResultSaved = result;
    } catch (error) {
      result = error as E;

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

  const stopTimeout = () => {
    clearTimeout(timeout);
  };

  const getLastResult = () => {
    return lastResultSaved;
  };

  return promisedCall(checkEnded, { getLastResult, stopTimeout });
};

export default repeatedCallsAsync;
