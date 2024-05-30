const ErrorReport = require("../model/ErrorReport");
const User = require("../model/User");

const checkIfAllExist = require("../helpers/checkIfAllExist");
const checkIfEmpty = require("../helpers/checkIfEmpty");

// @route GET /errorReports
const getAllErrorReports = async (req, res) => {
  const errorReports = await ErrorReport.find({}, { content: 0 }).lean();

  let isEmpty = checkIfEmpty(errorReports);
  if (isEmpty) {
    return res.status(400).json({ message: "Nie znaleziono zgłoszeń błędów" });
  }

  const errorReportsWithUser = await Promise.all(
    errorReports.map(async (errorReport) => {
      let username;
      if (errorReport?.author) {
        const user = await User.findById(errorReport.author).lean().exec();
        username = user?.username;
      } else {
        username = "anonim";
      }
      return { ...errorReport, username };
    })
  );

  res.json(errorReportsWithUser);
};
