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

    return repeatedCalls({}).catch(error => {
      expect(error.message).toBe('targetFunction is required');
    });
  });

  it('not full params: isComplette', () => {
    expect.assertions(1);

    return repeatedCalls({ targetFunction }).catch(error => {
      expect(error.message).toBe('isComplette is required');
    });
  });

  it('not called if isComplette returns true', () => {
    expect.assertions(1);

    const isComplette = () => true;

    return repeatedCalls({ targetFunction, isComplette }).then(() => {
      expect(targetFunction).toHaveBeenCalledTimes(0);
    });
  });

  it('calls end after 1', () => {
    expect.assertions(2);

    const isComplette = callCount => callCount === 1;

    return repeatedCalls({ targetFunction, isComplette }).then(callCount => {
      expect(callCount).toBe(1);
      expect(targetFunction).toHaveBeenCalledTimes(1);
    });
  });

  it('calls end after 3', () => {
    expect.assertions(2);

    const isComplette = callCount => callCount === 3;

    return repeatedCalls({ targetFunction, isComplette }).then(callCount => {
      expect(callCount).toBe(3);
      expect(targetFunction).toHaveBeenCalledTimes(3);
    });
  });

  it('complete if the limit is reached', () => {
    expect.assertions(2);

    const isComplette = callCount => callCount === 5;
    const callLimit = 3;

    return repeatedCalls({ targetFunction, isComplette, callLimit }).catch(error => {
      expect(error.message).toBe(`call limit (${callLimit}) is reached`);
      expect(targetFunction).toHaveBeenCalledTimes(3);
    });
  });
});
