const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
router.get('/', async (req, res) => {
  // find all products
  // be sure to include its associated Category and Tag data
  try {
    const productData = await Product.findAll({
      include: [{ model: Category }, { model: Tag, through: ProductTag, as: 'product_tags' }],
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get one product
router.get('/:id', async (req, res) => {
  // find a single product by its `id`
  // be sure to include its associated Category and Tag data
  try {
    const productData = await Product.findByPk(req.params.id, {
      include: [{ model: Category }, { model: Tag, through: ProductTag, as: 'product_tags' }],
    });
    if (!productData) {
      res.status(404).json({ message: 'No product found with that id!' });
      return;
    }

    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// create new product
router.post('/', async (req, res) => {
 try {
   let product = await Product.create(req.body);
      // if there's product tags, we need to create pairings to bulk create in the ProductTag model
      if (req.body.tagIds.length) {
        const productTagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        let productTagIds = await ProductTag.bulkCreate(productTagIdArr);
        res.status(200).json(productTagIds);
      } else {
        res.status(200).json(product);
      }
      // if no product tags, just respond
    } catch (err) {
      console.log(err);
      res.status(400).json(err);
    };
});

// update product
router.put('/:id', async (req, res) => {
  // update product data
  try {
  let product = await Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
  let productTags = await ProductTag.findAll({ where: { product_id: req.params.id } });
    if (req.body.tagIds) {
      const productTagIds = productTags.map(({ tag_id }) => tag_id);
      
      const newProductTags = req.body.tagIds
        .filter((tag_id) => !productTagIds.includes(tag_id))
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          };
        });
      // figure out which ones to remove
      const productTagsToRemove = productTags
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id);

      let updatedProductTags = await Promise.all([
        ProductTag.destroy({ where: { id: productTagsToRemove } }),
        ProductTag.bulkCreate(newProductTags),
      ]);
    res.status(200).json(updatedProductTags);
    } else {
      res.status(200).json(product);
    }
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
    });

router.delete('/:id', (req, res) => {
  // delete one product by its `id` value
  // Looks for the product based on id given in the request parameters and deletes the instance from the database
  Product.destroy({
    where: {
      id: req.params.id,
    },
  })
    .then((deletedProduct) => {
      res.status(200).json(deletedProduct);
    })
    .catch((err) => res.status(500).json(err));
});

module.exports = router;
