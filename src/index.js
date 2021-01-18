const repeatedCalls = ({ targetFunction, isComplete, callLimit = Infinity, delay = 300 }) =>
  new Promise((resolve, reject) => {
    if (!targetFunction) {
      return reject(new Error('targetFunction is required'));
    }

    if (!isComplete) {
      return reject(new Error('isComplete is required'));
    }

    if (isComplete()) {
      return resolve();
    }

    let timeout;
    let countCalls = 0;
    const checkEnded = () => {
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

      timeout = setTimeout(checkEnded, delay);

      return undefined;
    };

    checkEnded();

    return undefined;
  });

export default repeatedCalls;
