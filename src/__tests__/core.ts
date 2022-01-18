import repeatedCalls from '../index';

describe('repeatedCalls: core', () => {
  let targetFunction: () => number;

  beforeEach(() => {
    const innerTargetFunction: (() => number) & { count?: number } = () => {
      innerTargetFunction.count = innerTargetFunction.count || 0;

      innerTargetFunction.count += 1;

      return innerTargetFunction.count;
    };

    targetFunction = jest.fn(innerTargetFunction);
  });

  it('not full params: targetFunction', () => {
    expect.assertions(1);

    // @ts-ignore
    return repeatedCalls<number>({}).catch((error) => {
      expect(error.message).toBe('targetFunction is required');
    });
  });

  it('not full params: isComplete', () => {
    expect.assertions(1);

    // @ts-ignore
    return repeatedCalls<number>({ targetFunction }).catch((error) => {
      expect(error.message).toBe('isComplete is required');
    });
  });

  it('not called if isComplete returns true', () => {
    expect.assertions(1);

    const isComplete = () => {
      return true;
    };

    return repeatedCalls<number>({ targetFunction, isComplete }).then(() => {
      expect(targetFunction).toHaveBeenCalledTimes(0);
    });
  });
});
