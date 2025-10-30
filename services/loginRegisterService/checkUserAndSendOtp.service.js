
const crypto = require('crypto');
const { User, Otp, sequelize } = require('../../models');
// Log: import centralized logger
const logger = require('../../utils/logger.util');


const generateAndStoreOtp = async (mobile, section, transaction) => {
    // Log: function start
    logger.info('checkUserAndSendOtp.generateAndStoreOtp started', { mobile, section });
    // const otp = crypto.randomInt(100000, 999999).toString();
    const otp =123456;

    // Expire any currently valid OTPs
    await Otp.update({ status: 'EXPIRED' ,
        updated_date: new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)), // fix this (not in store procedure)
     }, {
        where: { mobile, section, status: 'VALID' },
        transaction
    });

    // Create a new OTP record
    const newOtp = await Otp.create({
        otp,
        mobile,
        section,
        created: new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)), // Store in UTC. Timezone is a presentation-layer concern.
        valid_till: new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000) + (15*60*1000)), // 15 minutes from now
        status: 'VALID'
    }, { transaction });

    if (!newOtp) {
        // If creation fails, throw an error to be caught by the transaction handler.
        throw new Error('Failed to create OTP record in database.');
    }

    // Log: success
    logger.success('checkUserAndSendOtp.generateAndStoreOtp success', { mobile, otp_id: newOtp.id });
    return newOtp; // Return the created OTP object
};

const requestLoginOtp = async (given_mobile, given_type) => {
    // Log: function start
    logger.info('checkUserAndSendOtp.requestLoginOtp started', { given_mobile, given_type });
    // if (!given_mobile) {
    //     return { error: 'Invalid Mobile Number' };
    // }
     const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(given_mobile)) {
        return { error: 'Invalid Mobile Number. It must be a 10-digit number starting with 6, 7, 8, or 9.' };
    }

     // Optimised > (we are  fetching  user info from db once (1) but in store procedure logic(db layer) we had to  fetch the user info  2 times -- 1 for check user exists or not . 2nd to get the  user's  status )
    const user = await User.findOne({
        where: { phone: given_mobile },
        attributes: ['status']
    });

    console.log("current Directory ✅📝✅✅",__dirname);


    if (!user) {
        return { userExists: false, otpSent: false }; // Clear, structured response
    }

    if (user.status !== 'A') {
        return { error: 'Account blocked temporarily, please contact administrator' };
    }

    // Using a transaction for the OTP logic
    const t = await sequelize.transaction();
    try {
        await generateAndStoreOtp(given_mobile, given_type, t);
        await t.commit();

        // Log: success
        logger.success('checkUserAndSendOtp.requestLoginOtp OTP sent', { given_mobile });
        return {
            userExists: true,
            otpSent: true,
            userStatus: user.status
        };
    } catch (error) {
        await t.rollback();
        // Log: error
        logger.error('checkUserAndSendOtp.requestLoginOtp failed', error);
        console.error('Transaction failed in requestLoginOtp:', error);
        // This error is for the controller to handle
        return { error: 'An unexpected error occurred while sending OTP.' };
    }
};

module.exports = { requestLoginOtp };