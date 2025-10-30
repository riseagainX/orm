const CryptoUtil = require("../../utils/crypto.util");
const verifyOtpCodeService = require("../../services/loginRegisterService/verifyOtp.service");
const config = require("../../config/config.json");
const jwt = require("jsonwebtoken");
class VerifyOtpCodeController {
  async verifyOtpCode(req, res) {
    try {
      const { phoneNo, otp } = req.body;

      // Basic input validation
      if (!phoneNo || !otp) {
        return res.status(400).json({
          success: false,
          message: "Phone number and OTP are required.",
        });
      }

      const result = await verifyOtpCodeService.verifyOtp(phoneNo, otp);

      if (!result.success) {
        // Handles cases like invalid OTP or user not found
        return res.status(401).json({
          success: false,
          message: result.error,
        });
      }
      const dbConfig = config.development;
      const JWT_SECRET = dbConfig.JWT_SECRET;
      // const userID=result.data.id;
      // console.log("user id is ",userID);

      const payload = {
        phoneNo,
        userID: result.data.id,
      };
   
      const encryptkey = dbConfig.encryptionKey;
      const cryptoUtil = new CryptoUtil(encryptkey);
      const encryptedData = cryptoUtil.encrypt(result.data);

      // const token= jwt.sign({phoneNo,userID},JWT_SECRET, { expiresIn: '1h' });
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
      // OTP verification successful
      return res.status(200).json({
        success: true,
        message: "OTP verified successfully.",
        data: encryptedData,
        token: token,
      });
    } catch (error) {
      console.error("Error in verifyOtpCode controller:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  }
}

module.exports = new VerifyOtpCodeController();
