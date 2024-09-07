const passwordValidator = require("password-validator");
const validator = require("validator");
const forbiddenWordsList = require("../data/forbiddenWordsList.json");
const Filter = require("bad-words");

const validateUsername = (username) => {
  /*
  Requirements:
  - min. 3 chars
  - max. 20 chars
  - only letters (big and small) or numbers or "_"
  - no whitespaces
  - no special characters on the start and end
  - two special characters mustn't be next to each other
  - must contain at least 2 letters
  */
  const regex =
    /^(?!.*_{3,})(?=.{3,20}$)[a-zA-Z0-9]+(_[a-zA-Z0-9]*)*[a-zA-Z0-9]+$/;
  const twoLettersRegex = /.*[a-zA-Z].*[a-zA-Z].*/;
  const isNotAnonymous = username != "anonymous" && username != "anonim";

  const isValid =
    regex.test(username) && twoLettersRegex.test(username) && isNotAnonymous;
  return isValid;
};

const validatePassword = (password) => {
  const schema = new passwordValidator();

  schema
    .is()
    .min(8) // min. 8 chars
    .max(32)
    .has()
    .uppercase() // min. 1 uppercase letter
    .has()
    .lowercase() // min. 1 lowercase letter
    .has()
    .digits() // min. 1 digit
    .has()
    .not()
    .spaces() // no spaces
    .has()
    .symbols(); // min. 1 special character

  const isValid = schema.validate(password);
  return isValid;
};

const validateEmail = (email) => {
  const isValid = validator.isEmail(email);
  return isValid;
};

const validateName = (firstName, lastName) => {
  const regex =
    /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]{3,50}(?:[-\s'][a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)*$/;

  const isValid = regex.test(firstName) && regex.test(lastName);
  return isValid;
};

const validateOffensiveness = (inputs) => {
  const filter = new Filter();
  filter.addWords.apply(filter, forbiddenWordsList);
  let isOffensive = false;
  for (const input of inputs) {
    if (filter.isProfane(input)) {
      isOffensive = true;
      break;
    }
  }
  return isOffensive;
};

module.exports = {
  validateEmail,
  validateName,
  validateUsername,
  validatePassword,
  validateOffensiveness,
};
