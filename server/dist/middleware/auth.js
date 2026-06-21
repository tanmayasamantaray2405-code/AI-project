"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const security_1 = require("../utils/security");
const protect = async (req, res, next) => {
    let token;
    // Check for Bearer token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, (0, security_1.getJwtSecret)());
        // Attach the user ID to the request object
        req.user = { id: decoded.id };
        next();
    }
    catch (error) {
        console.error('JWT Verification error:', error);
        return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
};
exports.protect = protect;
