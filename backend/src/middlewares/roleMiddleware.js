// middlewares/roleMiddleware.js
module.exports = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: "Not authenticated" });
    }

    // Check if user has required role or if they're SuperAdmin (user_type = 3)
    const userRole = parseInt(req.user.user_type);
    const isSuperAdmin = userRole === 3; // Org. Executives is SuperAdmin
    
    if (!isSuperAdmin && !roles.includes(userRole)) {
        return res.status(403).json({ msg: "Forbidden: insufficient rights" });
    }

    next();
  };
};
