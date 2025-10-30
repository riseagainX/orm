
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

  // === Part 2: Single joined query to fetch eligible brands (categories + products + promotions) ===
  const brandsData = await Brand.findAll({
    where: { status: 'A' },
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

  // === Part 3: Batch-fetch a promocode for each promotion (avoid N queries) ===

  //get clean and unique list of promotion IDs
  const plainBrands = brandsData.map((b) => b.get({ plain: true }));
  // console.log("PLAIN BRAND DATA ✅✅", plainBrands);
  const promotionIds = [];
  for (const b of plainBrands) {
    const pxp = b.PromotionXProducts && b.PromotionXProducts[0];
    //get the unique list of promotion id (!incluude)
    if (pxp && pxp.Promotion && pxp.Promotion.id != null && !promotionIds.includes(pxp.Promotion.id)) {
      promotionIds.push(pxp.Promotion.id);
    }
  }

  let promocodeByPromotionId = {};
  if (promotionIds.length > 0) { // does promotionids (created on last step) contain any promotionID(safefy check)
    const promocodeRows = await Promocode.findAll({
      where: {
        promotion_id: promotionIds,  // MYSQL - promotion_id IN (101, 102, 105, ...)// batch query -- avoiding N queries ( instead of using for loop which run N no of times for each promotion id  , we are giving batch of ids in where clause)  -- OPTIMIZATION
        status: 'VALID',
        start_date: { [Op.lte]: fn('CURDATE') },
        expiry_date: { [Op.gte]: fn('CURDATE') },
        [Op.or]: [  // Either its usage_type is 'M' (Multi-use). Or its usage_type is 'S' (Single-use) AND it has been activated (blasted: 'Y').
          { usage_type: 'M' },
          { [Op.and]: [{ usage_type: 'S' }, { blasted: 'Y' }] }
        ]
      },
      attributes: ['promotion_id', 'promocode']
    });

    console.log(" Promotion With Promocode IDS ✅✅", promocodeRows);

    for (const row of promocodeRows) {
      if (promocodeByPromotionId[row.promotion_id] == null) {  
        //his check says, "Have we already found a promocode for this promotion ID?"
        // // map the key(promotion_id) with value(promocode) ++ 1 promtotion to 1 promoocode 
        promocodeByPromotionId[row.promotion_id] = row.promocode;
      }
    }
    // after this loop, we have object of promotion_id to promocode
    // {
  // 101: 'SAVE10',
  //102: 'DEAL20',
  // 105: 'WINTERFUN'
     //}
  }

  // === Part 4: Build final response with products_denominations ===
  const result = [];
  for (const b of plainBrands) {
    const pxp = b.PromotionXProducts && b.PromotionXProducts[0];
    const promotion = pxp && pxp.Promotion;
    if (!promotion) { continue; } // if brand does not have any promotion, then skip it


    // this is equivalent to mysql >group_concat(p.price SEPARATOR ',') AS products_denominations, 
    // const prices = (b.Products || []).map(p => p.price);   
    // const products_denominations = prices.length > 0 ? prices.join(',') : null;
    // OPTIMIZED  - This 2 line is optimised of below code (we can replace it ) //  
     
    // below Code _ For learning Purpose only

let productList;
if (b.Products) {
  // If the list exists, we'll use it.
  productList = b.Products;
} else {
  // This prevents our code from crashing in the next step.
  productList = []; 
}

// Now, create a new empty list that will only hold the prices.
const prices = [];

// Loop through each 'product' in our 'productList'.
for (const product of productList) {

  prices.push(product.price); 
}
// After this loop, 'prices' will look like: [100, 200, 500]


// Declare the final variable we want to create.
let products_denominations;

// Check if our 'prices' list has anything in it.
if (prices.length > 0) {
  // If it's NOT empty, join all items into a single string, using a comma as the separator.
  products_denominations = prices.join(','); 
  // Example result: "100,200,500"
} else {
  // If the 'prices' list IS empty, set the final value to null.
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