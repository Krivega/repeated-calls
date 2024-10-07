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
  isComplete: TIsComplete<TResult<T, E, B>>;
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

    if (isCheckBeforeCall && isComplete(lastResultSaved)) {
      return resolve(lastResultSaved);
    }

    if (countCalls >= callLimit) {
      return reject(createReachedLimitError(callLimit, lastResult));
    }

    try {
      lastResultSaved = await targetFunction();
    } catch (error) {
      lastResultSaved = error as E;

      if (!isRejectAsValid) {
        return reject(error);
      }
    }

    countCalls += 1;

    if (isComplete(lastResultSaved)) {
      return resolve(lastResultSaved);
    }

    if (delay && delay > 0) {
      timeout = setTimeout(() => {
        return checkEnded({ resolve, reject, lastResult: lastResultSaved });
      }, delay);
    } else {
      checkEnded({ resolve, reject, lastResult: lastResultSaved });
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
