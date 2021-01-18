import repeatedCalls from '../index';

describe('repeatedCalls: core', () => {
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

  it('complete if the limit is reached', () => {
    expect.assertions(2);

    const isComplete = (callCount) => callCount === 5;
    const callLimit = 3;

    return repeatedCalls({ targetFunction, isComplete, callLimit }).catch((error) => {
      expect(error.message).toBe(`call limit (${callLimit}) is reached`);
      expect(targetFunction).toHaveBeenCalledTimes(3);
    });
  });
});
