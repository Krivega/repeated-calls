const repeatedCalls = ({ targetFunction, isComplette, callLimit = Infinity, delay = 300 }) =>
  new Promise((resolve, reject) => {
    if (!targetFunction) {
      return reject(new Error('targetFunction is required'));
    }

    if (!isComplette) {
      return reject(new Error('isComplette is required'));
    }

    if (isComplette()) {
      return resolve();
    }

    let timeout;
    let countCalls = 0;
    const checkEnded = () => {
      clearTimeout(timeout);

      if (isComplette()) {
        return resolve();
      }

      if (countCalls >= callLimit) {
        return reject(new Error(`call limit (${callLimit}) is reached`));
      }

      const result = targetFunction();

      countCalls += 1;

      if (isComplette(result)) {
        return resolve(result);
      }

      timeout = setTimeout(checkEnded, delay);

      return undefined;
    };

    checkEnded();

    return undefined;
  });

export default repeatedCalls;
