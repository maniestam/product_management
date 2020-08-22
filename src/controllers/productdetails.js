const httpStatus = require("http-status");
const APIError = require("../helpers/APIError");
const authService = require("../services/auth.service");
var smtpTransport = require('nodemailer-smtp-transport');
const db = require("../config/sequelize");
var nodemailer = require("nodemailer");
const Joi = require('joi');
const validator = require("../validations/memberregister");
const config = require('../config/config');
const product_tbl = db.product_details;
const produt_audit_tbl = db.product_details_audit;


var smtpTransport = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    auth: {
        user: config.mailid,
        pass: config.pwd
    }
}));

const ProductControler = () => {
  
  
    //to list all productdetails with details
    const getAllProducts = async (req, res, next) => {
        try {
            const postData = req.body;
            if (Object.keys(postData).length === 0) {
                return res
                    .status(httpStatus.BAD_REQUEST)
                    .json({
                        status: "failed",
                        msg: "object is undefined",
                        statusCode: 400
                    });
            }
            let pageNo = 0;
            const itemsPerPage = postData.paginationSize ? postData.paginationSize : 10;
            let sortArr = ['modified_date', 'DESC'];
            if (postData.pageNo) {
                let temp = parseInt(postData.pageNo);
                if (temp && (temp != NaN)) {
                    pageNo = temp;
                }
            }
            const offset = pageNo * itemsPerPage;
            let fieldSplitArr = [];
            if (postData.sortField) {
                fieldSplitArr = postData.sortField.split('.');
                if (fieldSplitArr.length == 1) {
                    sortArr[0] = postData.sortField;
                } else {
                    for (let idx = 0; idx < fieldSplitArr.length; idx++) {
                        const element = fieldSplitArr[idx];
                        fieldSplitArr[idx] = element.replace(/\[\/?.+?\]/ig, '');
                    }
                    sortArr = fieldSplitArr;
                }
            }
            if (postData.sortOrder && ((postData.sortOrder.toLowerCase() == 'asc') || (postData.sortOrder.toLowerCase() == 'desc'))) {
                if ((fieldSplitArr.length == 1) || (fieldSplitArr.length == 0)) {
                    sortArr[1] = postData.sortOrder;
                } else {
                    sortArr.push(postData.sortOrder);
                }
            }
            let findQuery = {
                offset: offset,
                limit: itemsPerPage,
                order: [
                    sortArr
                ],                
                    where:{
                  status:true,
                  is_active:true

                    }
                

            };
            if (postData.search && /\S/.test(postData.search)) {
                findQuery.where = Object.assign(findQuery.where, {
                    [Sequelize.Op.or]: [
                        {
                            name: {
                                [Sequelize.Op.like]: "%" + postData.search + "%"
                            }
                        },
                        {
                            product_code: {
                                [Sequelize.Op.like]: "%" + postData.search + "%"
                            }
                        },
                    ]
                });
            }
            if (postData.name && /\S/.test(postData.name)) {
                findQuery.where = Object.assign(findQuery.where, {
                    name: {
                        [Sequelize.Op.like]: "%" + postData.name + "%"
                    }
                });
            }
            if (postData.product_code && /\S/.test(postData.product_code)) {
                findQuery.where = Object.assign(findQuery.where, {
                    product_code: postData.product_code
                });
            }
            let getdata = await product_tbl.findAndCountAll(findQuery);
            if (getdata.count == 0) {
                return res
                    .status(httpStatus.OK)
                    .json({
                        statusCode: 200,
                        message: "Get Details Fetched successfully",
                        responseContents: [],
                        totalRecords: 0
                    });
            }
            return res
                .status(httpStatus.OK)
                .json({
                    statusCode: 200,
                    message: "Get Details Fetched successfully",
                    responseContents: getdata.rows,
                    totalRecords: getdata.count
                });

        }

        catch (err) {
            console.log(err);

            const errorMsg = err.errors ? err.errors[0].message : err.message;
            return res
                .status(httpStatus.INTERNAL_SERVER_ERROR)
                .json({
                    statusCode: 500,
                    status: "error",
                    msg: errorMsg
                });
        };
    }
  
    // Fetch Particular product  Data in POST Method Specific Id
    const getProductyId = async (req, res, next) => {
      const postData = req.body;
      try {
        let data = await product_tbl.findOne({
          where: {
            uuid: postData.Id
          },
         
           })
        if (!data) {
          throw {
            error_type: "validation",
            errors: "No data found"
          }
        }
      
        return res
          .status(httpStatus.OK)
          .json({
            statusCode: 200,
            req: postData,
            responseContents: data
          });
  
      } catch (err) {
        if (typeof err.error_type != 'undefined' && err.error_type == 'validation') {
          return res.status(400).json({ statusCode: 400, Error: err.errors, msg: "Validation error" });
        }
        const errorMsg = err.errors ? err.errors[0].message : err.message;
        return res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({
            statusCode: 500,
            status: "error",
            msg: errorMsg
          });
      }
    };
   
    // Save Particular product Data in POST Method
    const postProductData = async (req, res, next) => {
      try {
        if (typeof req.body != 'object') {
          throw 'please send body';
        }
        const postData = req.body;
        
        postData.created_by = req.headers.user_uuid;
        postData.modified_by = 0;
        if(postData.role_uuid==1){
           postData.status=true;
           postData.is_active=true;
          }
          else{
            postData.status=false;
            postData.is_active=false;
          }
          let product_data= await product_tbl.create(postData);
         let audit_insert=await audit_table_insert(product_data)
          return res.send({
            statusCode: 200,
            msg: "Inserted Activity details Successfully",
            req: postData,
            responseContents: product_data
          }); 
       
    
      }
      catch (err) {
        const errorMsg = err.errors ? err.errors[0].message : err.message;
        return res
          .status(500)
          .json({
            status: "error",
            msg: errorMsg,
            statusCode: 500
          });
      }
    };
  
    // Modify Particular product data POST Method Specific product Id
    const updateProduct = async (req, res, next) => {
      try {
     
        if (Object.keys(req.body).length == 0) {
          throw new Error('Please send some data');
        }
        const postData = req.body;
        postData.modified_by = req.headers.user_uuid;
        postData.modified_date = new Date();
        if(postData.role_uuid==1){
            postData.status=true;
            postData.is_active=true;
           }
           else{
             postData.status=false;
             postData.is_active=false;
           }

       let data = await product_tbl.update(postData, {
          where: {
            uuid: postData.Id
          },
          returning: true
        });
        let dat= await product_tbl.findOne({where:{uuid:postData.Id}})
         let audit_insert= await audit_table_insert(dat);
        return res.status(200).send({
          statusCode: 200,
          msg: "Updated Successfully",
          req: postData,
          responseContents: data
        });
  
      } catch (err) {
        const errorMsg = err.errors ? err.errors[0].message : err.message;
        return res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({
            statusCode: 500,
            status: "error",
            msg: errorMsg
          });
      }
    };
  
    // Soft Delete Particular product datan POST Method Specific product Id
    const deleteProduct = async (req, res, next) => {
      try {
        const postData = req.body;
        postData.modified_by = req.headers.user_uuid;
       if (postData == null || Object.keys(postData).length < 1) {
          throw new Error("Validation Error: No data found to delete");
        };
        if(postData.role_uuid==1){
            postData.status=true;
            postData.is_active=true;
           }
           else{
             postData.status=false;
             postData.is_active=false;
           }
        let data = await product_tbl.update({
          status: postData.status,
          is_active: postData.is_active
          },
          {
            where: {
              uuid: postData.Id
            }
          })
        res.send({
          statusCode: 200,
          msg: "Data deleted successfully",
          req: postData,
          responseContents: data
        });
      } catch (err) {
        const errorMsg = err.errors ? err.errors[0].message : err.message;
        return res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({
            statusCode: 500,
            status: "error",
            msg: errorMsg
          });
      }
    };
  
  
    // --------------------------------------------return----------------------------------
    return {
      getAllProducts,
      postProductData,
      deleteProduct,
      updateProduct,
      getProductyId,
     
    };
  };


module.exports = ProductControler();

async function audit_table_insert(Memdata){
    try{
     let dat={
         uuid:Memdata.dataValues.uuid,
         name:Memdata.dataValues.name,
         product_code:Memdata.dataValues.name,
         role_uuid:Memdata.dataValues.role_uuid,
         status:Memdata.dataValues.status,
         is_active:Memdata.dataValues.nis_activeame
     }
     const prodinsert=await produt_audit_tbl.create(dat);
    }
       catch(err){
       throw new Error(err);
       }     
  };
