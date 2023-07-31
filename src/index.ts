import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { MongoClient, ServerApiVersion } from "mongodb";

dotenv.config();

const app = express();

const port = process.env.PORT || 3000;

// app middleware
app.use(express.json());
app.use(cors({ origin: "*" }));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ernz8.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const db = client.db("mongo-task");
    const usersCollection = db.collection("users");
    const productsCollection = db.collection("products");
    const ordersCollection = db.collection("orders");

    app.get("/get-product-user-order", async (_, res) => {
      const data = await ordersCollection
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
          // // convert _id to a mongodb objectId for product using addFields
          // {
          //   $addFields: {
          //     product: { $toObjectId: "$_id.product" },
          //   },
          // },
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

      console.log(data);
      res.status(200).json({ data });
    });

    // get all data from database
    app.get("/", async (_, res) => {
      const users = usersCollection.find({}).toArray();
      const products = productsCollection.find({}).toArray();
      const orders = ordersCollection.find({}).toArray();

      const [usersData, productsData, ordersData] = await Promise.all([
        users,
        products,
        orders,
      ]);

      res
        .status(200)
        .json({ users: usersData, products: productsData, orders: ordersData });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log("running server on port " + port);
});
