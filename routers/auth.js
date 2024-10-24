const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const generateIdenticon = require("../utils/generateIdenticon");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

// 新規ユーザー登録API
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  const defaultIconImage = generateIdenticon(email);
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        profile: {
          create: {
            bio: "初めまして",
            profileImageUrl: defaultIconImage,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    return res.json(user);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// ユーザーログインAPI
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(401).json({ erorr: "そのユーザーは存在しません。" });
  }

  const isPasswordVaild = await bcrypt.compare(password, user.password);

  if (!isPasswordVaild) {
    return res.status(401).json({ error: "そのパスワードは間違っています" });
  }

  const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, {
    expiresIn: "1d",
  });

  return res.json({ token });
});

module.exports = router;
