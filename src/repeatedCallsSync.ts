import type { TCheckEnded, TIsComplete, TTargetFunction } from './utils';
import {
  createReachedLimitError,
  promisedCall,
  rejectCancelablePromise,
  validateParams,
} from './utils';

type TResult<T, B> = B extends true ? T | undefined : T;

const repeatedCallsSync = <T = unknown, B extends boolean = boolean>({
  targetFunction,
  isComplete,
  onAfterCancel,
  callLimit = Infinity,
  delay = 300,
  isCheckBeforeCall = true as B,
}: {
  targetFunction: TTargetFunction<T>;
  isComplete: TIsComplete<TResult<T, B>>;
  onAfterCancel?: () => void;
  callLimit?: number;
  delay?: number;
  isCheckBeforeCall?: B;
}) => {
  const validation = validateParams({ targetFunction, isComplete });

  if (!validation.valid) {
    return rejectCancelablePromise<TResult<T, B>>(validation.error);
  }

  let timeout: NodeJS.Timeout;
  let countCalls = 0;
  let lastResultSaved: TResult<T, B>;

  const checkEnded: TCheckEnded<TResult<T, B>> = ({ resolve, reject, lastResult }) => {
    clearTimeout(timeout);

    if (isCheckBeforeCall && isComplete(lastResultSaved)) {
      return resolve(lastResultSaved);
    }

    if (countCalls >= callLimit) {
      return reject(createReachedLimitError<T>(callLimit, lastResult));
    }

    lastResultSaved = targetFunction();

    countCalls += 1;

    if (isComplete(lastResultSaved)) {
      return resolve(lastResultSaved);
    }

    if (delay && delay > 0) {
      timeout = setTimeout(() => {
        return checkEnded({ resolve, reject, lastResult: lastResultSaved });
      }, delay);

      return undefined;
    }

    return checkEnded({ resolve, reject, lastResult: lastResultSaved });
  };

  const stopTimeout = () => {
    clearTimeout(timeout);
  };

  const getLastResult = () => {
    return lastResultSaved;
  };

  return promisedCall<TResult<T, B>>(checkEnded, { getLastResult, stopTimeout, onAfterCancel });
};

export default repeatedCallsSync;
