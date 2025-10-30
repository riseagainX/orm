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


//==============================================================
// HELPER FUNCTION: GET SIMPLE PAGE CONTENT
//==============================================================

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


//==============================================================
// MAIN LOGIC: GET HOME PAGE CONTENT
//==============================================================

const getHomePageContent = async () => {
  // Part 1: Fetch static content for the 'HOME' page
  const pageContent = await PageContent.findOne({
    where: { title: 'HOME', status: 'A' },
    attributes: [
      'title', 'banner', 'mob_banner', 'carausel1', 'carausel2', 'carausel3',
      'seo_title', 'seo_keyword', 'seo_description', 'description',
    ],
  });

  // Part 2: Single joined query to fetch eligible brands (categories + products + promotions)
  const brandsData = await Brand.findAll({
    where: { status: 'A' },
    attributes: [
      'id', ['name', 'brand_name'], 'description', 'slug', 'new_arrival',
      'updated', 'seo_title', 'seo_keyword', 'seo_description'
    ],
    include: [
      // must have active category via brand_categories
      {
        model: BrandCategory,
        where: { status: 'A' },
        required: true,
        attributes: [],
        include: [
          {
            model: Category,
            where: { status: 'A' },
            required: true,
            attributes: []
          }
        ]
      },
      // must have active product with stock and not expired (capture prices for denominations)
      {
        model: Product,
        where: {
          status: 'A',
          available_qty: { [Op.gt]: 0 },
          expiry_date: { [Op.gte]: fn('CURDATE') }
        },
        required: true,
        attributes: ['price']
      },
      // must have active discount promotion
      {
        model: PromotionXProduct,
        where: { status: 'A', promotion_type: 'D' },
        required: true,
        attributes: ['short_desc'],
        include: [
          {
            model: Promotion,
            where: { status: 'A', offer_type: 'DIS' },
            required: true,
            attributes: ['id', ['value', 'discount_value'], 'offer_type']
          }
        ]
      }
    ]
  });

  if (brandsData.length === 0) {
    return { pageContent, brandsData: [] };
  }

  // console.log("BrandData ✅🍔✅", JSON.stringify(brandsData, null, 2));

  // Part 3: Batch-fetch a promocode for each promotion (avoid N queries)

  // get clean and unique list of promotion IDs
  const plainBrands = brandsData.map((b) => b.get({ plain: true }));
  // console.log("PLAIN BRAND DATA ✅✅", plainBrands);
  
  const promotionIds = [];
  for (const b of plainBrands) {
    const pxp = b.PromotionXProducts?.[0]; // Use optional chaining for safe access
    // get the unique list of promotion id (!incluude)
    if (pxp && pxp.Promotion && pxp.Promotion.id != null && !promotionIds.includes(pxp.Promotion.id)) {
      promotionIds.push(pxp.Promotion.id);
    }
  }

  let promocodeByPromotionId = new Map(); // Use Map for better performance
  if (promotionIds.length > 0) { // safety check
    const promocodeRows = await Promocode.findAll({
      where: {
        promotion_id: { [Op.in]: promotionIds }, // Batch query using [Op.in]
        status: 'VALID',
        start_date: { [Op.lte]: fn('CURDATE') },
        expiry_date: { [Op.gte]: fn('CURDATE') },
        [Op.or]: [
          { usage_type: 'M' },
          { [Op.and]: [{ usage_type: 'S' }, { blasted: 'Y' }] }
        ]
      },
      attributes: ['promotion_id', 'promocode']
    });

    // console.log(" Promotion With Promocode IDS ✅✅", promocodeRows);

    for (const row of promocodeRows) {
      if (!promocodeByPromotionId.has(row.promotion_id)) { // Use Map's has() for uniqueness check
        promocodeByPromotionId.set(row.promotion_id, row.promocode); // Map key: promotion_id, value: promocode
      }
    }
  }

  // Part 4: Build final response with products_denominations

  const result = [];
  for (const b of plainBrands) {
    const pxp = b.PromotionXProducts?.[0];
    const promotion = pxp?.Promotion;
    if (!promotion) { continue; } // if brand does not have any promotion, then skip it

    // Replicate GROUP_CONCAT for product prices
    const prices = (b.Products || []).map(p => p.price);
    const products_denominations = prices.length > 0 ? prices.join(',') : null;

    // Build the final, flat Data Transfer Object (DTO)
    result.push({
      id: b.id,
      brand_name: b.brand_name,
      description: b.description,
      slug: b.slug,
      new_arrival: b.new_arrival,
      updated: b.updated,
      seo_title: b.seo_title,
      seo_keyword: b.seo_keyword,
      seo_description: b.seo_description,
      products_denominations,
      discount_value: promotion.discount_value,
      offer_type: promotion.offer_type,
      promocode: promocodeByPromotionId.get(promotion.id) || null,
      short_desc: pxp.short_desc
    });
  }

  return { pageContent, brandsData: result };
};


//==============================================================
// MAIN EXPORTED FUNCTION (ROUTER ENTRY POINT)
//==============================================================

const getPageContent = async (givenTitle) => {
  // Use a switch statement to route the request
  switch (givenTitle.toUpperCase()) {
    case 'HOME':
      return getHomePageContent();

    case 'OFFER':
    case 'GIFTING':
    case 'DISCOUNT':
    case 'PROMOCODE':
      return getSimplePageContent(givenTitle);

    default:
      // Throw an error for invalid input
      throw new Error(`Invalid page title provided: ${givenTitle}`);
  }
};

module.exports = { getPageContent };