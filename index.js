require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dns = require("node-dns");
const app = express();

mongoose
  .connect(process.env.MONGO_URI, {
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

const Schema = mongoose.Schema;

const urlSchema = new Schema({
  longUrl: { type: String, required: true },
  shortUrl: Number,
});

let Url = mongoose.model("Url", urlSchema);

app.use(bodyParser.urlencoded({ extended: false }));

let resObject = {};

app.post("/api/shorturl/new", async (req, res) => {
  const inputUrlLong = req.body.url_input;
  const shortUrlCode = shortId.generate();
  if (!validUrl.isWebUri(inputUrlLong)) {
    res.json({ error: "Invalid URL" });
  } else {
    try {
      let findUrl = await Url.findOne({ longUrl: inputUrlLong });
      if (findUrl) {
        res.json({ longUrl: findUrl.longUrl, shortUrl: findUrl.shortUrl });
      } else {
        findUrl = new Url({ longUrl: inputUrlLong, shortUrl: shortUrlCode });
        await findUrl.save();
        res.json({ longUrl: findUrl.longUrl, shortUrl: findUrl.shortUrl });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json("Server error");
    }
  }
});

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
