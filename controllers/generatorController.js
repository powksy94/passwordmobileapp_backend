// controllers/generatorController.js
import crypto from "crypto";

const sets = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?"
};

export const generate = (req, res) => {
  const {
    length = 20,
    useUpper = true,
    useLower = true,
    useDigits = true,
    useSymbols = false
  } = req.body;

  let alphabet = "";

  if (useUpper) alphabet += sets.upper;
  if (useLower) alphabet += sets.lower;
  if (useDigits) alphabet += sets.digits;
  if (useSymbols) alphabet += sets.symbols;

  if (!alphabet)
    return res.status(400).json({ error: "No character set selected" });

  const bytes = crypto.randomBytes(length);
  let pwd = "";

  for (let i = 0; i < length; i++) {
    pwd += alphabet[bytes[i] % alphabet.length];
  }

  res.json({ password: pwd });
};
