// File: /seeders/20251001104300-initial-brands-data.js
'use strict';

/**
 * This seeder file populates the 'brands' table with its initial data set.
 * Running this seeder is a reliable and version-controlled way to ensure
 * a consistent database state, especially for development and testing.
 * The 'up' function is what gets executed, and 'down' is for undoing the action.
 */
module.exports = {
  /**
   * The 'up' function is executed when you run `db:seed`.
   * It uses queryInterface.bulkInsert to add multiple rows to a table at once.
   * Note: The keys here (e.g., 'display_type') MUST be snake_case, matching the database column names.
   */
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('brands', [
      // --- ROW 1: Euphoria Jewellery (TM) gold coins ---
      {
        id: 1,
        display_type: 'ALL',
        name: 'Euphoria Jewellery (TM) gold coins',
        description: '<p>Started in 2004, Euphoria Jewellery by A. Himanshu offers Gold &amp; Silver coins that score high on quality. Euphoria Jewellery has maintained a tradition of trust and service to attain customer satisfaction. You can also have your product customized according to your needs. We use innovative technology to ensure customer satisfaction when it comes to designing, quality checking and purity. The product components are manufactured in-house, which ensures no additional cost. Stringent quality control measures are set, to guarantee defect free and superior quality products. By choosing Euphoria Jewellery, you are choosing a reliable store and a great experience!</p>\r\n',
        long_description: '<p>Started in 2004, Euphoria Jewellery by A. Himanshu offers Gold &amp; Silver coins that score high on quality. Euphoria Jewellery has maintained a tradition of trust and service to attain customer satisfaction. You can also have your product customized according to your needs. We use innovative technology to ensure customer satisfaction when it comes to designing, quality checking and purity. The product components are manufactured in-house, which ensures no additional cost. Stringent quality control measures are set, to guarantee defect free and superior quality products. By choosing Euphoria Jewellery, you are choosing a reliable store and a great experience!</p>\r\n',
        more_description: null,
        more_description_tilte: null,
        slug: 'euphoria-jewellery-tm-gold-coins-gift-vouchers',
        brand_icon_url: 'images/brands/logos/33549_a_himanshu.png',
        small_brand_icon_url: 'images/brands/small_icon/65081_A.Himanshu.png',
        image_url: 'images/brands/banners/62887_A-Himanshu-Gold-Coins.jpg',
        image_url_mobile: 'images/brands/banner_mobile/85133_A-Himanshu-Gold-Coins.jpg',
        home_banner: null,
        bogo_brand_logo: null,
        offer_logo: 'images/brands/offer_logo/86042_A-Himanshu-Gold-Coins.png',
        smart_image_url: null,
        trending_brand: 'N',
        trending_brand_image: null,
        important_instructions: '<ul class="list-unstyled"><li>Multiple Gift Vouchers <strong>CAN</strong> be used in one Bill.</li><li>Gift Vouchers <strong>CAN</strong> be clubbed with on-going promotions.</li><li>Gift Vouchers <strong>CAN</strong> be used online only at https://euphoriajewellery.in/.</li><li class="not">Gift Vouchers <strong>CANNOT</strong> be clubbed with any other coupons. </li></ul>',
        checkout_instruction: '',
        tnc: '1.This is a A.himanshu Insta Gift Voucher (GV) / Gift CardÂ (GC) and would be accepted online at https://euphoriajewellery.in/ and can be used to purchase Gold and Silver coins Only.\r\n2.The person who has the A.himanshu GV / GC Code is deemed to be the beneficiary.\r\n3.More than one GV / GC can be used in one bill.\r\n4.This is a ONE time use GV / GC.\r\n5.No Credit note / Refund for the unused amount of the GV / GC will be given.\r\n6.A.himanshuÂ GV / GC CANNOT be revalidated once expired.\r\n7.A.himanshu GV / GC can be clubbed with any on-going promotions on the website. However the Insta GV / GC cannot be clubbed with any other coupon/s.Â Â \r\n8.A.himanshu GV / GC cannot be redeemed on specific block out dates. A.himanshu may add or delete any date on its sole discretion.Â \r\n9.Any dispute related to the GV / GC should be referred to the issuing company and the decision of the issuing company shall be final.\r\n10.IfÂ an Insta Gift Voucher (GV) /Gift Card (GC) gets blocked on account of technical issue, it would get enabled in 72 hours.\r\n11.In case of any issue with the Insta GV / GC, you can write in to bit.ly/2CsY6BX or call 18001033314 for immediate help.',
        checkout_step: null,
        order_number: 4,
        status: 'A',
        order_limit: 'I',
        order_limit_amt: 0,
        new_arrival: 0,
        default_category_id: null,
        brand_master_id: 0,
        how_to_redeem: '{"1":{"text":"Visit: https:\\/\\/euphoriajewellery.in\\/","old_image":"https:\\/\\/images.gyftr.com\\/smartbuy\\/how_to_redeem\\/himanshu1.png","image":"https:\\/\\/images.gyftr.com\\/smartbuy\\/how_to_redeem\\/himanshu1.png"},"2":{"text":"Select your product & add to cart.","old_image":"https:\\/\\/images.gyftr.com\\/smartbuy\\/how_to_redeem\\/himanshu2.png","image":"https:\\/\\/images.gyftr.com\\/smartbuy\\/how_to_redeem\\/himanshu2.png"},"3":{"text":"Click on Have a Gyftr code Tab.","old_image":"https:\\/\\/images.gyftr.com\\/smartbuy\\/how_to_redeem\\/himanshu3.png","image":"https:\\/\\/images.gyftr.com\\/smartbuy\\/how_to_redeem\\/himanshu3.png"},"4":{"text":"Enter: Gift Voucher Code & click on Redeem Now.","old_image":"https:\\/\\/images.gyftr.com\\/smartbuy\\/how_to_redeem\\/himanshu4.png","image":"https:\\/\\/images.gyftr.com\\/smartbuy\\/how_to_redeem\\/himanshu4.png"}}',
        how_to_redeem_url: '',
        redemption_type: 'OFF',
        online_redeem_url: '',
        entertainment_category: null,
        is_show: 'Y',
        template_id: null,
        seo_title: null,
        seo_keyword: null,
        seo_description: null,
        earn_point_ratio: 0.03,
        max_earn_point: null,
        created: new Date('2020-08-26 14:44:10'),
        updated: new Date('2021-06-30 05:07:54'),
        payu: 0,
        is_gift_show: 'N',
        best_seller: 'N',
        best_seller_order_number: 0,
        best_selling_desk_image: 'images/brands/1068_home_best-selling-1.jpg',
        best_selling_mob_image: 'images/brands/11837_deals-1.jpg',
        payunor: 'Y',
        brand_type: 'VOUCHER',
        special_offer: 0,
        gifting_status: 3
      }
      // You can add more brand objects here, separated by commas, for your other data rows.
    ], {});
  },

  /**
   * The 'down' function is executed when you want to undo the seeder (e.g., `db:seed:undo`).
   * It should remove all the data that the 'up' function inserted.
   */
  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('brands', null, {});
  }
};


// #### Step 5: Run the Seeder

// Finally, with your `brands` table created by `sequelize.sync()` and your seeder file ready, execute the seeder from your terminal. This command tells the CLI to find all unprocessed seeder files and run their `up` function.

// ```bash
// npx sequelize-cli db:seed:all