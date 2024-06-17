/// <reference types="jest" />

import { hasCanceledError, hasReachedLimitError, repeatedCallsAsync } from '../index';

describe('repeatedCallsAsync', () => {
  let targetFunction: () => Promise<number>;
  let targetFunctionRejected: () => Promise<number>;

  beforeEach(() => {
    const innerTargetFunctionResolved: (() => Promise<number>) & { count?: number } = () => {
      innerTargetFunctionResolved.count = innerTargetFunctionResolved.count || 0;

      innerTargetFunctionResolved.count += 1;

      return Promise.resolve<number>(innerTargetFunctionResolved.count);
    };
    const innerTargetFunctionRejected: (() => Promise<number>) & { count?: number } = () => {
      innerTargetFunctionRejected.count = innerTargetFunctionRejected.count || 0;

      innerTargetFunctionRejected.count += 1;

      return Promise.reject<number>(innerTargetFunctionRejected.count);
    };

    targetFunction = jest.fn(innerTargetFunctionResolved);
    targetFunctionRejected = jest.fn(innerTargetFunctionRejected);
  });

  it('calls end after 1', () => {
    expect.assertions(2);

    const isComplete = (callCount?: number | Error) => {
      return callCount === 1;
    };

    return repeatedCallsAsync<number>({ targetFunction, isComplete }).then((callCount) => {
      expect(callCount).toBe(1);
      expect(targetFunction).toHaveBeenCalledTimes(1);
    });
  });

  it('calls end after 3', () => {
    expect.assertions(2);

    const isComplete = (callCount?: number | Error) => {
      return callCount === 3;
    };

    return repeatedCallsAsync<number>({ targetFunction, isComplete }).then((callCount) => {
      expect(callCount).toBe(3);
      expect(targetFunction).toHaveBeenCalledTimes(3);
    });
  });

  it('calls for rejected with isRejectAsValid=false (by default)', () => {
    expect.assertions(2);

    const isComplete = (callCount?: number | Error) => {
      return callCount === 3;
    };

    return repeatedCallsAsync<number>({ isComplete, targetFunction: targetFunctionRejected }).catch(
      (callCount) => {
        expect(callCount).toBe(1);
        expect(targetFunctionRejected).toHaveBeenCalledTimes(1);
      },
    );
  });

  it('calls for rejected with isRejectAsValid=true', () => {
    expect.assertions(2);

    const isComplete = (callCount?: number | Error) => {
      return callCount === 3;
    };

    return repeatedCallsAsync<number>({
      isComplete,
      targetFunction: targetFunctionRejected,
      isRejectAsValid: true,
    }).then((callCount) => {
      expect(callCount).toBe(3);
      expect(targetFunctionRejected).toHaveBeenCalledTimes(3);
    });
  });

  it('delay', () => {
    expect.assertions(2);

    const numberCalls = 4;

    const isComplete = (callCount?: number | Error) => {
      return callCount === numberCalls;
    };
    const timeStarted = Date.now();
    const delay = 500;
    const timePassedMin = delay * (numberCalls - 1);
    const timePassedMax = delay * numberCalls;

    return repeatedCallsAsync<number>({ targetFunction, isComplete, delay }).then(() => {
      const timeEnded = Date.now();
      const timePassed = timeEnded - timeStarted;

      expect(timePassed).toBeLessThanOrEqual(timePassedMax);
      expect(timePassed).toBeGreaterThanOrEqual(timePassedMin);
    });
  });

  it('delay 0', () => {
    expect.assertions(1);

    const numberCalls = 4;

    const isComplete = (callCount?: number | Error) => {
      return callCount === numberCalls;
    };
    const timeStarted = Date.now();
    const delay = 0;
    const timePassedMax = 1;

    return repeatedCallsAsync<number>({ targetFunction, isComplete, delay }).then(() => {
      const timeEnded = Date.now();
      const timePassed = timeEnded - timeStarted;

      expect(timePassed).toBeLessThanOrEqual(timePassedMax);
    });
  });

  it('complete if the limit is reached', () => {
    expect.assertions(4);

    const isComplete = (callCount?: number | Error) => {
      return callCount === 5;
    };
    const callLimit = 3;

    return repeatedCallsAsync<number>({
      targetFunction,
      isComplete,
      callLimit,
    }).catch((error) => {
      expect(hasReachedLimitError(error)).toBe(true);
      expect(error.message).toBe(`call limit (${callLimit}) is reached`);
      expect(error.values.lastResult).toBe(callLimit);
      expect(targetFunction).toHaveBeenCalledTimes(3);
    });
  });

  it('complete when canceled', () => {
    expect.assertions(4);

    const isComplete = () => {
      return false;
    };
    const callLimit = 9999;

    const promise = repeatedCallsAsync<number>({
      targetFunction,
      isComplete,
      callLimit,
    });

    promise.cancel();

    return promise.catch((error) => {
      expect(hasCanceledError(error)).toBe(true);
      expect(error.message).toBe(`canceled`);
      expect(error.values.lastResult).toBe(undefined);
      expect(targetFunction).toHaveBeenCalledTimes(1);
    });
  });

  it('onAfterCancel called when canceled', () => {
    expect.assertions(1);

    const onAfterCancel = jest.fn();

    const isComplete = () => {
      return false;
    };
    const callLimit = 9999;

    const promise = repeatedCallsAsync<number>({
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

  it('complete if the limit is reached: for rejected with isRejectAsValid', () => {
    expect.assertions(4);

    const isComplete = (callCount?: number | Error) => {
      return callCount === 5;
    };
    const callLimit = 3;

    return repeatedCallsAsync<number>({
      isComplete,
      callLimit,
      targetFunction: targetFunctionRejected,
      isRejectAsValid: true,
    }).catch((error) => {
      expect(hasReachedLimitError(error)).toBe(true);
      expect(error.message).toBe(`call limit (${callLimit}) is reached`);
      expect(error.values.lastResult).toBe(callLimit);
      expect(targetFunctionRejected).toHaveBeenCalledTimes(3);
    });
  });
});
