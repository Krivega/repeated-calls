/* eslint-disable require-atomic-updates */
import {
  createCanceledError,
  createReachedLimitError,
  promisedCall,
  rejectCancelablePromise,
  validateParams,
} from './utils';

import type { TCheckEnded, TIsComplete, TTargetFunction } from './utils';

type TResult<T, E, B> = B extends true ? T | E | undefined : T | E;

const repeatedCallsAsync = <T = unknown, E = Error, B extends boolean = boolean>({
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
  // eslint-disable-next-line @typescript-eslint/promise-function-async
}) => {
  const validation = validateParams({ targetFunction, isComplete });

  if (!validation.valid) {
    return rejectCancelablePromise<TResult<T, E, B>>(validation.error);
  }

  let timeout: NodeJS.Timeout;
  let countCalls = 0;
  let lastResultSaved: TResult<T, E, B>;
  let isStopRequested = false;

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const checkEnded: TCheckEnded<TResult<T, E, B>> = async ({ resolve, reject, lastResult }) => {
    clearTimeout(timeout);

    if (!isStopRequested && isCheckBeforeCall && isComplete(lastResultSaved)) {
      resolve(lastResultSaved);

      return;
    }

    if (!isStopRequested && countCalls >= callLimit) {
      reject(createReachedLimitError(callLimit, lastResult));

      return;
    }

    if (isStopRequested) {
      reject(createCanceledError());

      if (onAfterCancel) {
        onAfterCancel();
      }

      return;
    }

    try {
      lastResultSaved = await targetFunction();
    } catch (error) {
      lastResultSaved = error as E;

      if (!isRejectAsValid) {
        reject(error);

        return;
      }
    }

    countCalls += 1;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (isStopRequested) {
      reject(createCanceledError());

      if (onAfterCancel) {
        onAfterCancel();
      }

      return;
    }

    if (isComplete(lastResultSaved)) {
      resolve(lastResultSaved);

      return;
    }

    if (delay && delay > 0) {
      timeout = setTimeout(() => {
        checkEnded({ resolve, reject, lastResult: lastResultSaved });
      }, delay);
    } else {
      checkEnded({ resolve, reject, lastResult: lastResultSaved });
    }
  };

  const stopTimeout = () => {
    clearTimeout(timeout);
  };

  const getLastResult = () => {
    return lastResultSaved;
  };

  return promisedCall<TResult<T, E, B>>(checkEnded, {
    getLastResult,
    stopTimeout,
    onAfterCancel,
    onStopRepeatedCalls: () => {
      isStopRequested = true;
    },
  });
};

export default repeatedCallsAsync;
