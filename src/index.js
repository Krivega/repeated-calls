const validateParams = ({ targetFunction, isComplete }) => {
  if (!targetFunction) {
    return { valid: false, error: new Error('targetFunction is required') };
  }

  if (!isComplete) {
    return { valid: false, error: new Error('isComplete is required') };
  }

  return { valid: true };
};

const promisedCall = (checkEnded) =>
  new Promise((resolve, reject) => {
    checkEnded({ resolve, reject });
  });

const repeatedCallsSync = ({ targetFunction, isComplete, callLimit = Infinity, delay = 300 }) => {
  const validation = validateParams({ targetFunction, isComplete });

  if (!validation.valid) {
    return Promise.reject(validation.error);
  }

  let timeout;
  let countCalls = 0;
  const checkEnded = ({ resolve, reject }) => {
    clearTimeout(timeout);

    if (isComplete()) {
      return resolve();
    }

    if (countCalls >= callLimit) {
      return reject(new Error(`call limit (${callLimit}) is reached`));
    }

    const result = targetFunction();

    countCalls += 1;

    if (isComplete(result)) {
      return resolve(result);
    }

    if (delay && delay > 0) {
      timeout = setTimeout(() => checkEnded({ resolve, reject }), delay);
    } else {
      checkEnded({ resolve, reject });
    }

    return undefined;
  };

  return promisedCall(checkEnded);
};

export const repeatedCallsAsync = ({
  targetFunction,
  isComplete,
  callLimit = Infinity,
  isRejectAsValid = false,
  delay = 300,
}) => {
  const validation = validateParams({ targetFunction, isComplete });

  if (!validation.valid) {
    return Promise.reject(validation.error);
  }

  let timeout;
  let countCalls = 0;
  const checkEnded = async ({ resolve, reject }) => {
    clearTimeout(timeout);

    if (isComplete()) {
      return resolve();
    }

    if (countCalls >= callLimit) {
      return reject(new Error(`call limit (${callLimit}) is reached`));
    }

    let result;

    try {
      result = await targetFunction();
    } catch (error) {
      result = error;

      if (!isRejectAsValid) {
        return reject(error);
      }
    }

    countCalls += 1;

    if (isComplete(result)) {
      return resolve(result);
    }

    if (delay && delay > 0) {
      timeout = setTimeout(() => checkEnded({ resolve, reject }), delay);
    } else {
      checkEnded({ resolve, reject });
    }

    return undefined;
  };

  return promisedCall(checkEnded);
};

export default repeatedCallsSync;
