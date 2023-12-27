const checkIfAllExist = (elements) => {
  let allExist = true;

  elements.forEach((element) => {
    if (!element) {
      allExist = false;
    }
  });

  return allExist;
};

module.exports = checkIfAllExist;
