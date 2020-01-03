import Category from "../models/Category";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
// May require additional time for downloading MongoDB binaries
jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;
let mongoServer;
const opts = { useMongoClient: true }; // remove this option if you use mongoose 5 and above
beforeAll(async () => {
  mongoServer = new MongoMemoryServer();
  const mongoUri = await mongoServer.getConnectionString();
  console.log(mongoUri);
  await mongoose.connect(mongoUri, opts, err => {
    if (err) console.error(err);
  });
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
describe("...", () => {
  it("Shows a category List", async () => {
    await (
      await Category.findOrCreate("Test Category 1", "test-category_1")
    ).save();
    await (
      await Category.findOrCreate("Test Category 2", "test-category_2")
    ).save();
    const list = await Category.getCategoryList();
    expect(list.length).toEqual(2);
  });
});
