
const {
  PageContent,
  Brand,
  Category,
  Product,
  PromotionXProduct,
  Promotion,
  Promocode,
  BrandCategory,
} = require('../models');
const { Op, fn } = require('sequelize');


// HELPER FUNCTION FOR SIMPLE PAGES (OFFER, GIFTING, ETC.)

const getSimplePageContent = async (title) => {
  const pageContent = await PageContent.findOne({
    where: { title, status: 'A' },

    attributes: [
      'title', 'banner', 'mob_banner', 'carausel1', 'carausel2', 'carausel3',
      'seo_title', 'seo_keyword', 'seo_description', 'description',
    ],
  });
  return { pageContent };
};


// LOGIC FOR THE COMPLEX 'HOME' PAGE USING SEQUELIZE ORM

const getHomePageContent = async () => {
  // === Part 1: Fetch the static page content for 'HOME' ===
  const pageContent = await PageContent.findOne({
    where: { title: 'HOME', status: 'A' },
    attributes: [
      'title', 'banner', 'mob_banner', 'carausel1', 'carausel2', 'carausel3',
      'seo_title', 'seo_keyword', 'seo_description', 'description',
    ],
  });

  // === Part 2: Use Sequelize ORM with separate queries approach ===
  
  // Step 1: Get brands that have active categories
  // note - IN sequilzer , the direction of query matter(inner join) (means category include brand   and brand include category , both gives diffrent structure data . ).. because sequilze give data in array of object , but mysql give flat table data 
  const brandsWithCategories = await Brand.findAll({  // method 1 - filter funnel ( filters brand in different steps)
    attributes: ['id'],
    where: { status: 'A' },
    include: [
      {
        model: BrandCategory,
        where: { status: 'A' },
        required: true,
        include: [
          {
            model: Category,
            where: { status: 'A' },
            required: true,
            attributes: []
          }
        ],
        attributes: []
      }
    ]
  });

  // console.log("LIST OF brand ID's 🔁🔁",brandsWithCategories);
  if (brandsWithCategories.length === 0) {
    return { pageContent, brandsData: [] };
  }

  const brandIds = brandsWithCategories.map(b => b.id);

  // Step 2: Get brands that have active products
  const brandsWithProducts = await Brand.findAll({
    attributes: ['id'],
    where: { 
      id: brandIds,  // This is the JavaScript equivalent of an SQL WHERE id IN (...) clause and is extremely efficient.
      status: 'A' // reconfirm that brand is active 
    },
    include: [
      {
        model: Product,
        where: { 
          status: 'A',
          available_qty: { [Op.gt]: 0 },  //gretater than
          expiry_date: { [Op.gte]: fn('CURDATE') } // greater t han and equal to 
        },
        required: true, // inner join 
        attributes: []     // attributes: []: Once again, we tell Sequelize that we are only using the Product table for filtering. We don't need any of its data in the output of this specific query.
      }
    ]
  });

  if (brandsWithProducts.length === 0) {
    return { pageContent, brandsData: [] };
  }

  const productBrandIds = brandsWithProducts.map(b => b.id);

  // Step 3: Get brands that have active promotions
  const brandsWithPromotions = await Brand.findAll({
    attributes: ['id'],
    where: { 
      id: productBrandIds,
      status: 'A' 
    },
    include: [
      {
        model: PromotionXProduct,
        where: { 
          status: 'A',
          promotion_type: 'D'
        },
        required: true,
        attributes: []
      }
    ]
  });

  if (brandsWithPromotions.length === 0) {
    return { pageContent, brandsData: [] };
  }

  const promotionBrandIds = brandsWithPromotions.map(b => b.id);

  // Step 4: Get the final brand data with promotions and promocodes
  const brandsData = await Brand.findAll({
    where: { 
      id: promotionBrandIds,
      status: 'A' 
    },
    attributes: [
      'id', 
      ['name', 'brand_name'], 
      'description', 
      'slug', 
      'new_arrival',
      'updated', 
      'seo_title', 
      'seo_keyword', 
      'seo_description'
    ],
    include: [
      {
        model: PromotionXProduct,
        where: { 
          status: 'A',
          promotion_type: 'D'
        },
        required: true,
        attributes: ['short_desc'],
        include: [
          {
            model: Promotion,
            where: { 
              status: 'A',
              offer_type: 'DIS'
            },
            required: true,
            attributes: [
              'id',
              ['value', 'discount_value'],
              'offer_type'
            ]
          }
        ]
      }
    ]
  });

  const cleanData = brandsData.map(it =>{
     return it.get({plain: true});
  })

  console.log("FINAL BRAND DATA ����✅❌❌", JSON.stringify(cleanData, null, 2));

  // Step 5: Get promocodes separately and merge the data
  const brandPromotionData = [];
  // let count =0;
  for (const brand of brandsData) {
 
    const brandPlain = brand.get({ plain: true });
    const promotionXProduct = brandPlain.PromotionXProducts[0]; 
    
    if (promotionXProduct && promotionXProduct.Promotion) {
      // Get promocodes for this promotion
      const promocodes = await Promocode.findAll({
        where: {
          promotion_id: promotionXProduct.Promotion.id,
          status: 'VALID',
          start_date: { [Op.lte]: fn('CURDATE') },
          expiry_date: { [Op.gte]: fn('CURDATE') },
          [Op.or]: [
            { usage_type: 'M' },
            { 
              [Op.and]: [
                { usage_type: 'S' },
                { blasted: 'Y' }
              ]
            }
          ]
        },
        attributes: ['promocode'],
        limit: 1
      });

      brandPromotionData.push({
        id: brandPlain.id,
        brand_name: brandPlain.brand_name,
        description: brandPlain.description,
        slug: brandPlain.slug,
        new_arrival: brandPlain.new_arrival,
        updated: brandPlain.updated,
        seo_title: brandPlain.seo_title,
        seo_keyword: brandPlain.seo_keyword,
        seo_description: brandPlain.seo_description,
        discount_value: promotionXProduct.Promotion.discount_value,
        offer_type: promotionXProduct.Promotion.offer_type,
        promocode: promocodes.length > 0 ? promocodes[0].promocode : null,
        short_desc: promotionXProduct.short_desc
      });
    }
  }

  return { pageContent, brandsData: brandPromotionData };
};


// MAIN EXPORTED FUNCTION


const getPageContent = async (givenTitle) => {
  // Use a switch statement, the direct JavaScript equivalent of SQL's IF/ELSEIF.
  switch (givenTitle.toUpperCase()) {
    case 'HOME':
      return getHomePageContent();

    case 'OFFER':
    case 'GIFTING':
    case 'DISCOUNT':
    case 'PROMOCODE':
      return getSimplePageContent(givenTitle);

    default:
      // Throw an error for invalid input, which can be caught by the controller.
      throw new Error(`Invalid page title provided: ${givenTitle}`);
  }
};

module.exports = { getPageContent };