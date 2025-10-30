const { Op } = require('sequelize');
const { Order, OrderDetail } = require('../models');
const { sequelize } = require('../models/index');

const getMonthlyBrandOrderTotal = async (userId, brandId) => {
  try {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1); // Changes the day component of that date to the 1st of the month.
    firstDayOfMonth.setHours(0, 0, 0, 0);   // change the time compound //firstDayOfMonth = Oct 1, 2025, 12:00:00 AM
    
    const now = new Date();
    
    const result = await OrderDetail.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.literal('product_price * quantity')), 'total'] // here total is alias -- ( literal used for caluculating and  sequilize .fn is  Aggregation Function Call)
      ],
      include: [{
        model: Order,
        attributes: [], // prevent selecting non-aggregated Order columns
        where: {
          user_id: userId,
          status: { [Op.ne]: 'F' }, // Not failed orders
          created: {
            [Op.gte]: firstDayOfMonth,
            [Op.lte]: now
          }
        },
        required: true
      }],
      where: {
        brand_id: brandId
      },
      raw: true // raw means - gives the direct data from db ,, Setting raw: true makes the query much faster and uses less memory.
    });
    
    return result[0]?.total || 0;
  } catch (error) {
    console.error('Error in getMonthlyBrandOrderTotal:', error);
    throw error;
  }
};


const getAmazonOrderAmountUserCap = async (userId, brandId) => {
  try {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0); // first day of month
    
    const now = new Date(); // current time 
    
    // Get orders with status V (Verified)
    const verifiedOrders = await OrderDetail.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.literal('product_price * quantity')), 'total']
      ],
      include: [{
        model: Order,
        attributes: [], // prevent selecting non-aggregated Order columns
        where: {
          user_id: userId,
          status: 'V',
          created: {
            [Op.gte]: firstDayOfMonth,
            [Op.lte]: now
          }
        },
        required: true
      }],
      where: {
        brand_id: brandId
      },
      raw: true
    });
    
    // Get orders with status C (Completed)
    const completedOrders = await OrderDetail.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.literal('product_price * quantity')), 'total']
      ],
      include: [{
        model: Order,
        attributes: [],
        where: {
          user_id: userId,
          status: 'C',
          created: {
            [Op.gte]: firstDayOfMonth,
            [Op.lte]: now
          }
        },
        required: true
      }],
      where: {
        brand_id: brandId
      },
      raw: true
    });
    
    // Get orders with status I (Initiated)
    const initiatedOrders = await OrderDetail.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.literal('product_price * quantity')), 'total']
      ],
      include: [{
        model: Order,
        attributes: [],
        where: {
          user_id: userId,
          status: 'I',
          created: {
            [Op.gte]: firstDayOfMonth,
            [Op.lte]: now
          }
        },
        required: true
      }],
      where: {
        brand_id: brandId
      },
      raw: true
    });
    
    // Sum all totals
    const verifiedTotal = verifiedOrders[0]?.total || 0; // verifid ( all payment through points or coupouns)
    const completedTotal = completedOrders[0]?.total || 0;
    const initiatedTotal = initiatedOrders[0]?.total || 0;
    
    return verifiedTotal + completedTotal + initiatedTotal;
  } catch (error) {
    console.error('Error in getAmazonOrderAmountUserCap:', error);
    throw error;
  }
};

module.exports = {
  getMonthlyBrandOrderTotal,
  getAmazonOrderAmountUserCap
};