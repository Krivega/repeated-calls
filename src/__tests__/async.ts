/* eslint-disable jest/no-conditional-expect */
/// <reference types="jest" />

import { hasCanceledError, hasReachedLimitError, repeatedCallsAsync } from '../index';

import type { TCanceledError, TReachedLimitError } from '../utils';

describe('repeatedCallsAsync', () => {
  let targetFunction: () => Promise<number>;
  let targetFunctionRejected: () => Promise<number>;

  beforeEach(() => {
    const innerTargetFunctionResolved: (() => Promise<number>) & { count?: number } = async () => {
      innerTargetFunctionResolved.count ??= 0;

      innerTargetFunctionResolved.count += 1;

      return innerTargetFunctionResolved.count;
    };
    const innerTargetFunctionRejected: (() => Promise<number>) & { count?: number } = async () => {
      innerTargetFunctionRejected.count ??= 0;

      innerTargetFunctionRejected.count += 1;

      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw innerTargetFunctionRejected.count;
    };

    targetFunction = jest.fn(innerTargetFunctionResolved);
    targetFunctionRejected = jest.fn(innerTargetFunctionRejected);
  });

  it('calls end after 1', async () => {
    expect.assertions(2);

    const isComplete = (callCount?: number | Error) => {
      return callCount === 1;
    };

    return repeatedCallsAsync<number>({ targetFunction, isComplete }).then((callCount) => {
      expect(callCount).toBe(1);
      expect(targetFunction).toHaveBeenCalledTimes(1);
    });
  });

  it('calls end after 3', async () => {
    expect.assertions(2);

    const isComplete = (callCount?: number | Error) => {
      return callCount === 3;
    };

    return repeatedCallsAsync<number, Error, false>({ targetFunction, isComplete }).then(
      (callCount) => {
        expect(callCount).toBe(3);
        expect(targetFunction).toHaveBeenCalledTimes(3);
      },
    );
  });

  it('calls for rejected with isRejectAsValid=false (by default)', async () => {
    expect.assertions(2);

    const isComplete = (callCount?: number | Error) => {
      return callCount === 3;
    };

    return repeatedCallsAsync<number, Error, false>({
      isComplete,
      targetFunction: targetFunctionRejected,
    }).catch((error: unknown) => {
      expect(error).toBe(1);
      expect(targetFunctionRejected).toHaveBeenCalledTimes(1);
    });
  });

  it('calls for rejected with isRejectAsValid=true', async () => {
    expect.assertions(2);

    const isComplete = (callCount?: number | Error) => {
      return callCount === 3;
    };

    return repeatedCallsAsync<number, Error, false>({
      isComplete,
      targetFunction: targetFunctionRejected,
      isRejectAsValid: true,
    }).then((callCount) => {
      expect(callCount).toBe(3);
      expect(targetFunctionRejected).toHaveBeenCalledTimes(3);
    });
  });

  it('delay', async () => {
    expect.assertions(2);

    const numberCalls = 4;

    const isComplete = (callCount?: number | Error) => {
      return callCount === numberCalls;
    };
    const timeStarted = Date.now();
    const delay = 500;
    const timePassedMin = delay * (numberCalls - 1);
    const timePassedMax = delay * numberCalls;

    return repeatedCallsAsync<number, Error, false>({ targetFunction, isComplete, delay }).then(
      () => {
        const timeEnded = Date.now();
        const timePassed = timeEnded - timeStarted;

        expect(timePassed).toBeLessThanOrEqual(timePassedMax);
        expect(timePassed).toBeGreaterThanOrEqual(timePassedMin);
      },
    );
  });

  it('delay 0', async () => {
    expect.assertions(1);

    const numberCalls = 4;

    const isComplete = (callCount?: number | Error) => {
      return callCount === numberCalls;
    };
    const timeStarted = Date.now();
    const delay = 0;
    const timePassedMax = 1;

    return repeatedCallsAsync<number, Error, false>({ targetFunction, isComplete, delay }).then(
      () => {
        const timeEnded = Date.now();
        const timePassed = timeEnded - timeStarted;

        expect(timePassed).toBeLessThanOrEqual(timePassedMax);
      },
    );
  });

  it('complete if the limit is reached', async () => {
    expect.assertions(4);

    const isComplete = (callCount?: number | Error) => {
      return callCount === 5;
    };
    const callLimit = 3;

    return repeatedCallsAsync<number, Error, false>({
      targetFunction,
      isComplete,
      callLimit,
    }).catch((error: unknown) => {
      expect(hasReachedLimitError(error)).toBe(true);
      expect((error as TReachedLimitError).message).toBe(`call limit (${callLimit}) is reached`);
      expect((error as TReachedLimitError).values?.lastResult).toBe(callLimit);
      expect(targetFunction).toHaveBeenCalledTimes(3);
    });
  });

  it('complete when canceled', async () => {
    expect.assertions(4);

    const isComplete = () => {
      return false;
    };
    const callLimit = 9999;

    const promise = repeatedCallsAsync<number, Error, false>({
      targetFunction,
      isComplete,
      callLimit,
    });

    promise.cancel();

    return promise.catch((error: unknown) => {
      expect(hasCanceledError(error)).toBe(true);
      expect((error as TCanceledError).message).toBe('canceled');
      expect((error as TCanceledError).values?.lastResult).toBe(undefined);
      expect(targetFunction).toHaveBeenCalledTimes(1);
    });
  });

  it('onAfterCancel called when canceled', async () => {
    expect.assertions(1);

    const onAfterCancel = jest.fn();

    const isComplete = () => {
      return false;
    };
    const callLimit = 9999;

    const promise = repeatedCallsAsync<number, Error, false>({
      targetFunction,
      isComplete,
      callLimit,
      onAfterCancel,
    });

    promise.cancel();

    return promise.catch(() => {
      expect(onAfterCancel).toHaveBeenCalledTimes(1);
    });
  });

  it('complete if the limit is reached: for rejected with isRejectAsValid', async () => {
    expect.assertions(4);

    const isComplete = (callCount?: number | Error) => {
      return callCount === 5;
    };
    const callLimit = 3;

    return repeatedCallsAsync<number, Error, false>({
      isComplete,
      callLimit,
      targetFunction: targetFunctionRejected,
      isRejectAsValid: true,
    }).catch((error: unknown) => {
      expect(hasReachedLimitError(error)).toBe(true);
      expect((error as TReachedLimitError).message).toBe(`call limit (${callLimit}) is reached`);
      expect((error as TReachedLimitError).values?.lastResult).toBe(callLimit);
      expect(targetFunctionRejected).toHaveBeenCalledTimes(3);
    });
  });

  it('should not be checked isComplete before the call when isCheckBeforeCall is false', async () => {
    expect.assertions(2);

    const isComplete = jest.fn((callCount: number | Error) => {
      return callCount === 1;
    });

    await repeatedCallsAsync<number, Error, false>({
      targetFunction,
      isComplete,
      isCheckBeforeCall: false,
    });

    expect(isComplete).toHaveBeenCalledTimes(1);
    expect(targetFunction).toHaveBeenCalledTimes(1);
  });

  it('should be checked isComplete before the call when isCheckBeforeCall is true', async () => {
    expect.assertions(2);

    const isComplete = jest.fn((callCount?: number | Error) => {
      return callCount === 1;
    });

    await repeatedCallsAsync<number, Error, true>({
      targetFunction,
      isComplete,
      isCheckBeforeCall: true,
    });

    expect(isComplete).toHaveBeenCalledTimes(2);
    expect(targetFunction).toHaveBeenCalledTimes(1);
  });

  it('should throw "call limit (1) is reached" instead of the original error if the first call fails and callLimit=1 with isRejectAsValid=true', async () => {
    expect.assertions(5);

    class CustomError extends Error {
      public constructor() {
        super('CustomError error');
        this.name = 'CustomError';
      }
    }

    const targetFunctionRejectedCustomError = jest.fn(async () => {
      throw new CustomError();
    });

    const isComplete = () => {
      return false;
    };
    const callLimit = 1;

    try {
      await repeatedCallsAsync<number, Error, false>({
        targetFunction: targetFunctionRejectedCustomError,
        isComplete,
        callLimit,
        isRejectAsValid: true,
      });
    } catch (error) {
      expect(hasReachedLimitError(error)).toBe(true);
      expect((error as Error).message).toBe('call limit (1) is reached');
      // Проверяем, что ошибка не CustomError
      expect(error).not.toBeInstanceOf(CustomError);
      expect((error as TReachedLimitError<CustomError>).values?.lastResult).toBeInstanceOf(
        CustomError,
      );
      expect((error as TReachedLimitError<CustomError>).values?.lastResult?.message).toBe(
        'CustomError error',
      );
    }
  });

  it('should stop calls when stopRepeatedCalls is called before targetFunction completes', async () => {
    expect.assertions(7);

    let testState = 0;

    const targetFunctionDelayed = jest.fn(async () => {
      const promise = new Promise<number>((resolve) => {
        setTimeout(() => {
          resolve(42);
        }, 100);
      });

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      promise.then(() => {
        testState += 1;
      });

      return promise;
    });

    const isComplete = () => {
      return testState === 1;
    };

    const promise = repeatedCallsAsync<number, Error, false>({
      targetFunction: targetFunctionDelayed,
      isComplete,
      callLimit: 9999,
    });

    promise.stopRepeatedCalls();

    try {
      await promise;
    } catch (error) {
      expect(hasCanceledError(error)).toBe(true);
      expect((error as TCanceledError<number>).message).toBe('canceled');
      expect((error as TCanceledError<number>).values?.lastResult).toBe(undefined);
      expect(testState).toBe(1);
    }

    // Проверяем, что targetFunction был вызван
    expect(targetFunctionDelayed).toHaveBeenCalledTimes(1);

    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });

    // Проверяем, что targetFunction не был вызван еще раз
    expect(targetFunctionDelayed).toHaveBeenCalledTimes(1);
    expect(testState).toBe(1);
  });
});
