import express from "express";
import session from "express-session";
import arcjet, { validateEmail } from "@arcjet/node";
import dotenv from "dotenv";

dotenv.config();

//in memory

const app = express();
const PORT = 4000;
const users = [];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
);

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    validateEmail({
      mode: "LIVE", 
      deny: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
    }),
  ],
});

const displayEmails = () => {
  console.log("Registered user");
  users.forEach((user) => console.log(user.email));
};

app.post("/sign-up", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (users.find((user) => user.email === email)) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const decision = await aj.protect(req, {
      email,
    });
    console.log("Arcjet decision", decision);

    if (decision.isDenied()) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Forbidden" }));
    } else {
      users.push({ email, password });
      displayEmails();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ message: "Hello World", email: req.body.email })
      );
    }
  } catch (error) {
    console.error("Error in sign-up:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
