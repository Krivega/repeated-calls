import repeatedCalls from '../index';

describe('repeatedCalls', () => {
  let targetFunction;

  beforeEach(() => {
    targetFunction = jest.fn(function innerTargetFunction() {
      innerTargetFunction.count = innerTargetFunction.count || 0;

      innerTargetFunction.count += 1;

      return innerTargetFunction.count;
    });
  });

  it('not full params: targetFunction', () => {
    expect.assertions(1);

    return repeatedCalls({}).catch((error) => {
      expect(error.message).toBe('targetFunction is required');
    });
  });

  it('not full params: isComplete', () => {
    expect.assertions(1);

    return repeatedCalls({ targetFunction }).catch((error) => {
      expect(error.message).toBe('isComplete is required');
    });
  });

  it('not called if isComplete returns true', () => {
    expect.assertions(1);

    const isComplete = () => true;

    return repeatedCalls({ targetFunction, isComplete }).then(() => {
      expect(targetFunction).toHaveBeenCalledTimes(0);
    });
  });

  it('calls end after 1', () => {
    expect.assertions(2);

    const isComplete = (callCount) => callCount === 1;

    return repeatedCalls({ targetFunction, isComplete }).then((callCount) => {
      expect(callCount).toBe(1);
      expect(targetFunction).toHaveBeenCalledTimes(1);
    });
  });

  it('calls end after 3', () => {
    expect.assertions(2);

    const isComplete = (callCount) => callCount === 3;

    return repeatedCalls({ targetFunction, isComplete }).then((callCount) => {
      expect(callCount).toBe(3);
      expect(targetFunction).toHaveBeenCalledTimes(3);
    });
  });

  it('complete if the limit is reached', () => {
    expect.assertions(2);

    const isComplete = (callCount) => callCount === 5;
    const callLimit = 3;

    return repeatedCalls({ targetFunction, isComplete, callLimit }).catch((error) => {
      expect(error.message).toBe(`call limit (${callLimit}) is reached`);
      expect(targetFunction).toHaveBeenCalledTimes(3);
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

    return repeatedCalls({ targetFunction, isComplete, delay }).then(() => {
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
    const timePassedMax = 10;

    return repeatedCalls({ targetFunction, isComplete, delay }).then(() => {
      const timeEnded = Date.now();
      const timePassed = timeEnded - timeStarted;

      expect(timePassed).toBeLessThanOrEqual(timePassedMax);
    });
  });
});
