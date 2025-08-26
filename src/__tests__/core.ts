/* eslint-disable jest/no-conditional-expect */
/// <reference types="jest" />

import { repeatedCalls } from '../index';

describe('repeatedCalls: core', () => {
  let targetFunction: () => number;

  beforeEach(() => {
    const innerTargetFunction: (() => number) & { count?: number } = () => {
      innerTargetFunction.count ??= 0;

      innerTargetFunction.count += 1;

      return innerTargetFunction.count;
    };

    targetFunction = jest.fn(innerTargetFunction);
  });

  it('not full params: targetFunction', async () => {
    expect.assertions(1);

    // @ts-ignore
    return repeatedCalls<number>({}).catch((error: unknown) => {
      expect((error as Error).message).toBe('targetFunction is required');
    });
  });

  it('not full params: isComplete', async () => {
    expect.assertions(1);

    // @ts-ignore
    return repeatedCalls<number>({ targetFunction }).catch((error: unknown) => {
      expect((error as Error).message).toBe('isComplete is required');
    });
  });

  it('not called if isComplete returns true', async () => {
    expect.assertions(1);

    const isComplete = () => {
      return true;
    };

    return repeatedCalls<number>({ targetFunction, isComplete }).then(() => {
      expect(targetFunction).toHaveBeenCalledTimes(0);
    });
  });
});
