import type { TCheckEnded, TIsComplete, TTargetFunction } from './utils';
import {
  createReachedLimitError,
  promisedCall,
  rejectCancelablePromise,
  validateParams,
} from './utils';

type TResult<T, E, B> = B extends true ? T | E | undefined : T | E;

const repeatedCallsAsync = <T = any, E = Error, B extends boolean = boolean>({
  targetFunction,
  isComplete,
  onAfterCancel,
  callLimit = Infinity,
  isRejectAsValid = false,
  delay = 300,
  isCheckBeforeCall = true as B,
}: {
  targetFunction: TTargetFunction<Promise<T>>;
  isComplete: TIsComplete<T | E>;
  onAfterCancel?: () => void;
  callLimit?: number;
  isRejectAsValid?: boolean;
  delay?: number;
  isCheckBeforeCall?: B;
}) => {
  const validation = validateParams({ targetFunction, isComplete });

  if (!validation.valid) {
    return rejectCancelablePromise<TResult<T, E, B>>(validation.error);
  }

  let timeout: NodeJS.Timeout;
  let countCalls = 0;
  let lastResultSaved: TResult<T, E, B>;

  const checkEnded: TCheckEnded<TResult<T, E, B>> = async ({ resolve, reject, lastResult }) => {
    clearTimeout(timeout);

    if (isCheckBeforeCall && isComplete()) {
      return resolve(lastResultSaved);
    }

    if (countCalls >= callLimit) {
      return reject(createReachedLimitError(callLimit, lastResult));
    }

    let result: TResult<T, E, B>;

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

  return promisedCall<TResult<T, E, B>>(checkEnded, { getLastResult, stopTimeout, onAfterCancel });
};

export default repeatedCallsAsync;
