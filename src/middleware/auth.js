const jwt = require('jsonwebtoken');
const { ERRORS } = require('../config/constants');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: ERRORS.AUTH.UNAUTHORIZED });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: ERRORS.AUTH.TOKEN_EXPIRED });
    }
    res.status(401).json({ message: ERRORS.AUTH.UNAUTHORIZED });
  }
};