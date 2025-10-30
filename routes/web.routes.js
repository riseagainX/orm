const CheckUserAndSendOtpController = require('../controllers/loginRegisterController/checkUserExistenceController'); // check if user exists in db or not
const db = require('../models');

const express = require('express');
const { getPageContentHandler } = require('../controllers/pageContentController');

const router = express.Router();
const brandsByCategoryController = require('../controllers/brandsByCategoryController');
const brandCategoryController = require('../controllers/brandCategoryController');

const brandWithProductsController = require('../controllers/brandWithProductsController');

router.get('/brand/:brand_slug',brandWithProductsController.getBrandWithProduct);
router.get('/home/categories', brandCategoryController.getCategoriesWithBrands); // all categories

router.get('/categories/brands', brandsByCategoryController.getBrandsByCategory.bind(brandsByCategoryController));   // get brands by category

router.get('/home/content/:title', getPageContentHandler); // content api

const dbConfig=require('../config/config.json');
const encryptkey = dbConfig.development.encryptionKey;
const EncryptionMiddleware = require('../middlewares/encryption.middleware');
const DecryptionMiddleware = require('../middlewares/decryption.middleware');
const encryptionMiddleware  = new EncryptionMiddleware(encryptkey);
const decryptionMiddleware = new DecryptionMiddleware(encryptkey);

// Crypto utility APIs
router.post('/crypto/encrypt', (req, res) => {
  try {
    const { data } = req.body;
    // console.log('data ', data);
    const encryptedBody = encryptionMiddleware.encryptBody(data);
    return res.json({ encryptedBody });
  } catch (e) {
    return res.status(400).json({ code: 400, status: 'Error', message: e.message });
  }
});

router.post('/crypto/decrypt', (req, res) => {
  return decryptionMiddleware.decryptBody(req, res, () => {
    return res.json({ data: req.body });
  });
});

// Decrypt request, controller returns NORMAL JSON (no response encryption)
router.post(
  '/check/mobile',
  decryptionMiddleware.decryptBody.bind(decryptionMiddleware),
  CheckUserAndSendOtpController.checkUserExists
); // check if user exists in db or not

const verifyOtpCodeController = require('../controllers/loginRegisterController/verifyOtpController');
// Decrypt request first; controller will encrypt ONLY data field
router.post(
  '/login',
  decryptionMiddleware.decryptBody.bind(decryptionMiddleware),
  verifyOtpCodeController.verifyOtpCode
);

// Import auth middleware and cart controllers
const authmiddleware = require('../middlewares/auth.middleware');
const addCartController = require('../controllers/cartController/addToCartController');
const getCartItemsController = require('../controllers/cartController/getCartItemsController');
const updateCartItemController = require('../controllers/cartController/updateCartItemController');
const removeCartItemController = require('../controllers/cartController/removeCartItemController');

// Cart routes
router.post('/add/cart', authmiddleware, addCartController.addToCart);
router.post('/get/cart', authmiddleware, getCartItemsController.getCartItems);
router.post('/update/cart', authmiddleware, updateCartItemController.updateCartItem);
router.post('/delete/cart', authmiddleware, removeCartItemController.removeCartItem);





// Legacy ad-hoc decryption test route retained for manual testing
router.post('/check/decryption', decryptionMiddleware.decryptBody.bind(decryptionMiddleware), (req, res) => {
  return res.json({ data: req.body });
});
// const decryptedData = decrptionObject.decryptBody();


const orderController = require('../controllers/orderController');

router.post('/order/create', authmiddleware, orderController.createOrderController);




module.exports = router;
