const jwt = require("jsonwebtoken")

module.exports = function auth(req, res, next) {

  const header = req.headers.authorization

  if (!header) {
    return res.status(401).json({ message: "Token missing" })
  }

  const token = header.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Invalid token format" })
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = decoded

    next()

  } catch (err) {

    return res.status(401).json({ message: "Invalid or expired token" })

  }
}