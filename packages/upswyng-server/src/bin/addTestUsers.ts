import { ObjectId } from "bson";
import User from "../models/User";
import mongoose from "mongoose";

export const testUserSub = "test_user_sub";
export const testUser = new User({
  _id: new ObjectId(),
  google: {
    sub: testUserSub,
    email: "testUser@email.com",
  },
});

export const testAdminSub = "test_admin_sub";
export const testAdmin = new User({
  _id: new ObjectId(),
  google: {
    sub: testAdminSub,
    email: "testAdmin@email.com",
  },
  isAdmin: true,
});

mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
  })
  .then(async () => {
    await testUser.save();
    await testAdmin.save();
  })
  .finally(() => mongoose.connection.close());
