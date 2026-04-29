import express from "express";
import crypto from "crypto";

import auth from "../middleware/auth.js";
import Payment from "../models/Payment.js"; // ✅ CREATE THIS MODEL

let Razorpay;
try {
    Razorpay = (await import("razorpay")).default;
} catch (err) {
    console.warn("⚠️ Razorpay not installed - payment disabled");
}

const router = express.Router();

// ================= INIT =================
let razorpay = null;

if (
    Razorpay &&
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET
) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
}

// ================= HEALTH =================
router.get("/", auth, (req, res) => {
    res.json({
        success: true,
        message: "Payment route working 🚀",
        user: req.user.id,
        razorpay: !!razorpay
    });
});


// ================= CREATE ORDER =================
router.post("/create-order", auth, async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(503).json({
                success: false,
                message: "Payment service not available"
            });
        }

        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid amount is required"
            });
        }

        const options = {
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: `user_${req.user.id}_${Date.now()}`, // 🔐 bind to user
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);

        // 🔐 STORE ORDER WITH USER
        await Payment.create({
            userId: req.user.id,
            orderId: order.id,
            amount: amount,
            status: "created"
        });

        return res.status(200).json({
            success: true,
            order
        });

    } catch (error) {
        console.error("Create Order Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to create order"
        });
    }
});


// ================= VERIFY PAYMENT =================
router.post("/verify", auth, async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(503).json({
                success: false,
                message: "Payment service not available"
            });
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        // 🔐 FIND ORDER FOR THIS USER ONLY
        const payment = await Payment.findOne({
            orderId: razorpay_order_id,
            userId: req.user.id
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // 🔐 SIGNATURE VERIFY
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Invalid signature"
            });
        }

        // 🔐 UPDATE ONLY THIS USER'S PAYMENT
        payment.paymentId = razorpay_payment_id;
        payment.status = "paid";

        await payment.save();

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully"
        });

    } catch (error) {
        console.error("Verify Payment Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Payment verification failed"
        });
    }
});

export default router;