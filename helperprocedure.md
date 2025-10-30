CREATE DEFINER=`awswebuserdev`@`%` FUNCTION `PRE_ORDER_BRAND_MONTH_MONTH_CAPING`(
    `given_id` BIGINT,
    `given_brand_id` INT
)
RETURNS float
LANGUAGE SQL
NOT DETERMINISTIC
CONTAINS SQL
SQL SECURITY DEFINER
COMMENT ''
BEGIN
RETURN (select IFNULL(sum((od.product_price*od.quantity)),0) as tot from order_details
AS od INNER JOIN orders AS o ON o.id=od.order_id
 WHERE od.brand_id = given_brand_id AND (o.status != 'F') AND (o.user_id=given_id)
 AND o.created>=FIRST_DAY(NOW()) AND o.created<=NOW()
);
END
CREATE DEFINER=`awswebuserdev`@`%` FUNCTION `AMZ_ORDER_AMOUNT_USER_CAP`(
    `given_id` BIGINT,
    `given_brand_id` INT
)
RETURNS int
LANGUAGE SQL
NOT DETERMINISTIC
CONTAINS SQL
SQL SECURITY DEFINER
COMMENT ''
BEGIN
RETURN (select sum(tot) order_amount from (select IFNULL(sum((od.product_price*od.quantity)),0) as tot from order_details 
AS od INNER JOIN orders AS o ON o.id=od.order_id 
 WHERE od.brand_id = given_brand_id AND (o.status='V') AND (o.user_id=given_id) AND o.created>=FIRST_DAY(NOW()) AND o.created<=NOW()
union
select IFNULL(sum((od.product_price*od.quantity)),0) as tot from order_details 
AS od INNER JOIN orders AS o ON o.id=od.order_id 
 WHERE od.brand_id = given_brand_id AND (o.status='C') AND (o.user_id=given_id) AND o.created>=FIRST_DAY(NOW()) AND o.created<=NOW()
 union 
select IFNULL(sum((od.product_price*od.quantity)),0) as tot from order_details 
AS od INNER JOIN orders AS o ON o.id=od.order_id 
 WHERE od.brand_id = given_brand_id AND (o.status='I') AND (o.user_id=given_id) AND o.created>=FIRST_DAY(NOW()) AND o.created<=NOW()
) a
);
END
