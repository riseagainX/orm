const checkUserAndSendOtpService = require('../../services/loginRegisterService/checkUserAndSendOtp.service');

class CheckUserAndSendOtpController {
    async checkUserExists(req, res) {
        try {
            const { given_mobile, given_type } = req.body;
            
            if (!given_mobile || !given_type) {
                return res.status(400).json({
                    success: false,
                    message: 'Mobile number and type are required.',
                    data: null
                });
            }

            const result = await checkUserAndSendOtpService.requestLoginOtp(given_mobile, given_type);

            // Handle specific, known errors from the service
            if (result.error) {
                const statusCode = result.error.includes('blocked') ? 403 : 400;
                return res.status(statusCode).json({
                    success: false,
                    message: result.error,
                    data: null
                });
            }

            // Determine the success message based on the structured response
            const message = result.userExists ? "OTP sent successfully." : "User does not exist.";

            // Send a single, consistent success response
            return res.status(200).json({
                success: true,
                message: message,
                data: {
                    userExists: result.userExists,
                    userStatus: result.userStatus || null
                }
            });

        } catch (error) {
            console.error('Error in check user existence controller:', error);
            res.status(500).json({
                success: false,
                message: 'An internal server error occurred.',
                data: null
            });
        }
    }
}

module.exports = new CheckUserAndSendOtpController();