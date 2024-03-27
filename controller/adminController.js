const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const moment = require('moment');

const Admin = require('../model/userdb');
const User = require('../model/userdb');
const Product = require('../model/productdb');
const Category = require('../model/categorydb');
const Order = require('../model/orderdb');
const Coupon = require('../model/coupondb');
const Offer = require('../model/offerdb');

//login load
const loginLoad = asyncHandler( async (req,res) => {
    res.render('login');
});

const logout = asyncHandler( async (req,res) =>{
    req.session.admin_id = null;
    res.redirect('/admin');
})


//dashboard load
const dashboardLoad = asyncHandler( async (req,res) => {
    const orderData = await Order.find({status:'Delivered'});
    const revenue = orderData.reduce((acc,crr) =>{
        console.log(crr.subTotal)
        return acc = acc + crr.subTotal;
    },0)
    const orderCount = orderData.length;
    const productCount = orderData.reduce((acc,crr) =>{
        console.log(crr.products.length)
        return acc = acc + crr.products.length;
    },0)
    res.render('dashboard',{revenue, orderCount, productCount});
});

//customers load
const customersLoad = asyncHandler( async (req,res) => {
    const userData = await User.find({$and:[{isAdmin:false},{isVerified:true}]});
    const formatedUserData = userData.map(item =>{
        const { _id, googleId, wallet, username, email, mobile, password, address, isVerified, isBlock, isAdmin, token, createDate, __v, walletHistory } = item;

       const formatedDate = moment(createDate).format('DD-MM-YYYY');
       return {
        _id,
        googleId,
        wallet,
        username,
        email,
        mobile,
        password,
        address,
        isVerified,
        isBlock,
        isAdmin,
        token,
        createDate: formatedDate,
        __v,
        walletHistory       } 
    }) 
    res.render('customers',{users: formatedUserData});
});

const productsLoad = asyncHandler( async (req,res) => {
    const category = await Category.find({list:false});
    const productData = await Product.find().populate('categoryId');
    const imagePathsArray = productData.map(product => product.imagePaths); 
    res.render('products',{products:productData,imagePathsArray});
});

const categoryLoad = asyncHandler( async (req,res) => {
    const categoryData = await Category.find();
    res.render('category',{categoryData});
});

const addProductLoad = asyncHandler( async (req,res) => {
    const categoryData = await Category.find();
    res.render('addProduct',{categoryData});
});

const editCategoryLoad = asyncHandler( async (req,res)=>{

    const category_id = req.params.category_id;
    const categoryData = await Category.findOne({_id:category_id});
    res.render('editCategory',{categoryData});
})

const editProductLoad = asyncHandler( async (req,res) =>{

    const product_id = req.params.product_id;
    const categoryData = await Category.find();
    
    const product = await Product.findOne({_id:product_id});

    res.render('editProduct',{categoryData,product});

})



const verifyLogin = asyncHandler( async (req,res) => {

    const { email, password } = req.body;
    
    const adminData = await Admin.findOne({email:email});
    if(adminData){
        
        if(adminData.isAdmin === true){
            
            const matchPassword = await bcrypt.compare(password, adminData.password);
            if(matchPassword){
                req.session.admin_id = adminData._id;
                res.redirect('/admin/dashboard');
            }else{
                res.render('login',{msg:"Wrong password!"});
            }

        }else{
            res.render('login',{msg:"Sorry your not an admin"});
        }

    }else{
        res.render('login',{msg:"Couldn't find your email!"});
    }

});

const blockUser = asyncHandler( async (req,res) => {
    const userId = req.params.userId;
    const blockStatus = await User.findOne({_id:userId});
    if(blockStatus.isBlock === true){
        await User.updateOne({_id:userId},{isBlock:false});
        res.json({success:true, isBlock:false});
    }else{
        await User.updateOne({_id:userId},{isBlock:true});
        res.json({success:true, isBlock:true});
    }
});

const unblockUser = asyncHandler( async (req,res) => {
    const userId = req.params.userId;
    await User.findByIdAndUpdate(userId,{isBlock:false});
});



const addProduct = asyncHandler( async (req,res) => {

    const categoryData = await Category.find();

    if (!req.files || req.files.length === 0) {
        return res.status(400).render('addProduct',{ warningMsg: 'No images uploaded!', categoryData});
    };


    const {productName, description, price, quantity, category} = req.body;
    const imagePaths = req.files.map(file => file.filename);

    if(description.trim() === ''){
        return res.status(400).render('addProduct',{warningMsg:"Please give product description!", categoryData});
    };

    if(productName.trim() === ''){
        return res.status(400).render('addProduct',{warningMsg:"Please give product name!", categoryData});
    };

    if(price < 1){
        return res.status(400).render('addProduct',{warningMsg:"Product price must be valid!", categoryData})
    };

    if(quantity < 1){
        return res.status(400).render('addProduct',{warningMsg:"Give product quantity!", categoryData});
    };

    const categoryId = await Category.findOne({categoryName:category});
    
    const products = new Product({
        productName: productName,
        description: description,
        price: price,
        quantity: quantity,
        categoryId: categoryId._id,
        imagePaths: imagePaths,
    });

    var newProduct = await products.save();
    res.render('addProduct',{successMsg:"Product added successfully",categoryData});

});

const addCategory = asyncHandler( async (req,res) =>{
    const {categoryName, description} = req.body;
    const regexPattern = new RegExp(categoryName, "i");

    const checkCategory = await Category.findOne({categoryName:{$regex:regexPattern}});
    const categoryData = await Category.find();


    if(!(/^[A-Za-z]+(?: [A-Za-z]+)?$/.test(categoryName))){
        return res.status(400).render('category',{warningMsg:"Give a proper category name!",categoryData});
    }

    if(checkCategory && checkCategory.categoryName.toLocaleLowerCase() === categoryName.toLocaleLowerCase()){
       return res.status(400).render('category',{warningMsg:"Category already exist!",categoryData});
        }
       
        if(description.trim() === ''){
            return res.status(400).render('category',{warningMsg:"Please give category description!", categoryData});
        };
        const category = new Category({
            categoryName:categoryName,
            description:description,
        })

        var newCategory = await category.save();
        const updatedCategoryData = await Category.find();

        res.status(201).render('category',{successMsg:"Catergory added successfully", categoryData: updatedCategoryData});
});

const editProduct = async (req,res) =>{

    const product_id = req.params.product_id;
    const categoryData = await Category.find();
    const product = await Product.findOne({_id: product_id});

    
    const imageCount = product.imagePaths.length;
    const {productName, description, price, quantity, category} = req.body;

    if(description.trim() === ''){
        return res.status(400).render('editProduct',{warningMsg:"Please give product description!", categoryData, product});
    };

    if(productName.trim() === ''){
        return res.status(400).render('editProduct',{warningMsg:"Please give product name!", categoryData, product});
    };

    if(price < 1){
        return res.status(400).render('editProduct',{warningMsg:"Product price must be valid!", categoryData, product})
    };

    if(quantity < 1){
        return res.status(400).render('editProduct',{warningMsg:"Give product quantity!", categoryData, product});
    };

    const editedProductData = await Product.findOne({_id: product_id})

    if(imageCount > 3 && req.files.length>0){
        return res.status(400).render('editProduct', {warningMsg:"Product Already has 4 images", categoryData, product:editedProductData});
    }

    const categoryId = await Category.findOne({categoryName:category});

    const productData = await Product.findByIdAndUpdate(
        {_id:product_id},
        {$set:{
            productName: productName,
            description: description, 
            price: price, 
            quantity: quantity, 
            category: categoryId._id, 
        }});

    if(req.files.length>0){
        await Product.findByIdAndUpdate(
            {_id:product_id},
                {$push:{imagePaths:req.files[0].filename}}
        )
    }


    if(productData){
        res.redirect(`/admin/products`);
    }else{
        res.send("something went wrong");
    }
}

const editcategory = async (req,res) =>{

    const category_id = req.params.category_id;
    const {categoryName, description} = req.body;
    const regexPattern = new RegExp(categoryName, "i");

    const oldCategoryData = await Category.findOne({_id:category_id});
    const categoryData = await Category.find({_id:{$ne:category_id}});
    const checkCategory = await Category.findOne({
        _id:{$ne:category_id},
        categoryName:{$regex:regexPattern}
    });


    if(!(/^[A-Za-z]+(?: [A-Za-z]+)?$/.test(categoryName))){
        return res.status(400).render('editCategory',{warningMsg:"Give a proper category name!",categoryData:oldCategoryData});
    }

    if(checkCategory && checkCategory.categoryName.toLocaleLowerCase() === categoryName.toLocaleLowerCase()){
       return res.status(400).render('editCategory',{warningMsg:"Category already exist!",categoryData:oldCategoryData});
        }
       
        if(description.trim() === ''){
            return res.status(400).render('editCategory',{warningMsg:"Please give category description!", categoryData:oldCategoryData});
        };

        const editedCategory = await Category.findByIdAndUpdate(category_id, {$set:{categoryName:categoryName, description:description}})
        const updatedCategoryData = await Category.find();

        res.status(201).redirect('/admin/category');
}



    const deleteImage = async (req,res) =>{
    try {
        const image = req.params.imagePath;
        const product = await Product.findOne({imagePaths:image});
        const productImage = await Product.aggregate([
            {$match:{imagePaths:image}},
            {
                $project:{
                    _id:0,
                imageCount:{
                $size:"$imagePaths"
            }
            }
        }
        ]);
        if(productImage[0].imageCount < 2){
            //here return is working but not working the response
            return res.redirect(`/admin/editProduct/${product._id}`,{successMsg:'Product must have atleast one image!',product});
        }
         await Product.updateMany(
           {},
           {
            $pull: {
                imagePaths:image
            }
           }
        );

        const updatedProduct = await Product.findOne({imagePaths:image});
        res.render('editProduct',{product:updatedProduct});

    } catch (error) {
        res.status(401).send(error.message);
    }
}

const deleteProduct = async (req,res) => {
    try {
        const productId = req.params.productId
        await Product.findByIdAndDelete(
            productId
        );
        res.redirect('/admin/products')

    } catch (error) {
        res.status(500).send(error.message);
    }
}



const unlistCategory = async (req,res) => {
    try {
        const categoryId = req.params.categoryId
        await Category.findByIdAndUpdate(
            categoryId,
            {list:false}
        );

    } catch (error) {
        res.status(500).send(error.message);
    }
}

const listCategory = async (req,res) => {
    try {
        const categoryId = req.params.categoryId;
        await Category.findByIdAndUpdate(
            categoryId,
            {list:true}
        )
    } catch (error) {
        res.status(500).send(error.message);
    }
};


const listProduct = async (req,res) =>{
    try {
        const productId = req.params.productId;
        const productData = await Product.findById(productId) ;
        if(productData.list === true){
            await Product.findByIdAndUpdate(productId,{list:false});
        }else{
            await Product.findByIdAndUpdate(productId,{list:true});
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
}

const ordresLoad = async (req,res) =>{
    try {
        const orderData = await Order.find({})
            .sort({ date: -1 })
            .populate('products.productId')
            .populate('userId')
            .limit(10);
        const orderCount = await Order.countDocuments();
        const pageCount = Math.ceil(orderCount/10);
             res.render('orders',{orderData,pageCount})
    } catch (error) {
        res.status(404).json('Page not found');
        console.log(error);
    }
}

const orderPageLoad = async (req,res) =>{
    try {
        const pageNum = parseInt(req.params.page);
        const limit = 10;
        const skip = (pageNum-1) * limit;
        const orderData = await Order.find({})
            .sort({ date: -1 })
            .populate('products.productId')
            .populate('userId')
            .skip(skip)
            .limit(limit);
        res.json({orderData})
    } catch (error) {
        
    }
}

const orderDetailLoad = async (req,res) =>{
    try {
        const order_id = req.params.order_id;
        const orderData = await Order.findOne({_id:order_id}).populate('products.productId').populate('userId');
        const date = orderData.date;
        const formatedDate = moment(date).format('ddd, MMM, YYYY, h:mma');
        res.render('orderDetail',{orderData,formatedDate});
    } catch (error) {
        res.status(404).json('Page not found');
        console.log(error);
    }
}

const changeOrderStatus = async (req,res) =>{
    try {
        const productsDatas = req.body.products;
    const order_id = req.body.orderId
    for (const element of productsDatas) {
        
        await Order.findOneAndUpdate(
            { _id: order_id, 'products.productId': element.productId },
            { $set: { 'products.$.status': element.status } },
            { new: true }
        );
        if(element.status === 'Cancelled'){
            const orderProducts = await Order.findOne(
                { _id: order_id, 'products.productId': element.productId },
                { 'products.$': 1,}
            );
            for (const product of orderProducts.products) {
                if (product.productId.toString() === element.productId) {
                    const qty = product.quantity;
                    await Product.findOneAndUpdate({_id:element.productId},{$inc:{quantity:qty}});
                }
            }
        }
    }

    const orderProducts = await Order.findOne({_id:order_id},{_id:0,products:1});
    const checkStatuses = orderProducts.products.find(product => product.status !== 'Delivered');
    console.log(checkStatuses)
    if(!checkStatuses){
       await Order.updateOne({_id:order_id},{$set:{status:'Delivered'}});
    } 
    res.json({
        sucess:true,
        message:"updated sucessfully"
    })
    } catch (error) {
        console.log(error)
    }
    
}

const returnProduct = async (req,res) =>{
    try {
        const {productId, order_id, qty} = req.body;
        await Order.updateOne(
            {$and:[{_id:order_id},{'products.productId':productId}]},
            {$set:{'products.$.status':'Returned'}}
        )
        await Product.findByIdAndUpdate({_id:productId},{$inc:{quantity:qty}});
        const orderData = await Order.findById(order_id);
        if(orderData.paymentMode != 'COD'){
                let total = 0;
            orderData.products.forEach(product=>{
                console.log(product.productId._id);
                if(product.productId._id == productId){
                    total = product.total - orderData.couponDeduction;
                }
            })
            const walletHistory = {
                amount:total,
                description:'Return product',
                date:Date.now(),
                status:'in'
            }
            await User.findOneAndUpdate(
                {_id:req.session.user_id},
                {
                    $push:{walletHistory:[walletHistory]},
                    $inc:{wallet:total}
                }
                )
            }
        
        res.json({status:'Returned'})
    } catch (error) {
        
    }
}

const couponsLaod = async (req,res) =>{
    try {
        const couponData = await Coupon.find();
        res.render('coupons',{couponData});
    } catch (error) {
        console.log(error);
    }
}

const addCouponLoad = async (req,res) =>{
    try {
        res.render('addCoupon');
    } catch (error) {
        console.log(error);
    }
}

const addCoupon = async (req,res) =>{
        try {
        const {couponName, couponCode, description, expiryDate, discountAmount, minAmount} = req.body;
    
        if(couponName.trim() === ''){
            return res.status(400).render('addCoupon',{warningMsg:"Please give coupon name!"});
        };
    
        if(couponCode.trim() === ''){
            return res.status(400).render('addCoupon',{warningMsg:"Please give coupon code!"});
        };

        const regexPattern = new RegExp(couponCode, "i");
        const checkCoupon = await Coupon.findOne({couponCode:{$regex:regexPattern}});

    if(checkCoupon && checkCoupon.couponName.toLocaleLowerCase() === couponName.toLocaleLowerCase()){
        return res.status(400).render('addCoupon',{warningMsg:"Coupon already exist! Give unique coupon code"});
        }

        if(description.trim() === ''){
            return res.status(400).render('addCoupon',{warningMsg:"Please give coupon description!"});
        };
    
    
        if(discountAmount < 1){
            return res.status(400).render('addCoupon',{warningMsg:"Discount amount price must be valid!"})
        };
    
        if(minAmount < 1){
            return res.status(400).render('addCoupon',{warningMsg:"Minimum amount price must be valid!"});
        };
    
        
        const coupon = new Coupon({
            couponName,
            couponCode,
            description,
            expiryDate, 
            discountAmount, 
            minAmount
        });
    
        await coupon.save();
        res.render('addCoupon',{successMsg:"Coupon added successfully"});
    } catch (error) {
        console.log(error);
    }
}

const couponDelete = async (req,res) =>{
    try {
        const {couponId} = req.body;
        await Coupon.findByIdAndDelete(couponId);
        res.json({success:true});
    } catch (error) {
        console.log(error)
    }
}

const offerLoad = async (req,res) =>{
    try {
        const offerData = await Offer.find();
        res.render('offers',{offerData});
    } catch (error) {
        console.log(error);
}
}

const addOfferLoad = async (req,res) =>{
    try {
        const categoryData = await Category.find();
        const productData = await Product.find();
        const categories = categoryData.map(cat => cat.categoryName);
        const products = productData.map(pro => pro.productName);
        res.render('addOffer',{categoryData:categories,productData:products});
    } catch (error) {
        console.log(error)
    }
}


const addOffer = async (req,res) =>{
    try {
        const {offerName, description, percentage, expiryDate, status, offerType, selectedOptionvalue} = req.body;
        let per = parseInt(percentage)
        console.log('fghjkhfdsfjaksdjfkadjsklfjakljflk', selectedOptionvalue)
        
        if(offerName.trim() === ''){
            return res.json({warningMsg:"Please give offer name!"});
        }
        if(description.trim() === ''){
            return res.json({warningMsg:"Please give offer description!"});
        }
        if(parseFloat(percentage) < 1){
             return res.json({warningMsg:"Please give valid percentage!"});
        }
        if(new Date(expiryDate) < Date.now()){
            return res.json({warningMsg:"Please give valid expiry date!"});
        }
        if(offerType.trim() === ''){
            return res.json({warningMsg:"Please selcet offer type!"});
        }
        const offer = new Offer({
            offerName,  
            description,
            percentage: parseFloat(percentage),
            expiryDate,
            status,
            offerType
        })
        const newOffer = await offer.save();
        if(offerType == 'category'){
            const category = await Category.findOne({categoryName:selectedOptionvalue},{_id:1});
            await Category.findByIdAndUpdate(category._id,{offerId:newOffer._id});
        }else if(offerType == 'product'){
            const product = await Product.findOne({productName:selectedOptionvalue},{_id:1});
            await Product.findByIdAndUpdate(product._id,{offerId:newOffer._id});
        }
        res.json({successMsg:"Please give valid expiry date!"});
    } catch (error) {
        console.log(error)
    }
}

const reportLoad = async (req,res) =>{
    try {
        const orderData = await Order.find({status:'Delivered'}).sort({date:-1}).populate('userId');
        res.render('report',{orderData});
    } catch (error) {
        console.log(error)
    }
}

const generateReport = async (req, res) => {
    try {
        const startDate = req.body.startDate; 
        const endDate = req.body.endDate;  
        const orders = await Order.find({
            date: {
                $gte: startDate, 
                $lte: endDate 
            },
            status: 'Delivered' 
        })
        .populate('userId');
        const formattedOrders = orders.map(order => {
            const formattedDate = new Date(order.date).toLocaleDateString('en-GB').split('/').join('-'); 
            return {
                ...order.toObject(), 
                date: formattedDate
            };
        });

        console.log(formattedOrders);
        res.json(formattedOrders);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    loginLoad,
    verifyLogin,
    dashboardLoad,
    customersLoad,
    productsLoad,
    categoryLoad,
    editCategoryLoad,
    addProductLoad,
    blockUser,
    unblockUser,
    addProduct, 
    addCategory,
    editProductLoad,
    logout,
    editProduct,
    editcategory,
    deleteImage,
    unlistCategory,
    listCategory,
    listProduct,
    deleteProduct,
    ordresLoad,
    orderDetailLoad,
    changeOrderStatus,
    returnProduct,
    couponsLaod,
    addCouponLoad,
    addCoupon,
    couponDelete,
    offerLoad,
    addOfferLoad,
    addOffer,
    reportLoad,
    generateReport,
    orderPageLoad
}