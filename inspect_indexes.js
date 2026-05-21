const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://anshusharma42019:Anshu42019@cluster0.bubhmal.mongodb.net/Triven-Ecommerce-Data?appName=Cluster0';

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB!');
        
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
        
        const productsCol = db.collection('products');
        const indexes = await productsCol.indexes();
        console.log('Indexes on products collection:');
        console.log(JSON.stringify(indexes, null, 2));
        
        // Find if variants.sku_1 index exists and drop it
        const hasVariantSkuIndex = indexes.some(idx => idx.name === 'variants.sku_1');
        if (hasVariantSkuIndex) {
            console.log('Dropping variants.sku_1 index...');
            await productsCol.dropIndex('variants.sku_1');
            console.log('variants.sku_1 index dropped successfully!');
        } else {
            console.log('No variants.sku_1 index found.');
        }

        // Check for other unique indexes
        const hasSkuIndex = indexes.some(idx => idx.name === 'sku_1');
        console.log('sku_1 index exists:', hasSkuIndex);
        
    } catch (err) {
        console.error('Error running script:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected!');
    }
}

run();
