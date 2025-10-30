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

// HELPER FUNCTION FOR SIMPLE PAGES
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

// LOGIC FOR THE COMPLEX 'HOME' PAGE
const getHomePageContent = async () => {
  // Part 1: Fetch static page content for 'HOME'
  const pageContent = await PageContent.findOne({
    where: { title: 'HOME', status: 'A' },
    attributes: [
      'title', 'banner', 'mob_banner', 'carausel1', 'carausel2', 'carausel3',
      'seo_title', 'seo_keyword', 'seo_description', 'description',
    ],
  });

  // Part 2: Single joined query to fetch eligible brands
  const brandsData = await Brand.findAll({
    where: { status: 'A' },
    attributes: [
      'id', ['name', 'brand_name'], 'description', 'slug', 'new_arrival',
      'updated', 'seo_title', 'seo_keyword', 'seo_description'
    ],
    include: [
      // Must have active category via BrandCategory (INNER JOIN)
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
      // Must have active, in-stock, non-expired product (INNER JOIN)
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
      // Must have active discount promotion (INNER JOIN)
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

  // Part 3: Batch-fetch a promocode for each promotion (AVOIDS N+1 QUERIES)
  const plainBrands = brandsData.map((b) => b.get({ plain: true }));
  const promotionIds = [];
  for (const b of plainBrands) {
    const pxp = b.PromotionXProducts && b.PromotionXProducts[0];
    // Get unique list of promotion IDs
    if (pxp && pxp.Promotion && pxp.Promotion.id != null && !promotionIds.includes(pxp.Promotion.id)) {
      promotionIds.push(pxp.Promotion.id);
    }
  }

  let promocodeByPromotionId = {};
  if (promotionIds.length > 0) { // Safety check before querying database
    const promocodeRows = await Promocode.findAll({
      where: {
        promotion_id: promotionIds, // Batch query (promotion_id IN (...))
        status: 'VALID',
        start_date: { [Op.lte]: fn('CURDATE') },
        expiry_date: { [Op.gte]: fn('CURDATE') },
        [Op.or]: [ // Usage type logic
          { usage_type: 'M' },
          { [Op.and]: [{ usage_type: 'S' }, { blasted: 'Y' }] }
        ]
      },
      attributes: ['promotion_id', 'promocode']
    });

    for (const row of promocodeRows) {
      if (promocodeByPromotionId[row.promotion_id] == null) {
        // Map key (promotion_id) to value (promocode), ensuring one per promotion
        promocodeByPromotionId[row.promotion_id] = row.promocode;
      }
    }
  }

  // Part 4: Build final response with products_denominations (DTO)
  const result = [];
  for (const b of plainBrands) {
    const pxp = b.PromotionXProducts && b.PromotionXProducts[0];
    const promotion = pxp && pxp.Promotion;
    if (!promotion) { continue; } // Skip if brand is missing promotion data

    // Replicate GROUP_CONCAT(p.price) by mapping and joining in JS
    let productList;
    if (b.Products) {
      productList = b.Products;
    } else {
      productList = [];
    }

    const prices = [];
    for (const product of productList) {
      prices.push(product.price);
    }

    let products_denominations;
    if (prices.length > 0) {
      products_denominations = prices.join(',');
    } else {
      products_denominations = null;
    }

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
      promocode: promocodeByPromotionId[promotion.id] || null,
      short_desc: pxp.short_desc
    });
  }

  return { pageContent, brandsData: result };
};

// MAIN EXPORTED FUNCTION (Routing logic)
const getPageContent = async (givenTitle) => {
  // Use switch to route based on page title
  switch (givenTitle.toUpperCase()) {
    case 'HOME':
      return getHomePageContent();
    case 'OFFER':
    case 'GIFTING':
    case 'DISCOUNT':
    case 'PROMOCODE':
      return getSimplePageContent(givenTitle);
    default:
      // Throw error for invalid input
      throw new Error(`Invalid page title provided: ${givenTitle}`);
  }
};

module.exports = { getPageContent };