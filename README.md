# mongo task

## Aggregate Query Code

```ts
ordersCollection
  .aggregate([
    // use unwind for split products array to deferent document
    { $unwind: "$products" },
    {
      $group: {
        // group by customerId and product to calculate how many times those customers and products appear in the split documents.
        _id: {
          customer: "$customerId",
          product: "$products",
        },
        // in grouping we need a accumulator to calculate count
        ordersCount: { $sum: 1 },
      },
    },
    // now filter outed which orders count gater than or qual 10
    { $match: { ordersCount: { $gte: 10 } } },
    // convert _id to a mongodb objectId for customer and product using addFields
    {
      $addFields: {
        customer: { $toObjectId: "$_id.customer" },
        product: { $toObjectId: "$_id.product" },
      },
    },
    // use lookup for populate or get customer other information from user's collection
    {
      $lookup: {
        from: "users",
        localField: "customer",
        foreignField: "_id",
        as: "customer",
      },
    },
    // use lookup for populate or get product other information from products's collection
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "product",
      },
    },
    // use unwind for convert to customer object from array
    { $unwind: "$customer" },
    // use unwind for convert to product object from array
    { $unwind: "$product" },
    // finally select those field that i need. Selected name and email from customer and selected title and price from product using project
    // also select orders count and unselect _id field in project
    {
      $project: {
        _id: 0,
        "customer.name": 1,
        "customer.email": 1,
        "product.title": 1,
        "product.price": 1,
        ordersCount: 1,
      },
    },
  ])
  .toArray();
```

## Get API Endpoints

```
https://mongo-task-six.vercel.app/get-product-user-order
```
