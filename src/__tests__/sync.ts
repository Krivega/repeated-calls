/* eslint-disable jest/no-conditional-expect */
/// <reference types="jest" />

import { hasCanceledError, hasReachedLimitError, repeatedCalls } from '../index';

import type { TCanceledError, TReachedLimitError } from '../index';

describe('repeatedCalls', () => {
  let targetFunction: () => number;

  beforeEach(() => {
    const innerTargetFunction: (() => number) & { count?: number } = () => {
      innerTargetFunction.count ??= 0;

      innerTargetFunction.count += 1;

      return innerTargetFunction.count;
    };

    targetFunction = jest.fn(innerTargetFunction);
    targetFunction = jest.fn(innerTargetFunction);
  });
  it('calls end after 1', async () => {
    expect.assertions(2);

    const isComplete = (callCount?: number) => {
      return callCount === 1;
    };

    return repeatedCalls<number>({ targetFunction, isComplete }).then((callCount) => {
      expect(callCount).toBe(1);
      expect(targetFunction).toHaveBeenCalledTimes(1);
    });
  });

  it('calls end after 3', async () => {
    expect.assertions(2);

    const isComplete = (callCount?: number) => {
      return callCount === 3;
    };

    return repeatedCalls<number>({ targetFunction, isComplete }).then((callCount) => {
      expect(callCount).toBe(3);
      expect(targetFunction).toHaveBeenCalledTimes(3);
    });
  });

  it('delay', async () => {
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

  it('delay 0', async () => {
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

  it('complete when the limit is reached', async () => {
    expect.assertions(4);

    const isComplete = (callCount?: number) => {
      return callCount === 5;
    };
    const callLimit = 3;

    return repeatedCalls<number>({ targetFunction, isComplete, callLimit }).catch(
      (error: unknown) => {
        expect(hasReachedLimitError(error)).toBe(true);
        expect((error as TReachedLimitError).message).toBe(`call limit (${callLimit}) is reached`);
        expect((error as TReachedLimitError).values?.lastResult).toBe(callLimit);
        expect(targetFunction).toHaveBeenCalledTimes(3);
      },
    );
  });

  it('complete when canceled', async () => {
    expect.assertions(4);

    const isComplete = () => {
      return false;
    };
    const callLimit = 9999;

    const promise = repeatedCalls<number>({ targetFunction, isComplete, callLimit });

    promise.cancel();

    return promise.catch((error: unknown) => {
      expect(hasCanceledError(error)).toBe(true);
      expect((error as TCanceledError).message).toBe('canceled');
      expect((error as TCanceledError).values?.lastResult).toBe(1);
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

  it('should stop calls when stopRepeatedCalls is called before targetFunction completes', async () => {
    expect.assertions(7);

    let testState = 0;

    const targetFunctionDelayed = jest.fn(() => {
      testState += 1;

      return 42;
    });

    const isComplete = () => {
      return testState === 2;
    };

    const promise = repeatedCalls<number>({
      targetFunction: targetFunctionDelayed,
      isComplete,
      callLimit: 9999,
      delay: 10, // Минимальная задержка для предотвращения бесконечного цикла
    });

    // В синхронной версии с задержкой stopRepeatedCalls должен остановить следующий вызов
    promise.stopRepeatedCalls();

    try {
      await promise;
    } catch (error) {
      expect(hasCanceledError(error)).toBe(true);
      expect((error as TCanceledError<number>).message).toBe('canceled');
      expect((error as TCanceledError<number>).values?.lastResult).toBe(42);
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
