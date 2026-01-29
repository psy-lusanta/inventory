const jwt = require("jsonwebtoken");

function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "7d", // token validity
  });
}

module.exports = generateToken;
module.exports.generateToken = generateToken;
