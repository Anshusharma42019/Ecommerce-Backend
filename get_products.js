'use strict';

const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/triven_ecommerce';

async function main() {
  await mongoose.connect(uri);
  console.log('Connected to DB');

  const products = await Product.find().populate('category');
  products.forEach(p => {
    console.log(`ID: ${p._id}`);
    console.log(`Name: ${p.name}`);
    console.log(`Category: ${p.category ? p.category.name : 'None'}`);
    console.log(`Price: ₹${p.price}`);
    console.log(`Thumbnail: ${p.thumbnail ? p.thumbnail.url : 'None'}`);
    console.log(`Images: ${JSON.stringify(p.images)}`);
    console.log('-----------------------------------------');
  });

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
