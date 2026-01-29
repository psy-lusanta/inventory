export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role.toLowerCase())) {
      return res.status(403).json({ message: "Access denied." });
    }
    next();
  };
};