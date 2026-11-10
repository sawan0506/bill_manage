export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsed = schema.parse(dataToValidate);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err.errors && err.errors.length > 0) {
        // Return clear, friendly error message to non-tech staff
        const firstIssue = err.errors[0];
        const friendlyMessage = firstIssue.message || 'Invalid input provided. Please check the form.';
        return res.status(400).json({
          success: false,
          message: friendlyMessage,
          errors: err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid input. Please check your details.'
      });
    }
  };
};
