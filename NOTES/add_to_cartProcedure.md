CALL add_to_cart(
    1,                -- given_user_id (user ID = 101)
    1340,                 -- given_product_id (product ID = 55)
    1,                  -- given_quantity (buying 2 units)
    NULL,       -- given_promocode (promo applied)
    'WEBSITE',          -- given_display_type (added via Website)
    'Gaurav ',     -- given_delivery_name (receiver name)
    'gaurav@example.com',-- given_delivery_email (receiver email)
    '9876543210',       -- given_delivery_phone (receiver phone)
    0,                  -- given_cart_mode (0 = Add to Cart, 1 = Buy Now)
    'Y',                -- given_gift_status ('Y' = gift, 'N' = normal)
    'Happy Birthday!',  -- given_gift_text (gift message)
    'http://img.com/gift.jpg', -- given_gift_img_url (gift image)
    'ritesh',       -- given_sender_name (who is sending)
    1693958400         -- given_delivery_date (timestamp → e.g., 6 Sep 2023 00:00:00)
);

DELIMITER $$
CREATE PROCEDURE `add_to_cart`(
    IN `given_user_id` INT,
    IN `given_product_id` INT,
    IN `given_quantity` INT,
    IN `given_promocode` VARCHAR(50),
    IN `given_display_type` VARCHAR(50),
    IN `given_delivery_name` VARCHAR(255),
    IN `given_delivery_email` VARCHAR(255),
    IN `given_delivery_phone` VARCHAR(100),
    IN `given_cart_mode` INT,
    IN `given_gift_status` ENUM('Y','N'),
    IN `given_gift_text` TEXT,
    IN `given_gift_img_url` VARCHAR(255),
    IN `given_sender_name` VARCHAR(255),
    IN `given_delivery_date` BIGINT
)
LANGUAGE SQL
NOT DETERMINISTIC
CONTAINS SQL
SQL SECURITY DEFINER
COMMENT ''
BEGIN
    -- Validation 1: Check if user has already consumed this promocode
    IF 1 > 2 THEN
        SELECT "You have already consume this promocode." AS error;
    -- Validation 2: Check if product is valid, active, not expired, and has enough stock
    ELSEIF (SELECT COUNT(*) FROM products INNER JOIN brands ON (brands.id = products.brand_id AND brands.status = 'A' AND brands.is_show='Y')
        WHERE products.id = given_product_id AND products.expiry_date >= CURDATE() AND products.available_qty >= given_quantity 
        AND products.status = 'A') = 0 THEN
        SELECT "Invalid product." AS error;
        
    ELSE
        -- Branch for when a promocode is provided
        IF given_promocode IS NOT NULL THEN
            SET @promocode_id = NULL;
            
            -- Find and validate the promocode and get its details
            SELECT 
                promocodes.id,
                promotions.display_type,
                promotions.value                 
            INTO 
                @promocode_id,
                @display_type,
                @promotion_val
            FROM promotion_x_products INNER JOIN products ON (products.id = promotion_x_products.product_id AND
                products.status = 'A' AND products.available_qty > 0 AND products.expiry_date >= CURDATE() )
                INNER JOIN promotions ON (promotions.id = promotion_x_products.promotion_id AND promotions.status = 'A' )
                INNER JOIN promocodes ON (promocodes.promotion_id = promotions.id AND promocodes.status = 'VALID' AND promocodes.start_date <= CURDATE() AND
                promocodes.expiry_date >= CURDATE() AND (promocodes.usage_type = 'M' OR (promocodes.usage_type = 'S' AND promocodes.blasted = 'Y')))
                WHERE promotion_x_products.status = 'A' AND promotion_x_products.product_id = given_product_id AND promocodes.promocode = given_promocode;
                
            -- Proceed if a valid promocode ID was found (no more game code check)
            IF @promocode_id IS NOT NULL THEN
            
                -- Check if the item already exists in the cart
                SET @record_row_id = (SELECT id FROM cart_items WHERE user_id = given_user_id AND product_id = given_product_id);
                
                IF @record_row_id IS NOT NULL
                THEN
                    -- UPDATE existing cart item
                    UPDATE cart_items SET quantity = quantity+given_quantity WHERE user_id=given_user_id AND product_id = given_product_id;
                    SELECT "Item added to cart." AS success, @record_row_id AS cart_item_id;
                ELSE
                    -- INSERT new cart item with the promocode
                    INSERT INTO cart_items (product_id, user_id, quantity, promocode_id,delivery_name,delivery_phone,delivery_email,delivery_sender_name,gift,gift_text,gift_img_url, created,buynow)
                    VALUES (given_product_id, given_user_id, given_quantity, @promocode_id,given_delivery_name,given_delivery_phone,given_delivery_email,given_sender_name,given_gift_status,given_gift_text,given_gift_img_url, NOW(),given_cart_mode);
                    SELECT "Item added to cart." AS success, LAST_INSERT_ID() AS cart_item_id;
                END IF;

            ELSE
                SELECT "Invalid promocode provided." AS error;
            END IF;
            
        -- Branch for when NO promocode is provided
        ELSE
            -- Check if the item already exists in the cart
            SET @record_row_id = (SELECT id FROM cart_items WHERE user_id = given_user_id AND product_id = given_product_id);
            
            IF @record_row_id IS NOT NULL
            THEN
                -- UPDATE existing cart item
                UPDATE cart_items SET quantity = quantity+given_quantity WHERE user_id=given_user_id AND product_id = given_product_id;
                SELECT "Item added to cart." AS success, @record_row_id AS cart_item_id;
            ELSE
                -- INSERT new cart item without a promocode
                INSERT INTO cart_items (product_id, user_id, quantity, promocode_id,delivery_name,delivery_phone,delivery_email,delivery_sender_name,gift,gift_text,gift_img_url, created,buynow)
                VALUES (given_product_id, given_user_id, given_quantity,NULL,given_delivery_name,given_delivery_phone,given_delivery_email,given_sender_name,given_gift_status,given_gift_text,given_gift_img_url, NOW(),given_cart_mode);
                SELECT "Item added to the cart." AS success, LAST_INSERT_ID() AS cart_item_id;
            END IF;
        END IF;

    END IF;
END $$
DELIMITER ;

