const express = require("express");

const productRoute = require("./product.route");
const router = express.Router();

/*=========== User Routes===============*/
router.use('/product', productRoute);


module.exports = router;