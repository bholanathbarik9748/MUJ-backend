import mongoose from "mongoose";
const DB =
  "mongodb+srv://jokinok506:cwLRimU4t4X95tj8@nextjstudo.aeymiyy.mongodb.net/?retryWrites=true&w=majority&appName=nextjsTudo";

mongoose
  .connect(DB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((res) => console.log(`Server Start PORT 8000`))
  .catch((err) => console.log(err));
