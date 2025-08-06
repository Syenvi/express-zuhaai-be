export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema?.parse(req.body);
    next();
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      status: false,
      errors: err.errors.map((e) => ({
        field: e.path[0],
        message: e.message,
      })),
    });
  }
};
