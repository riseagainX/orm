const jwt = require("jsonwebtoken");
// require("dotenv").config();
const config = require("../config/config.json");
const JWT_SECRET = config.development.JWT_SECRET;
// console.log("JWT_SECRET", JWT_SECRET);
function authMiddleware(req, res, next) {


  console.log("Inside authmiddleware");
  const authHeader = req.headers.authorization;
  console.log("authHeader",authHeader)

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

// //   const token = authHeader.split(" ")[1];
const token = authHeader.replace("Bearer ", "");

// console.log("cookiee )))))",req.cookies);
// const token = req.cookies?.token;
//   console.log("token ___+++++",token);
  if (!token) {
    console.error("Token verification failed:");
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token,JWT_SECRET);
    console.log("Decoded token:✅✅✅", decoded);
    req.user = decoded;
    console.log(" Decoded user from token:", decoded);
    


    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
    //  return res.redirect("/api/auth/loginPage");
  }
}

module.exports = authMiddleware;
