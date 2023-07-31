"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const mongodb_1 = require("mongodb");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use(express_1.default.json());
app.use((0, cors_1.default)({ origin: "*" }));
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ernz8.mongodb.net/?retryWrites=true&w=majority`;
const client = new mongodb_1.MongoClient(uri, {
    serverApi: {
        version: mongodb_1.ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = client.db("mongo-task");
            const usersCollection = db.collection("users");
            const productsCollection = db.collection("products");
            const ordersCollection = db.collection("orders");
            app.get("/get-product-user-order", (_, res) => __awaiter(this, void 0, void 0, function* () {
                const data = yield ordersCollection
                    .aggregate([
                    { $unwind: "$products" },
                    {
                        $group: {
                            _id: {
                                customer: "$customerId",
                                product: "$products",
                            },
                            ordersCount: { $sum: 1 },
                        },
                    },
                    { $match: { ordersCount: { $gte: 10 } } },
                    {
                        $addFields: {
                            customer: { $toObjectId: "$_id.customer" },
                            product: { $toObjectId: "$_id.product" },
                        },
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "customer",
                            foreignField: "_id",
                            as: "customer",
                        },
                    },
                    {
                        $lookup: {
                            from: "products",
                            localField: "product",
                            foreignField: "_id",
                            as: "product",
                        },
                    },
                    { $unwind: "$customer" },
                    { $unwind: "$product" },
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
            }));
            app.get("/", (_, res) => __awaiter(this, void 0, void 0, function* () {
                const users = usersCollection.find({}).toArray();
                const products = productsCollection.find({}).toArray();
                const orders = ordersCollection.find({}).toArray();
                const [usersData, productsData, ordersData] = yield Promise.all([
                    users,
                    products,
                    orders,
                ]);
                res
                    .status(200)
                    .json({ users: usersData, products: productsData, orders: ordersData });
            }));
            yield client.db("admin").command({ ping: 1 });
            console.log("Pinged your deployment. You successfully connected to MongoDB!");
        }
        finally {
        }
    });
}
run().catch(console.dir);
app.listen(port, () => {
    console.log("running server on port " + port);
});
