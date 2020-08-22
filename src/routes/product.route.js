const express = require("express");
const prodCtrl = require("../controllers/productdetails");
const middleware = require("../middleware/api-middleware");
const router = express.Router(); 

router.route("/getAllProducts").post( middleware.isAuthorized,prodCtrl.getAllProducts);
router.route("/postProductData").post( middleware.isAuthorized,prodCtrl.postProductData);
router.route("/deleteProduct").put(prodCtrl.deleteProduct);
router.route("/updateProduct").post( middleware.isAuthorized,prodCtrl.updateProduct);
router.route("/getProductyId").post( middleware.isAuthorized,prodCtrl.getProductyId);


module.exports = router;
