// File: /seeders/YYYYMMDDHHMMSS-initial-products-data.js
'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('products', [
      // --- ROW 1: JioSaavn - Monthly Subscription ---
      {
        id: 1,
        brand_id: 375,
        display_type: 'WEBSITE',
        product_guid: 'f828ae1d-911e-4af8-b26d-c89737f8774c',
        name: 'JioSaavn - Monthly Subscription',
        price: 99,
        expiry_date: new Date('2027-12-12'),
        available_qty: 1000,
        tnc: '1.This is JioSaavn Insta Gift Voucher (GV) / Gift Card (GC) and customer will receive the voucher details directly on their registered number.\r\n2.The person who has JioSaavn GV / GC Code is deemed to be the beneficiary and the code can only be used in a single transaction to acquire JioSaavn services as described at JioSaavn/terms within the territory of India.\r\n3.By purchasing or using a JioSaavn GV / GC, you are agreeing to accept these terms and conditions and the detailed terms and conditions available on JioSaavn/terms.\r\n4.JioSaavn is not responsible if the Gift card is lost, stolen or used without permission.\r\n5.The subscription package depends on the price selected and the details are given in the price section.\r\n6.To redeem the code you will be required to register as a JioSaavn user and you must be at least 18 years old.\r\n7.JioSaavn reserves its right to modify/amend the terms and conditions of the codes at any time without prior notice and such modifications shall be binding on the user/bearer of the codes\r\n8.In case of any dispute, the decision made by SML / Jio-Saavn would be final and binding.\r\n9.Existing JioSaavn subscribers on auto-renewal plans cannot redeem the codes.\r\n10.E-Gift Cards are normally delivered instantly. But sometimes due to system issues, the delivery can be delayed up-to 24 - 48 hours.\r\n11.For any queries / issues related to GV / GC, raise a request at www.gvhelpdesk.com',
        status: 'A',
        pre_status: null,
        remark: '',
        max_point_limit: null,
        is_show: 'Y',
        created: new Date('2021-10-07 13:56:07'),
        updated: new Date('2023-02-27 09:56:08'),
        is_payback_plus: 'N',
        product_guid_live: 'b2580c40-c4b2-4978-89fb-e48ab4c0a2a6'
      }
      // Add your other 1,109 product objects here, separated by commas.
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('products', null, {});
  }
};