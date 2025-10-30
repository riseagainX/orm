brand_sub_categorREATE  PROCEDURE `get_page_content`(
    IN `given_title` VARCHAR(100)
)
LANGUAGE SQL
NOT DETERMINISTIC
CONTAINS SQL
SQL SECURITY DEFINER
COMMENT ''
BEGIN
IF(given_title = 'HOME') THEN

    SELECT
title,
        banner,
        mob_banner,
        carausel1,
        carausel2,
        carausel3,
        seo_title,
        seo_keyword,
        seo_description,
        description
FROM page_content
    WHERE `title`=given_title
    AND `status` = 'A';
   
    SELECT
brands.id,
brands.name as brand_name,
brands.description,
brands.slug,
create_cdn_url(brands.brand_icon_url) as brand_icon_url,

create_cdn_url(brands.smart_image_url) as image_url,
create_cdn_url(brands.offer_logo) as offer_logo,

brands.new_arrival,
brands.updated,
brands.seo_title,
brands.seo_keyword,
brands.seo_description,
group_concat(p.price SEPARATOR ',') AS products_denominations,

promotions.value               AS discount_value,
promotions.offer_type AS  offer_type,
promocodes.promocode,
promotion_x_products.short_desc
 
FROM brand_categories
INNER JOIN categories ON categories.id = brand_categories.category_id AND categories.status = 'A'
INNER JOIN brands ON brands.id = brand_categories.brand_id
INNER JOIN offers o ON o.brand_id=brands.id AND o.status='A'  
LEFT JOIN brand_sub_categories AS bsc ON bsc.brand_id=brands.id AND bsc.status='A'
INNER JOIN products AS p ON
(
  p.brand_id = brands.id AND
p.status = 'A' AND
p.available_qty > 0 AND
p.expiry_date >= CURDATE()
)

INNER JOIN
(
promotion_x_products
INNER JOIN products ON
(
products.id = promotion_x_products.product_id AND
products.status = 'A' AND
products.available_qty > 0 AND
products.expiry_date >= CURDATE()
)
INNER JOIN promotions ON
(
promotions.id = promotion_x_products.promotion_id AND
promotions.status = 'A' AND
promotions.offer_type IN ('DIS')
)
INNER JOIN promocodes ON
(
promocodes.promotion_id = promotions.id AND
promocodes.status = 'VALID' AND
promocodes.start_date <= CURDATE() AND
promocodes.expiry_date >= CURDATE() AND
(
promocodes.usage_type = 'M' OR
(
promocodes.usage_type = 'S' AND
promocodes.blasted = 'Y'
)
)
)
)
ON
(
promotion_x_products.status = 'A' AND
promotion_x_products.brand_id = brands.id AND
promotion_x_products.promotion_type = 'D'
)
WHERE brands.status = 'A' AND brand_categories.status = 'A' GROUP BY brands.id
ORDER BY o.order_number;
       
ELSEIF (given_title = 'OFFER') THEN
SELECT
content2 as offer_content,
banner as offer_banner,
            mob_banner as mobile_banner,
seo_title as  seo_title,
            seo_keyword as  seo_keyword,
seo_description as seo_description
        FROM page_content WHERE title=given_title AND status = 'A';
ELSEIF (given_title = 'GIFTING') THEN
SELECT
content2 as gifting_content,
banner as gifting_banner,
mob_banner as mobile_banner,
            seo_title as  seo_title,
            seo_keyword as  seo_keyword,
seo_description as seo_description
        FROM page_content WHERE title=given_title AND status = 'A';        
ELSEIF (given_title = 'DISCOUNT') THEN
SELECT
content2 as discount_content,
banner as discount_banner,
mob_banner as mobile_banner,
            seo_title as  seo_title,
            seo_keyword as  seo_keyword,
seo_description as seo_description
        FROM page_content WHERE title=given_title AND status = 'A';
       ELSEIF (given_title = 'PROMOCODE') THEN
SELECT
content2 as promocode_content,
banner as promocode_banner
        FROM page_content WHERE title=given_title AND status = 'A';
        END IF;

END

Ravikant Maurya, domain_disabled, 12 min
https://www.gyftr.com/dbsdelights

Ravikant Maurya, domain_disabled, 8 min, Edited
All categoris
CREATE  PROCEDURE `categories_with_brands`()
LANGUAGE SQL
NOT DETERMINISTIC
CONTAINS SQL
SQL SECURITY DEFINER
COMMENT ''
BEGIN
/**
*    Optimizing the Procedure (30-03-2021) @author: Anurag Kumar
*    1. remove given_display_type IN query: not necessary
*    2. using create_cdn_url() function instead using concat() at many places
*    3. Formatting and Beautifying the code
*/

    SET session group_concat_max_len=15000;

    SELECT

        categories.name,

        categories.slug,

        create_cdn_url_staging(categories.icon_url) AS icon_url,

        -- group_concat(brands.name SEPARATOR ',') AS brands_name,
        group_concat(DISTINCT brands.name ORDER BY brands.name SEPARATOR ',') AS brands_name,
        group_concat(DISTINCT brands.slug ORDER BY brands.name SEPARATOR ',') AS brands_slug,
        group_concat(brands.brand_master_id ORDER BY brands.name SEPARATOR ',') AS brand_master_id
        -- group_concat(brands.slug SEPARATOR ',') AS brands_slug

    FROM brand_categories

    INNER JOIN categories 
        ON (categories.id = brand_categories.category_id AND categories.status='A')

    INNER JOIN brands 
        ON (brands.id = brand_categories.brand_id AND brands.status = 'A' AND brands.is_show='Y')

    WHERE brand_categories.status = 'A' 

    GROUP BY brand_categories.category_id

    ORDER BY categories.order_number ASC, categories.name ASC;

END

Ravikant Maurya, domain_disabled, 2 min
Brands by category
CREATE PROCEDURE `brands_by_category`(
    IN `given_category_slug` VARCHAR(100),
    IN `given_page` INT,
    IN `given_limit` INT,
    IN `given_user_id` INT,
    IN `given_discount_filter` INT,
    IN `given_from_price_range` INT,
    IN `given_to_price_range` INT,
    IN `given_brand_filter` TEXT,
    IN `given_new_arrival` INT,
    IN `given_display_type` VARCHAR(50)
)
LANGUAGE SQL
NOT DETERMINISTIC
CONTAINS SQL
SQL SECURITY DEFINER
COMMENT ''
BEGIN
    
    DECLARE temp_offset INT;
    SET temp_offset = (given_page - 1) * given_limit;
    SET @points_to_inr_ratio = (SELECT value
                                FROM constants
                                WHERE field = 'POINTS_TO_INR_RATIO');
    SELECT
      brands.id,
      products.id as product_id,
      brands.name,
      brands.description,
      brands.redemption_type,
      brands.slug,
      create_cdn_url_staging(brands.brand_icon_url) as brand_icon_url,
      create_cdn_url_staging(brands.offer_logo) as offer_logo,
      create_cdn_url_staging(brands.smart_image_url) as smart_image_url,
      brands.new_arrival,
      brands.updated,
      promotions.value               AS offer_value,
       promotions.offer_type            AS  offer_type,
       promotions.display_text,
       categories.id AS category_id,
      categories.name AS category_name,
      categories.name AS category_product,
      categories.category_banner_image AS category_banner_image,
      categories.seo_title AS category_seo_title,
      categories.seo_keyword AS category_seo_keyword,
      categories.seo_description AS category_seo_description,
     products.available_qty,
      products.price,
      products.name as product_name,      
      promocodes.promocode                   AS default_promocode,
      promotions.value                       AS default_promocode_value,
      promotions.offer_type                  AS default_offer_type,
      promotions.display_text                AS default_offer_display_text,
      promotion_x_products.product_qty       AS default_product_qty,
      promotion_x_products.offer_product_qty AS default_offer_product_qty,
      promotions.tnc as default_offer_tnc,
      products.max_point_limit
      FROM brand_categories
      INNER JOIN categories ON categories.id = brand_categories.category_id AND categories.status = 'A' AND  categories.display_type IN('ALL', given_display_type)

      INNER JOIN brands ON brands.id = brand_categories.brand_id AND brands.display_type IN('ALL', given_display_type) AND brands.status='A'

      INNER JOIN products AS p

        ON (p.brand_id = brands.id AND p.status = 'A' AND p.available_qty > 0

            AND

            p.expiry_date >= CURDATE() AND p.display_type IN('ALL', given_display_type))

      LEFT JOIN (promotion_x_products

        INNER JOIN products

          ON (products.id = promotion_x_products.product_id AND products.status = 'A' AND products.available_qty > 0

              AND

              products.expiry_date >= CURDATE() AND products.display_type IN('ALL', given_display_type))

        INNER JOIN promotions ON (promotions.id = promotion_x_products.promotion_id AND promotions.status = 'A' AND

                                  promotions.offer_type IN ('DIS', 'ABS','OFFER') AND promotions.display_type IN('ALL', given_display_type))

        INNER JOIN promocodes ON (

          promocodes.promotion_id = promotions.id AND promocodes.status = 'VALID' AND promocodes.start_date <= CURDATE()

          AND

          promocodes.expiry_date >= CURDATE() AND

          (promocodes.usage_type = 'M' OR (promocodes.usage_type = 'S' AND promocodes.blasted = 'Y')))

        )

        ON (promotion_x_products.status = 'A' AND promotion_x_products.brand_id = brands.id AND

            promotion_x_products.promotion_type = 'D')



    WHERE (given_category_slug IS NULL OR categories.slug = given_category_slug) AND brands.status = 'A' AND

          brand_categories.status = 'A' AND
          brands.is_show='Y' and

          (given_discount_filter IS NULL OR

           (promotions.value >= given_discount_filter AND promotions.offer_type = 'DIS')) AND

          (given_from_price_range IS NULL OR (p.price * @points_to_inr_ratio) >= given_from_price_range) AND

          (given_to_price_range IS NULL OR (p.price * @points_to_inr_ratio) <= given_to_price_range) AND

          (given_new_arrival IS NULL OR brands.new_arrival = given_new_arrival) AND

          (given_brand_filter IS NULL OR find_in_set(brands.slug, given_brand_filter) > 0)

    GROUP BY brands.id

    ORDER BY brands.order_number ASC, brands.name ASC

    LIMIT temp_offset, given_limit;



    SELECT COUNT(DISTINCT brands.id) AS count

    FROM brand_categories

      INNER JOIN categories ON (categories.id = brand_categories.category_id AND categories.status = 'A' AND categories.display_type IN('ALL', given_display_type))

      INNER JOIN brands ON (brands.id = brand_categories.brand_id AND brands.display_type IN('ALL', given_display_type))

      INNER JOIN products AS p

        ON (p.brand_id = brands.id AND p.status = 'A' AND p.available_qty > 0

            AND

            p.expiry_date >= CURDATE() AND p.display_type IN('ALL', given_display_type))

      LEFT JOIN (promotion_x_products

        INNER JOIN products

          ON (products.id = promotion_x_products.product_id AND products.status = 'A' AND products.available_qty > 0

              AND

              products.expiry_date >= CURDATE() AND products.display_type IN('ALL', given_display_type))

        INNER JOIN promotions ON (promotions.id = promotion_x_products.promotion_id AND promotions.status = 'A' AND

                                  promotions.offer_type IN ('DIS', 'ABS','OFFER') AND promotions.display_type IN('ALL', given_display_type))

        INNER JOIN promocodes ON (

          promocodes.promotion_id = promotions.id AND promocodes.status = 'VALID' AND promocodes.start_date <= CURDATE()

          AND

          promocodes.expiry_date >= CURDATE() AND

          (promocodes.usage_type = 'M' OR (promocodes.usage_type = 'S' AND promocodes.blasted = 'Y')))

        )

        ON (promotion_x_products.status = 'A' AND promotion_x_products.brand_id = brands.id AND

            promotion_x_products.promotion_type = 'D')



    WHERE (given_category_slug IS NULL OR categories.slug = given_category_slug) AND brands.status = 'A' AND

          brand_categories.status = 'A' AND
         brands.is_show='Y' and

          (given_discount_filter IS NULL OR

           (promotions.value >= given_discount_filter AND promotions.offer_type = 'DIS')) AND

          (given_from_price_range IS NULL OR (p.price * @points_to_inr_ratio) >= given_from_price_range) AND

          (given_to_price_range IS NULL OR (p.price * @points_to_inr_ratio) <= given_to_price_range) AND

          (given_new_arrival IS NULL OR brands.new_arrival = given_new_arrival) AND

          (given_brand_filter IS NULL OR find_in_set(brands.slug, given_brand_filter) > 0);

  END
