import {
  createReachedLimitError,
  promisedCall,
  rejectCancelablePromise,
  validateParams,
} from './utils';

import type { TCheckEnded, TIsComplete, TTargetFunction } from './utils';

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
  // eslint-disable-next-line @typescript-eslint/promise-function-async
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
      resolve(lastResultSaved);

      return;
    }

    if (countCalls >= callLimit) {
      reject(createReachedLimitError<T>(callLimit, lastResult));

      return;
    }

    lastResultSaved = targetFunction();

    countCalls += 1;

    if (isComplete(lastResultSaved)) {
      resolve(lastResultSaved);

      return;
    }

    if (delay && delay > 0) {
      timeout = setTimeout(() => {
        checkEnded({ resolve, reject, lastResult: lastResultSaved });
      }, delay);

      return;
    }

    checkEnded({ resolve, reject, lastResult: lastResultSaved });
  };

  const stopTimeout = () => {
    clearTimeout(timeout);
  };

  const getLastResult = () => {
    return lastResultSaved;
  };

  return promisedCall<TResult<T, B>>(checkEnded, {
    getLastResult,
    stopTimeout,
    onAfterCancel,
    onStopRepeatedCalls: ({ cancelablePromise }) => {
      cancelablePromise.cancel();
    },
  });
};

export default repeatedCallsSync;
