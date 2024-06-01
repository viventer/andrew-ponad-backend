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

// @route GET /errorReports/:id
const getErrorReport = async (req, res) => {
  if (!req?.params?.id) {
    return res.status(400).json({ message: "ID zgłoszenia jest wymagane" });
  }
  const id = req.params.id;

  if (id.length !== 24) {
    return res.status(400).json({ message: "Podane ID jest nieprawidłowe" });
  }

  const errorReport = await ErrorReport.findOne({ _id: id });
  if (!errorReport) {
    return res
      .status(204)
      .json({ message: `Nie znaleziono zgłoszenia o ID: ${req.params.id}` });
  }

  return res.json(errorReport);
};

// @route POST /errorReports
const createNewErrorReport = async (req, res) => {
  const { author, title, description, images } = req.body;

  const allExist = checkIfAllExist([title, description]);

  if (!allExist) {
    return res.status(400).json({ message: "Uzupełnij wymagane pola" });
  }

  if (title?.length > 40) {
    return res.status(400).json({ message: "Tytuł posta jest zbyt długi" });
  }

  const errorReport = await ErrorReport.create({
    author,
    title,
    description,
    images,
  });

  if (errorReport) {
    return res
      .status(201)
      .json({ message: "Nowe zgłoszenie błędu zostało utworzone" });
  }
};

// @route PATCH /errorReports/:id
const changeErrorReportStatus = async (req, res) => {
  if (!req?.params?.id) {
    return res.status(400).json({ message: "ID zgłoszenia jest wymagane" });
  }
  const id = req.params.id;

  if (id.length !== 24) {
    return res.status(400).json({ message: "Podane ID jest nieprawidłowe" });
  }

  const errorReport = await ErrorReport.findOne({ _id: id });
  if (!errorReport) {
    return res
      .status(204)
      .json({ message: `Nie znaleziono zgłoszenia o ID: ${req.params.id}` });
  }

  const { newStatus } = req.body;
  if (!newStatus) {
    return res.status(400).json({ message: "Nowy status jest wymagany" });
  }

  errorReport.status = newStatus;
  await errorReport.save();

  res.json(
    `Status zgłoszenia błędu o ID: ${id} został zmieniony na ${newStatus}`
  );
};

// @route DELETE /errorReports/:id
const deleteErrorReport = async (req, res) => {
  if (!req?.params?.id) {
    return res.status(400).json({ message: "ID zgłoszenia jest wymagane" });
  }
  const id = req.params.id;

  if (id.length !== 24) {
    return res.status(400).json({ message: "Podane ID jest nieprawidłowe" });
  }

  const errorReport = await ErrorReport.findOne({ _id: id });
  if (!errorReport) {
    return res
      .status(204)
      .json({ message: `Nie znaleziono zgłoszenia o ID: ${req.params.id}` });
  }

  await errorReport.deleteOne();

  res.json(`Zgłoszenie błędu o ID: ${id} zostało usunięte`);
};

module.exports = {
  getAllErrorReports,
  getErrorReport,
  createNewErrorReport,
  changeErrorReportStatus,
  deleteErrorReport,
};
