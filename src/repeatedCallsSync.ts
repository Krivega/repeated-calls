import type { TCheckEnded, TIsComplete, TTargetFunction } from './utils';
import {
  createReachedLimitError,
  promisedCall,
  rejectCancelablePromise,
  validateParams,
} from './utils';

const repeatedCallsSync = <T = any>({
  targetFunction,
  isComplete,
  onAfterCancel,
  callLimit = Infinity,
  delay = 300,
}: {
  targetFunction: TTargetFunction<T>;
  isComplete: TIsComplete<T>;
  onAfterCancel?: () => void;
  callLimit?: number;
  delay?: number;
}) => {
  const validation = validateParams({ targetFunction, isComplete });

  if (!validation.valid) {
    return rejectCancelablePromise(validation.error);
  }

  let timeout: NodeJS.Timeout;
  let countCalls = 0;
  let lastResultSaved: T | undefined;

  const checkEnded: TCheckEnded<T> = ({ resolve, reject, lastResult }) => {
    clearTimeout(timeout);

    if (isComplete()) {
      return resolve();
    }

    if (countCalls >= callLimit) {
      return reject(createReachedLimitError<T>(callLimit, lastResult));
    }

    const result = targetFunction();

    lastResultSaved = result;

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

  const stopTimeout = () => {
    clearTimeout(timeout);
  };

  const getLastResult = () => {
    return lastResultSaved;
  };

  return promisedCall(checkEnded, { getLastResult, stopTimeout, onAfterCancel });
};

export default repeatedCallsSync;
