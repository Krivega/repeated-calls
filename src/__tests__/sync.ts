/// <reference types="jest" />

import { hasCanceledError, hasReachedLimitError, repeatedCalls } from '../index';

describe('repeatedCalls', () => {
  let targetFunction: () => number;

  beforeEach(() => {
    const innerTargetFunction: (() => number) & { count?: number } = () => {
      innerTargetFunction.count = innerTargetFunction.count || 0;

      innerTargetFunction.count += 1;

      return innerTargetFunction.count;
    };

    targetFunction = jest.fn(innerTargetFunction);
    targetFunction = jest.fn(innerTargetFunction);
  });
  it('calls end after 1', () => {
    expect.assertions(2);

    const isComplete = (callCount?: number) => {
      return callCount === 1;
    };

    return repeatedCalls<number>({ targetFunction, isComplete }).then((callCount) => {
      expect(callCount).toBe(1);
      expect(targetFunction).toHaveBeenCalledTimes(1);
    });
  });

  it('calls end after 3', () => {
    expect.assertions(2);

    const isComplete = (callCount?: number) => {
      return callCount === 3;
    };

    return repeatedCalls<number>({ targetFunction, isComplete }).then((callCount) => {
      expect(callCount).toBe(3);
      expect(targetFunction).toHaveBeenCalledTimes(3);
    });
  });

  it('delay', () => {
    expect.assertions(2);

    const numberCalls = 4;

    const isComplete = (callCount?: number) => {
      return callCount === numberCalls;
    };
    const timeStarted = Date.now();
    const delay = 500;
    const timePassedMin = delay * (numberCalls - 1);
    const timePassedMax = delay * numberCalls;

    return repeatedCalls<number>({ targetFunction, isComplete, delay }).then(() => {
      const timeEnded = Date.now();
      const timePassed = timeEnded - timeStarted;

      expect(timePassed).toBeLessThanOrEqual(timePassedMax);
      expect(timePassed).toBeGreaterThanOrEqual(timePassedMin);
    });
  });

  it('delay 0', () => {
    expect.assertions(1);

    const numberCalls = 4;

    const isComplete = (callCount?: number) => {
      return callCount === numberCalls;
    };
    const timeStarted = Date.now();
    const delay = 0;
    const timePassedMax = 1;

    return repeatedCalls<number>({ targetFunction, isComplete, delay }).then(() => {
      const timeEnded = Date.now();
      const timePassed = timeEnded - timeStarted;

      expect(timePassed).toBeLessThanOrEqual(timePassedMax);
    });
  });

  it('complete when the limit is reached', () => {
    expect.assertions(4);

    const isComplete = (callCount?: number) => {
      return callCount === 5;
    };
    const callLimit = 3;

    return repeatedCalls<number>({ targetFunction, isComplete, callLimit }).catch((error) => {
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

    const promise = repeatedCalls<number>({ targetFunction, isComplete, callLimit });

    promise.cancel();

    return promise.catch((error) => {
      expect(hasCanceledError(error)).toBe(true);
      expect(error.message).toBe(`canceled`);
      expect(error.values.lastResult).toBe(1);
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

    const promise = repeatedCalls<number>({ targetFunction, isComplete, callLimit, onAfterCancel });

    promise.cancel();

    return promise.catch(() => {
      expect(onAfterCancel).toHaveBeenCalledTimes(1);
    });
  });

  it('should not be checked isComplete before the call when isCheckBeforeCall is false', async () => {
    expect.assertions(2);

    const isComplete = jest.fn((callCount: number) => {
      return callCount === 1;
    });

    await repeatedCalls({ targetFunction, isComplete, isCheckBeforeCall: false });

    expect(isComplete).toHaveBeenCalledTimes(1);
    expect(targetFunction).toHaveBeenCalledTimes(1);
  });

  it('should be checked isComplete before the call when isCheckBeforeCall is true', async () => {
    expect.assertions(2);

    const isComplete = jest.fn((callCount?: number) => {
      return callCount === 1;
    });

    await repeatedCalls({ targetFunction, isComplete, isCheckBeforeCall: true });

    expect(isComplete).toHaveBeenCalledTimes(2);
    expect(targetFunction).toHaveBeenCalledTimes(1);
  });
});
