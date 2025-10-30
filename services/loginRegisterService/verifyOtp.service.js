const { User, Otp,sequelize } = require('../../models');
const { Op } = require('sequelize');
// Log: import centralized logger
const logger = require('../../utils/logger.util');


class VerifyOtpCodeService {
    
    async verifyOtp(phoneNo, otp) {
        // Log: function start
        logger.info('verifyOtp.service.verifyOtp started', { phoneNo });
        const t = await sequelize.transaction();
        try {
            // Step 1: Validate the OTP by calling the helper method.
            // const isOtpValid = await this._validateOtp(phoneNo, otp,t);
             const [updateCount] = await Otp.update({
                status: 'USED',
                updated_date: new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)),
            }, {
                where: {
                    mobile: phoneNo,
                    otp: otp,
                    status: 'VALID',
                    valid_till: {
                        [Op.gt]: new Date()
                    }
                },
               transaction:t
            });


            // check otp update or not ( if  update then return 1, else return 0)
            if (!updateCount) {
                t.rollback();
                return {
                    success: false,
                    data: null,
                    error: 'Sorry! Your OTP is Invalid or Expired.'
                };
            }

            // Step 2: If OTP is valid, fetch the user's data.
            const user = await User.findOne({
                where: { phone: phoneNo },
                attributes: ['id', 'name', 'email', 'phone', 'status', 'gst', 'address', 'gender', 'dob', 'profile_image'],
                transaction: t
            });

            if (!user) {
                await t.rollback();
                // This is an edge case, but good to handle.
                return {
                    success: false,
                    data: null,
                    error: 'OTP verified, but no associated user found.'
                };
            }
           

            // Step 3: Return success and user data.
             await t.commit();
            // Log: success
            logger.success('verifyOtp.service.verifyOtp success', { userId: user.id, phoneNo });
            return {
                success: true,
                data: user.get({ plain: true }),
                error: null
            };

        } catch (error) {
            await t.rollback();
            // Log: error
            logger.error('verifyOtp.service.verifyOtp failed', error);
            console.error('Error in verifyOtp service:', error);
            return {
                success: false,
                data: null,
                error: 'An internal server error occurred.'
            };
        }
    }
}

module.exports = new VerifyOtpCodeService();