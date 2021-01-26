import { repeatedCallsAsync, hasReachedLimitError } from '../index';

describe('repeatedCallsAsync', () => {
  let targetFunction;
  let targetFunctionRejected;

  beforeEach(() => {
    targetFunction = jest.fn(function innerTargetFunction() {
      innerTargetFunction.count = innerTargetFunction.count || 0;

      innerTargetFunction.count += 1;

      return Promise.resolve(innerTargetFunction.count);
    });
    targetFunctionRejected = jest.fn(function innerTargetFunction() {
      innerTargetFunction.count = innerTargetFunction.count || 0;

      innerTargetFunction.count += 1;

      return Promise.reject(innerTargetFunction.count);
    });
  });

  it('calls end after 1', () => {
    expect.assertions(2);

    const isComplete = (callCount) => callCount === 1;

    return repeatedCallsAsync({ targetFunction, isComplete }).then((callCount) => {
      expect(callCount).toBe(1);
      expect(targetFunction).toHaveBeenCalledTimes(1);
    });
  });

  it('calls end after 3', () => {
    expect.assertions(2);

    const isComplete = (callCount) => callCount === 3;

    return repeatedCallsAsync({ targetFunction, isComplete }).then((callCount) => {
      expect(callCount).toBe(3);
      expect(targetFunction).toHaveBeenCalledTimes(3);
    });
  });

  it('calls for rejected with isRejectAsValid=false (by default)', () => {
    expect.assertions(2);

    const isComplete = (callCount) => callCount === 3;

    return repeatedCallsAsync({ isComplete, targetFunction: targetFunctionRejected }).catch(
      (callCount) => {
        expect(callCount).toBe(1);
        expect(targetFunctionRejected).toHaveBeenCalledTimes(1);
      }
    );
  });

  it('calls for rejected with isRejectAsValid=true', () => {
    expect.assertions(2);

    const isComplete = (callCount) => callCount === 3;

    return repeatedCallsAsync({
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
    const isComplete = (callCount) => callCount === numberCalls;
    const timeStarted = Date.now();
    const delay = 500;
    const timePassedMin = delay * (numberCalls - 1);
    const timePassedMax = delay * numberCalls;

    return repeatedCallsAsync({ targetFunction, isComplete, delay }).then(() => {
      const timeEnded = Date.now();
      const timePassed = timeEnded - timeStarted;

      expect(timePassed).toBeLessThanOrEqual(timePassedMax);
      expect(timePassed).toBeGreaterThanOrEqual(timePassedMin);
    });
  });

  it('delay 0', () => {
    expect.assertions(1);

    const numberCalls = 4;
    const isComplete = (callCount) => callCount === numberCalls;
    const timeStarted = Date.now();
    const delay = 0;
    const timePassedMax = 1;

    return repeatedCallsAsync({ targetFunction, isComplete, delay }).then(() => {
      const timeEnded = Date.now();
      const timePassed = timeEnded - timeStarted;

      expect(timePassed).toBeLessThanOrEqual(timePassedMax);
    });
  });

  it('complete if the limit is reached', () => {
    expect.assertions(4);

    const isComplete = (callCount) => callCount === 5;
    const callLimit = 3;

    return repeatedCallsAsync({
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

  it('complete if the limit is reached: for rejected with isRejectAsValid', () => {
    expect.assertions(4);

    const isComplete = (callCount) => callCount === 5;
    const callLimit = 3;

    return repeatedCallsAsync({
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
