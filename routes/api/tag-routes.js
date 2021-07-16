const router = require('express').Router();
const { Tag, Product, ProductTag } = require('../../models');

// The `/api/tags` endpoint

router.get('/', async (req, res) => {
  // find all tags
  // be sure to include its associated Product data
  try {
    const tagData = await Tag.findAll({
      include: [{ model: Product, through: ProductTag, as: 'tag_products' }],
    });
    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/:id', async (req, res) => {
  // find a single tag by its `id`
  // be sure to include its associated Product data
  try {
    const tagData = await Tag.findByPk(req.params.id, {
      include: [{ model: Product, through: ProductTag, as: 'tag_products' }],
    });

    if (!tagData) {
      res.status(404).json({ message: 'No tag found with that id!' });
      return;
    }

    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post('/', async (req, res) => {
  // create a new tag
try {
let tag = await Tag.create(req.body)
   if (req.body.productIds.length) {
     const tagProductIdArr = req.body.productIds.map((product_id) => {
       return {
         tag_id: tag.id,
         product_id,
       };
     });
     tagProductIds = await ProductTag.bulkCreate(tagProductIdArr);
      res.status(200).json(tagProductIds);
    } else {
      res.status(200).json(tag);
    }
} catch (err) {
  console.log(err);
  res.status(400).json(err);
}
});

router.put('/:id', async (req, res) => {
  // update product data
  try {
  let tag = await Tag.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
 let tagProducts = await ProductTag.findAll({ where: { tag_id: req.params.id } });
   if (req.body.productIds) {
      const tagProductIds = tagProducts.map(({ product_id }) => product_id);
      // create filtered list of new tag_ids
      const newtagProducts = req.body.productIds
        .filter((product_id) => !tagProductIds.includes(product_id))
        .map((product_id) => {
          return {
            tag_id: req.params.id,
            product_id,
          };
        });
      // figure out which ones to remove
      const tagProductsToRemove = tagProducts
        .filter(({ product_id }) => !req.body.productIds.includes(product_id))
        .map(({ id }) => id);

      // run both actions
      let updatedtagProducts = await Promise.all([
        ProductTag.destroy({ where: { id: tagProductsToRemove } }),
        ProductTag.bulkCreate(newtagProducts),
      ]);
    res.status(200).json(updatedtagProducts)
  } else {
 res.status(200).json(tag);
  }
} catch (err) {
      console.log(err);
      res.status(400).json(err);
    };
});

router.delete('/:id', (req, res) => {
  // delete on tag by its `id` value
  Tag.destroy({
    where: {
      id: req.params.id,
    },
  })
    .then((deletedTag) => {
      res.status(200).json(deletedTag);
    })
    .catch((err) => res.status(500).json(err));
});

module.exports = router;
