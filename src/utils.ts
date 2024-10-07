export type TReachedLimitError<T> = Error & {
  id?: typeof ERROR_ID_REACHED_LIMIT;
  values?: { lastResult?: T };
};
export type TCanceledError<T> = Error & {
  id?: typeof ERROR_ID_CANCEL;
  values?: { lastResult?: T };
};
export type TTargetFunction<T> = () => T;
export type TIsComplete<T> = (result: T) => boolean;

export type TCheckEnded<T> = ({
  resolve,
  reject,
  lastResult,
}: {
  resolve: (result: T) => void;
  reject: (error: TReachedLimitError<T> | TCanceledError<T> | unknown) => void;
  lastResult: T;
}) => void;

export const validateParams = ({
  targetFunction,
  isComplete,
}: {
  targetFunction?: any;
  isComplete?: any;
}) => {
  if (!targetFunction) {
    return { valid: false, error: new Error('targetFunction is required') };
  }

  if (!isComplete) {
    return { valid: false, error: new Error('isComplete is required') };
  }

  return { valid: true };
};
const ERROR_ID_REACHED_LIMIT = Symbol('call limit is reached');

export const createReachedLimitError = <T>(
  callLimit: number,
  lastResult?: T,
): TReachedLimitError<T> => {
  const error = new Error(`call limit (${callLimit}) is reached`) as TReachedLimitError<T>;

  error.id = ERROR_ID_REACHED_LIMIT;
  error.values = { lastResult };

  return error;
};

export const hasReachedLimitError = <T>(error: TReachedLimitError<T>) => {
  return error.id === ERROR_ID_REACHED_LIMIT;
};

const ERROR_ID_CANCEL = Symbol('canceled');

export const createCanceledError = <T>(lastResult?: T): TCanceledError<T> => {
  const error = new Error(`canceled`) as TCanceledError<T>;

  error.id = ERROR_ID_CANCEL;
  error.values = { lastResult };

  return error;
};

export const hasCanceledError = <T>(error: TCanceledError<T>) => {
  return error.id === ERROR_ID_CANCEL;
};

type TCancelablePromise<T> = Promise<T> & {
  cancel: () => void;
};

export const promisedCall = <T>(
  checkEnded: TCheckEnded<T>,
  {
    getLastResult,
    stopTimeout,
    onAfterCancel = () => {},
  }: { getLastResult: () => T; stopTimeout: () => void; onAfterCancel?: () => void },
): TCancelablePromise<T> => {
  let rejectOuter: (error: TReachedLimitError<T> | TCanceledError<T> | unknown) => void = () => {};
  const promise = new Promise<T>((resolve, reject) => {
    rejectOuter = reject;
    checkEnded({ resolve, reject, lastResult: getLastResult() });
  });

  const cancelablePromise: TCancelablePromise<T> = promise as TCancelablePromise<T>;

  cancelablePromise.cancel = () => {
    stopTimeout();
    rejectOuter(createCanceledError(getLastResult()));
    onAfterCancel();
  };

  return cancelablePromise;
};

export const rejectCancelablePromise = <T>(error?: Error): TCancelablePromise<T> => {
  const promise = Promise.reject<T>(error);

  const cancelablePromise: TCancelablePromise<T> = promise as TCancelablePromise<T>;

  cancelablePromise.cancel = () => {};

  return cancelablePromise;
};
