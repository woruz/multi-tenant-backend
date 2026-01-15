module.exports = (req, res, next) => {
  req.tenantId = req.user.tenantId;
  next();
};
