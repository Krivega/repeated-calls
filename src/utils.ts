export type TCustomError<T> = Error & {
  id?: typeof ERROR_ID;
  values?: { lastResult?: T };
};
export type TTargetFunction<T> = () => T;
export type TIsComplete<T> = (result?: T) => boolean;

export type TCheckEnded<T> = ({
  resolve,
  reject,
  lastResult,
}: {
  resolve: (result?: T) => void;
  reject: (error: TCustomError<T> | unknown) => void;
  lastResult?: T;
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
const ERROR_ID = Symbol('call limit is reached');

export const createError = <T>(callLimit: number, lastResult?: T): TCustomError<T> => {
  const error = new Error(`call limit (${callLimit}) is reached`) as TCustomError<T>;

  error.id = ERROR_ID;
  error.values = { lastResult };

  return error;
};

export const hasReachedLimitError = <T>(error: TCustomError<T>) => {
  return error.id === ERROR_ID;
};

export const promisedCall = <T>(checkEnded: TCheckEnded<T>) => {
  return new Promise<T | undefined>((resolve, reject) => {
    checkEnded({ resolve, reject });
  });
};
