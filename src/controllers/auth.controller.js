const jwt = require("jsonwebtoken");
const Tenant = require("../models/Tenant");
const User = require("../models/User");
const { secret, expiresIn } = require("../config/jwt");

exports.register = async (req, res) => {
  const { tenantName, email, password } = req.body;

  const tenant = await Tenant.create({ name: tenantName });

  const user = await User.create({
    tenantId: tenant._id,
    email,
    password,
    role: "OWNER"
  });

  const token = jwt.sign(
    { userId: user._id, tenantId: tenant._id },
    secret,
    { expiresIn }
  );

  res.status(201).json({ token });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { userId: user._id, tenantId: user.tenantId },
    secret,
    { expiresIn } 
  );

  res.json({ token, user: { id: user._id, tenantId: user.tenantId, role: user.role } });
};  
