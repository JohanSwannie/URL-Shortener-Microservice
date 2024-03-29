require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Schema, model, mongoose } = require("mongoose");
const bodyParser = require("body-parser");
const validUrl = require("valid-url");

const app = express();

const db = mongoose;

db.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log("Successfully connected to the database");
  })
  .catch((err) => {
    console.log("Could not connect to the database", err);
  });

const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

const urlSchema = new Schema({
  longUrl: { type: String, required: true },
  shortUrl: Number,
});

let Url = model("Url", urlSchema);

let resObject = {};

app.post(
  "/api/shorturl",
  bodyParser.urlencoded({ extended: false }),
  (req, res) => {
    let inputLongUrl = req.body["url"];
    if (!validUrl.isWebUri(inputLongUrl)) {
      res.json({ error: "Invalid URL" });
    } else {
      resObject["original_url"] = inputLongUrl;
      let inputShortUrl = 1;
      Url.findOne({})
        .sort({ shortUrl: "desc" })
        .exec((error, result) => {
          if (!error && result != undefined) {
            inputShortUrl = result.shortUrl + 1;
          }
          if (!error) {
            Url.findOneAndUpdate(
              { longUrl: inputLongUrl },
              { longUrl: inputLongUrl, shortUrl: inputShortUrl },
              { new: true, upsert: true },
              (error, savedUrl) => {
                if (!error) {
                  resObject["short_url"] = savedUrl.shortUrl;
                  res.json(resObject);
                } else {
                  res.json("Short URL ERROR");
                }
              }
            );
          }
        });
    }
  }
);

app.get("/api/shorturl/:urlNumber", (req, res) => {
  let inputUrlNumber = req.params.urlNumber;
  Url.findOne({ shortUrl: inputUrlNumber }, (error, result) => {
    if (!error && result != undefined) {
      res.redirect(result.longUrl);
    } else {
      res.json("URL not found");
    }
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
