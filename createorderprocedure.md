DELIMITER $$

CREATE DEFINER=`awswebuserdev`@`%` PROCEDURE `create_order_v1`(
    IN `given_user_id` INT,
    IN `given_cart_item_ids` VARCHAR(200),
    IN `given_display_type` VARCHAR(50),
    IN `given_ip_address` VARCHAR(100),
    IN `given_utm_source` VARCHAR(50),
    IN `given_whatsapp` VARCHAR(5)
    -- Removed IN `given_coupon_id` INT
)
LANGUAGE SQL
NOT DETERMINISTIC
CONTAINS SQL
SQL SECURITY DEFINER
COMMENT ''
BEGIN

    -- ==========================================================
    -- Variable Declarations
    -- ==========================================================
    DECLARE cursor_length INTEGER DEFAULT 0;
    DECLARE LOOP_FINISHED INTEGER DEFAULT 0;
    DECLARE temp_cart_item_id VARCHAR(200);
    DECLARE temp_cart_item_qty VARCHAR(200);
    DECLARE temp_cart_item_total_qty INT(11);
    DECLARE temp_cart_sender_name VARCHAR(200);
    DECLARE temp_cart_delivery_name VARCHAR(200);
    DECLARE temp_cart_delivery_email VARCHAR(200);
    DECLARE temp_cart_delivery_phone VARCHAR(200);
    DECLARE temp_cart_promocode_id VARCHAR(200);
    DECLARE temp_brand_id VARCHAR(200);
    DECLARE temp_product_id VARCHAR(200);
    DECLARE temp_product_price VARCHAR(200);
    DECLARE temp_product_name VARCHAR(200);
    DECLARE temp_offer_brand_id VARCHAR(200);
    DECLARE temp_offer_product_id VARCHAR(200);
    DECLARE temp_offer_product_price VARCHAR(200);
    DECLARE temp_offer_qty VARCHAR(200);
    DECLARE temp_promocode_id VARCHAR(200);
    DECLARE temp_promocode_user_max_usage INT(11);
    DECLARE temp_promocode_total_max_usage INT(11);
    DECLARE temp_promocode_used_count INT(11);
    DECLARE temp_promotion_value VARCHAR(200);
    DECLARE temp_promotion_offer_type VARCHAR(200);
    DECLARE temp_promocode_user_used_count INT(11);
    DECLARE temp_delivery_date VARCHAR(50);
    DECLARE temp_template_id INT(11);
    DECLARE temp_gift VARCHAR(2);
    DECLARE temp_gift_text VARCHAR(255);
    DECLARE temp_gift_img_url VARCHAR(255);
    DECLARE temp_brand_template_id INT(11);
    DECLARE temp_product_discount INT(11);
    DECLARE temp_offer_product_discount INT(11);
    DECLARE temp_brand_payu INT(11);
    DECLARE brand_templateid INT(11);
    DECLARE temp_order_limit VARCHAR(2);
    DECLARE temp_order_amt INT(11);
    DECLARE temp_brand_name VARCHAR(200);

    -- ==========================================================
    -- Cursor Definition: Fetch detailed cart item data
    -- ==========================================================
    DECLARE cart_items_cursor CURSOR FOR
        SELECT
            brands.payu AS brand_payu,
            brands.template_id AS brand_templateid,
            cart_items.id AS cart_item_id,
            cart_items.quantity AS cart_item_qty,
            cart_items.delivery_sender_name AS cart_delivery_sender_name,
            cart_items.delivery_name AS cart_delivery_name,
            cart_items.delivery_email AS cart_delivery_email,
            cart_items.delivery_phone AS cart_delivery_phone,
            cart_items.promocode_id AS cart_promocode_id,
            cart_items.delivery_date AS delivery_date,
            cart_items.template_id AS template_id,
            cart_items.gift AS gift,
            cart_items.gift_text,
            cart_items.gift_img_url,
            brands.id AS brand_id,
            products.id AS product_id,
            products.price AS product_price,
            products.name AS product_name,
            offer_brand.id AS offer_brand_id,
            offer_product.id AS offer_product_id,
            offer_product.price AS offer_product_price,
            FLOOR(cart_items.quantity / promotion_x_products.product_qty) *
                promotion_x_products.offer_product_qty AS offer_qty,
            promocodes.id AS promocode_id,
            promocodes.user_max_usage AS promocode_user_max_usage,
            promocodes.total_max_usage AS promocode_total_max_usage,
            (SELECT IFNULL(SUM(od.quantity), 0)
             FROM order_details od
             INNER JOIN orders o ON (o.id = od.order_id AND o.status != 'F')
             WHERE od.promocode_id = promocodes.id) AS promocode_used_count,
            promotions.value AS promotion_value,
            promotions.offer_type AS promotion_offer_type,
            (SELECT IFNULL(SUM(od.quantity), 0)
             FROM order_details od
             INNER JOIN orders o ON (o.id = od.order_id AND o.status != 'F')
             WHERE od.promocode_id = promocodes.id AND o.user_id = given_user_id) AS promocode_user_usage_count,
            (SELECT IFNULL(SUM(ci.quantity), 0)
             FROM cart_items ci
             WHERE ci.user_id = given_user_id AND ci.product_id = products.id
             GROUP BY ci.product_id) AS cart_item_total_qty,
            offer_brand.template_id AS brand_template_id,
            promotion_x_products.product_discount,
            promotion_x_products.offer_product_discount,
            brands.order_limit,
            brands.order_limit_amt,
            brands.name AS brand_name
        FROM cart_items
        LEFT JOIN products
            ON (products.status = 'A' AND products.expiry_date >= CURDATE() AND
                products.available_qty > 0 AND
                products.id = cart_items.product_id AND
                products.display_type IN ('ALL', given_display_type))
        LEFT JOIN brands
            ON (brands.id = products.brand_id AND brands.status = 'A' AND
                brands.display_type IN ('ALL', given_display_type))
        LEFT JOIN (
            promotion_x_products AS promotion_x_products
            LEFT JOIN (
                products AS offer_product
                INNER JOIN brands AS offer_brand ON (
                    offer_brand.id = offer_product.brand_id AND offer_brand.status = 'A' AND
                    offer_brand.display_type IN ('ALL', given_display_type)
                )
            )
            ON (
                offer_product.status = 'A' AND offer_product.expiry_date >= CURDATE() AND
                offer_product.available_qty > 0 AND
                offer_product.id = promotion_x_products.offer_product_id AND
                offer_product.display_type IN ('ALL', given_display_type)
            )
            INNER JOIN promotions AS promotions
                ON (promotions.id = promotion_x_products.promotion_id AND
                    promotions.status = 'A' AND
                    promotions.display_type IN ('ALL', 'GAME', given_display_type))
            INNER JOIN promocodes AS promocodes ON (
                promocodes.promotion_id = promotions.id AND promocodes.status = 'VALID' AND
                promocodes.start_date <= CURDATE() AND
                promocodes.expiry_date >= CURDATE() AND
                (promocodes.usage_type = 'M' OR (promocodes.usage_type = 'S' AND promocodes.blasted = 'Y'))
            )
        ) 
        ON (promotion_x_products.status = 'A' AND
            promocodes.id = cart_items.promocode_id AND
            promotion_x_products.product_id = cart_items.product_id)
        WHERE cart_items.user_id = given_user_id AND
              find_in_set(cart_items.id, given_cart_item_ids) > 0
        ORDER BY cart_items.created DESC
        FOR UPDATE;

    -- Handler for cursor loop exit
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET LOOP_FINISHED = 1;

    -- ==========================================================
    -- Check User Purchase Limits (Commented Out)
    -- ==========================================================
    SET @user_order_buying_cap_status = NULL;
    -- SET @user_order_buying_cap_status = FIND_USER_ORDER_BUYING_LIMIT(given_cart_item_ids,given_user_id,given_ip_address);

    IF (@user_order_buying_cap_status > 1) THEN
        IF (@user_order_buying_cap_status = 2) THEN
            SET @temp_error = 'You have reached your 15 days limit of INR 25 Thousands worth of Gift Vouchers.';
        ELSEIF (@user_order_buying_cap_status = 3) THEN
            SET @temp_error = 'You have reached your first 10 days limit of INR 50 Thousands worth of Gift Vouchers.';
        ELSEIF (@user_order_buying_cap_status = 4) THEN
            SET @temp_error = 'You have reached your first 40 days limit of INR 1 Lac worth of Gift Vouchers.';
        ELSEIF (@user_order_buying_cap_status = 5) THEN
            SET @temp_error = 'You have reached your first 15 days limit of INR 10 Thousands worth of Flipkart/Amazone Gift Vouchers.';
        ELSEIF (@user_order_buying_cap_status = 6) THEN
            SET @temp_error = 'You have reached your first 30 days limit of INR 25 Thousands worth of Flipkart/Amazone Gift Vouchers.';
        ELSEIF (@user_order_buying_cap_status = 7) THEN
            SET @temp_error = 'You have reached your first 90 days limit of INR 75 Thousands worth of Flipkart/Amazone Gift Vouchers.';
        END IF;

    ELSE
        -- ==========================================================
        -- Main Order Creation Logic
        -- ==========================================================
        OPEN cart_items_cursor;
        SELECT FOUND_ROWS() INTO cursor_length;

        START TRANSACTION;

        -- Get conversion ratios
        SET @points_to_inr_ratio = (SELECT value FROM constants WHERE field = 'POINTS_TO_INR_RATIO');
        SET @inr_to_points_ratio = (SELECT value FROM constants WHERE field = 'INR_TO_POINTS_RATIO');

        -- Initialize totals and flags
        SET @total_points = 0;
        SET @total_amount = 0;
        SET @offer_points = 0;
        SET @offer_amount = 0;
        SET @temp_error = NULL;
        SET @payu_amount = 0;
        -- Removed Coupon Variables
        -- SET @totalCouponValue = 0;
        -- SET @v_coupon_id = NULL;
        -- SET @totalUseedCouponValue = 0;
        SET @total_cart_amount = 0;

        -- Removed Coupon Validation Block

        -- Create the initial order record (without coupon_id)
        INSERT INTO orders (
             display_type, user_id, total_points, cash_spent, offer_points,
            payback_points_spent, points_to_inr_ratio, inr_to_points_ratio,
            payback_points_earned, extra_payback_points_earned, status, created,
            ip_address, whats_app
        )
        VALUES (
             given_display_type, given_user_id, 0, 0, 0, 0, -- Set payback_points_spent to 0
            @points_to_inr_ratio, @inr_to_points_ratio, 0, 0, 'I', NOW(),
            given_ip_address, given_whatsapp
        );
        SET @var_order_id = LAST_INSERT_ID();

        -- Generate and update order GUID
        SET @var_order_guid = CONCAT('DBS-', (UNIX_TIMESTAMP() - 1483452128) + @var_order_id, '-', (UNIX_TIMESTAMP()));
        UPDATE orders SET guid = @var_order_guid WHERE id = @var_order_id;

        -- Initialize loop counters and accumulators
        SET @temp_counter = 1;
        SET @totalExtraCashback = 0;
        SET @totalMaxCashbackPoints = 0;
        SET @totalEarningPoints = 0;
        SET @defaultEarnPointStatus = 0;
        SET @totalPromotionCash = 0;
        SET @productinfo = '';
        SET @PAYUNOR = 0;
        SET @AMZ_ORDER_AMOUNT = 0;
        SET @FKT_ORDER_AMOUNT = 0;

        -- ==========================================================
        -- Loop through each cart item
        -- ==========================================================
        cart_loop: LOOP
            FETCH cart_items_cursor INTO
                temp_brand_payu, brand_templateid, temp_cart_item_id, temp_cart_item_qty,
                temp_cart_sender_name, temp_cart_delivery_name, temp_cart_delivery_email,
                temp_cart_delivery_phone, temp_cart_promocode_id, temp_delivery_date,
                temp_template_id, temp_gift, temp_gift_text, temp_gift_img_url,
                temp_brand_id, temp_product_id, temp_product_price, temp_product_name,
                temp_offer_brand_id, temp_offer_product_id, temp_offer_product_price,
                temp_offer_qty, temp_promocode_id, temp_promocode_user_max_usage,
                temp_promocode_total_max_usage, temp_promocode_used_count,
                temp_promotion_value, temp_promotion_offer_type,
                temp_promocode_user_used_count, temp_cart_item_total_qty,
                temp_brand_template_id, temp_product_discount, temp_offer_product_discount,
                temp_order_limit, temp_order_amt, temp_brand_name;

            IF LOOP_FINISHED = 1 THEN
                LEAVE cart_loop;
            END IF;

            SET @productinfo = CONCAT(@productinfo, ',', temp_product_name);

            -- ==========================================================
            -- Validate current cart item
            -- ==========================================================
            IF temp_brand_id IS NULL OR temp_product_id IS NULL THEN
                SET @temp_error = 'One or more product in your cart is out of stock.';
                LEAVE cart_loop;
            ELSEIF temp_cart_promocode_id IS NOT NULL AND temp_promocode_id IS NULL THEN
                SET @temp_error = 'Promotion is not valid.';
                LEAVE cart_loop;
            ELSEIF temp_promocode_total_max_usage IS NOT NULL AND
                   temp_promocode_total_max_usage < temp_promocode_used_count + temp_cart_item_total_qty THEN
                IF (temp_promocode_total_max_usage > temp_promocode_used_count) THEN
                    SET @temp_error = CONCAT('Only ', temp_promocode_total_max_usage - temp_promocode_used_count, ' quantity is available for the promotion of ', temp_product_name, '. Please remove ', temp_cart_item_total_qty - (temp_promocode_total_max_usage - temp_promocode_used_count), ' quantity from the cart.');
                ELSE
                    SET @temp_error = CONCAT('The promotion is no more available for ', temp_product_name, '. Please delete the item from the cart.');
                END IF;
                LEAVE cart_loop;
            ELSEIF temp_promocode_user_max_usage IS NOT NULL AND
                   temp_promocode_user_max_usage < temp_promocode_user_used_count + temp_cart_item_total_qty THEN
                SET @temp_error = CONCAT('You can buy / redeem a maximum of ', temp_promocode_user_max_usage, ' ', temp_product_name, ' using this PROMOCODE. Please remove the excess items from your cart.');
                LEAVE cart_loop;
            END IF;

            -- Determine PayU non-redirect flag
            IF (temp_brand_payu = 1 AND @PAYUNOR NOT IN (2)) THEN
                SET @PAYUNOR = 1;
            ELSEIF (temp_brand_payu = 2) THEN
                SET @PAYUNOR = 2;
            END IF;

            -- Accumulate amounts for specific brands (Amazon, Flipkart)
            IF (temp_brand_id = 4) THEN
                SET @AMZ_ORDER_AMOUNT = @AMZ_ORDER_AMOUNT + (temp_product_price * temp_cart_item_qty);
            END IF;
            IF (temp_brand_id = 158) THEN
                SET @FKT_ORDER_AMOUNT = @FKT_ORDER_AMOUNT + (temp_product_price * temp_cart_item_qty);
            END IF;

            -- Apply Coupon Value to Line Item - REMOVED
            SET @lineItemAmount = (temp_product_price * temp_cart_item_qty);
            SET @lineItemCash = @lineItemAmount; -- No coupon deduction
            SET @lineItemCoupon = 0; -- No coupon value spent on this item

            -- Calculate Promotion Amount
            SET @offer_amount = 0;
            SET @temp_promotion_amount = 0;
            SET @amountRequired = (temp_product_price * temp_cart_item_qty);

            IF temp_promotion_offer_type = 'DIS' THEN
                 -- Calculate discount based on the cash amount AFTER potential (removed) coupon
                SET @temp_promotion_amount = (@lineItemCash * temp_promotion_value) / 100;
            ELSEIF temp_promotion_offer_type = 'COMBO' THEN
                SET @temp_promotion_amount = ((((temp_product_price * temp_product_discount) / 100))) * temp_cart_item_qty;
            ELSEIF temp_promotion_offer_type = 'ABS' THEN
                SET @temp_promotion_amount = temp_promotion_value;
            ELSE
                SET @temp_promotion_amount = 0;
            END IF;

            SET @offer_amount = @offer_amount + @temp_promotion_amount;

            -- Update totals and calculate cash spent for this line item
            SET @total_amount = @total_amount + (temp_product_price * temp_cart_item_qty);
            SET @cash_spent = @lineItemCash - @offer_amount; -- Cash is now line amount - promo discount
            SET @totalPromotionCash = @totalPromotionCash + @temp_promotion_amount;
            SET @payu_amount = @payu_amount + @cash_spent;

            -- Insert primary order detail line (point_spent is now 0 or based on other logic if needed)
            INSERT INTO order_details (
                order_id, order_guid, cart_item_id, brand_id, product_id, product_price,
                quantity, promocode_id, promotion_cash, cash_spent, point_spent,
                delivery_sender_name, delivery_name, delivery_email, delivery_phone,
                created, delivery_date, template_id, gift, gift_text, gift_img_url,
                earning_point_ratio
            )
            VALUES (
                @var_order_id, @var_order_guid, temp_cart_item_id, temp_brand_id,
                temp_product_id, temp_product_price, temp_cart_item_qty,
                temp_promocode_id, @temp_promotion_amount, @cash_spent, 0, -- Set point_spent to 0
                temp_cart_sender_name, temp_cart_delivery_name, temp_cart_delivery_email,
                temp_cart_delivery_phone, NOW(), temp_delivery_date, brand_templateid,
                temp_gift, temp_gift_text, temp_gift_img_url, 0
            );

            -- Update order detail GUID
            SET @var_order_detail_guid = CONCAT(@var_order_guid, '-', @temp_counter);
            SET @temp_counter = @temp_counter + 1;
            UPDATE order_details SET guid = @var_order_detail_guid WHERE id = LAST_INSERT_ID();

            -- Insert offer product line if applicable
            IF temp_offer_brand_id IS NOT NULL THEN
                SET @var_order_detail_guid = CONCAT(@var_order_guid, '-', @temp_counter);
                SET @temp_counter = @temp_counter + 1;

                SET @is_offer = 1;
                SET @cash_spent = 0;
                SET @amountRequired = 0;
                SET @temp_promotion_amount = 0;

                IF temp_promotion_offer_type = 'COMBO' THEN
                    SET @is_offer = 0;
                    SET @amountRequired = temp_offer_product_price * temp_cart_item_qty;
                    SET @temp_promotion_amount = ((((temp_offer_product_price * temp_offer_product_discount) / 100))) * temp_cart_item_qty;
                    SET @cash_spent = @amountRequired - @temp_promotion_amount;
                    SET @offer_amount = @offer_amount + @temp_promotion_amount;
                    SET @totalPromotionCash = @totalPromotionCash + @temp_promotion_amount;
                END IF;

                INSERT INTO order_details (
                    order_id, guid, order_guid, cart_item_id, brand_id, product_id,
                    product_price, quantity, promocode_id, promotion_cash, cash_spent,
                    promotion_points, is_offer_product, extra_cashback_points,
                    cashback_points, delivery_sender_name, delivery_name, delivery_email,
                    delivery_phone, created, delivery_date, template_id, gift
                )
                VALUES (
                    @var_order_id, @var_order_detail_guid, @var_order_guid, NULL,
                    temp_offer_brand_id, temp_offer_product_id, temp_offer_product_price,
                    1, NULL, @temp_promotion_amount, @cash_spent, NULL, @is_offer, 0, 0,
                    temp_cart_sender_name, temp_cart_delivery_name, temp_cart_delivery_email,
                    temp_cart_delivery_phone, NOW(), temp_delivery_date, brand_templateid,
                    temp_gift
                );
            END IF;

            -- Check brand-specific monthly purchase cap
            IF (temp_order_limit = 'A') THEN
                IF (PRE_ORDER_BRAND_MONTH_MONTH_CAPING(given_user_id, temp_brand_id) > temp_order_amt) THEN
                    SET @temp_error = CONCAT('Sorry, You cannot place order amount more than INR ', temp_order_amt, ' worth of ', temp_brand_name, ' Gift Vouchers in this month.');
                    LEAVE cart_loop;
                END IF;
            END IF;

        END LOOP cart_loop; -- End of loop through cart items

    END IF; -- End check for user order buying cap

    -- ==========================================================
    -- Final Checks and Transaction Management
    -- ==========================================================

    -- Additional Cash Capping Logic (Commented Out)
    /* IF(@temp_error IS NULL) THEN
        SET @order_cash_amount = @total_amount;
        SET @brand_id = temp_brand_id;
        SET @order_day_diff = 0;
        SET @total_order_cash_value =  0;
        SET @total_completed_order_cash_value = 0;
        SET @cap_min_order_value = 0;
        SET @cap_max_order_value = 0;
        SET @error_msg = NULL;
        CALL caping_brand_detail(given_user_id, @brand_id, @order_day_diff,@total_order_cash_value,@total_completed_order_cash_value,@cap_min_order_value,@cap_max_order_value,@error_msg);
        IF (@cap_max_order_value < (@total_order_cash_value + @order_cash_amount)) THEN
            SET @temp_error = CONCAT('You have reached your ',@error_msg,' worth of Gift Vouchers.');
        END IF;
    END IF; */

    -- Check Amazon/Flipkart specific limits
    IF @AMZ_ORDER_AMOUNT > 10000 THEN
        SET @temp_error = 'Sorry, You cannot place order amount more than INR 10000 worth of Amazon Gift Vouchers in this month.';
    END IF;
    -- ELSEIF (@FKT_ORDER_AMOUNT > 10000) THEN
    -- SET @temp_error= 'Sorry, You cannot place order amount more than INR 10000 worth of Flipkart Gift Vouchers in this month.';

    IF (@AMZ_ORDER_AMOUNT > 0) THEN
        SET @TOTAL_AMZ_ORDER_AMOUNT = AMZ_ORDER_AMOUNT_USER_CAP(given_user_id, 4);
        IF (@TOTAL_AMZ_ORDER_AMOUNT > 10000) THEN
            SET @temp_error = 'Sorry, You cannot place order amount more than INR 10000 worth of Amazon Gift Vouchers in this month.';
        END IF;
    END IF;

    /* IF (@FKT_ORDER_AMOUNT > 0) THEN
        SET @TOTAL_FLP_ORDER_AMOUNT = AMZ_ORDER_AMOUNT_USER_CAP(given_user_id, 158);
        IF (@TOTAL_FLP_ORDER_AMOUNT > 10000) THEN
            SET @temp_error = 'Sorry, You cannot place order amount more than INR 10000 worth of Flipkart Gift Vouchers in this month.';
        END IF;
    END IF; */

    -- Check if any error occurred during the loop
    IF @temp_error IS NOT NULL THEN
        ROLLBACK;
        SELECT @temp_error AS error;
    ELSE
        -- Update the main order record with final amounts (removed payback_points_spent update)
        UPDATE orders
        SET offer_cash = @totalPromotionCash,
            cash_spent = @payu_amount,
            total_amount = @total_amount
            -- Removed payback_points_spent = @totalUseedCouponValue
        WHERE id = @var_order_id;

        SET @var_payu_guid = CONCAT(@var_order_guid, '');

        -- Determine payment source
        SET @source = 'PAYU';
        IF (given_utm_source = 'PAYTMUPI') THEN
            SET @source = 'PAYTMUPI';
        END IF;
        SET @source = 'SEAMLESSPG'; -- Forcing SEAMLESSPG as per original logic?
        SET @payunor = 10;


        -- Handle zero payment orders
        SET @payustatus = 'I';
        IF @payu_amount = 0 THEN
            -- Removed coupon update
            UPDATE orders SET status = 'V' WHERE guid = @var_order_guid;
            SET @payustatus = 'C';
        END IF;

        -- Insert transaction records
        SET @var_payu_guid = '';
        -- Removed Coupon Guid Variable
        -- SET @var_coupon_guid = '';

        IF (@payu_amount > 0) THEN
            SET @var_payu_guid = CONCAT(@var_order_guid, '');
            INSERT INTO transactions (
                user_id, guid, source, txn_type, amount, order_id, via,
                description, STATUS, created, payunor
            )
            VALUES (
                given_user_id, @var_payu_guid, @source, 'DB', @payu_amount, @var_order_id,
                'ORDER', '', @payustatus, NOW(), @PAYUNOR
            );
        END IF;

        -- Removed Coupon Transaction Insert Block

        -- Get user details for response
        SELECT phone, email, user_level INTO @user_mobile, @user_email, @user_level
        FROM users
        WHERE id = given_user_id;

        -- Get total voucher quantity
        SET @voucherqnty = (SELECT SUM(quantity) FROM order_details WHERE order_guid = @var_order_guid);

        -- ==========================================================
        -- Final Select Statement (Result Set - without coupon fields)
        -- ==========================================================
        SELECT
            @var_order_guid AS order_guid,
            @var_payu_guid AS payu_guid,
            @payu_amount AS payu_amount,
            -- Removed @var_coupon_guid AS coupon_guid,
            -- Removed @totalUseedCouponValue AS coupon_amount,
            @source AS txn_source,
            @PAYUNOR AS payunor,
            TRIM(BOTH ',' FROM @productinfo) AS productinfo,
            @user_email AS email,
            @user_mobile AS phone,
            @user_level AS user_level,
            @voucherqnty AS voucherQuantity;

        COMMIT;

    END IF; -- End error check before commit/rollback

END$$

DELIMITER ;