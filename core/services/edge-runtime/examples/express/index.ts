import express from "express";

const app = express();

app.get("/express", (req, res) => {
  res.send("Welcome to the Dinosaur API!");
});

app.listen(8000);
