import express from "express";
import crypto from "crypto";

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

// ================= HEALTH CHECK =================
router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Payment route working 🚀",
        razorpay: !!razorpay
    });
});

// ================= CREATE ORDER =================
router.post("/create-order", async (req, res) => {
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
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);

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
router.post("/verify", (req, res) => {
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

        const body = `${razorpay_order_id}|${razorpay_payment_id}`;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            return res.status(200).json({
                success: true,
                message: "Payment verified successfully"
            });
        }

        return res.status(400).json({
            success: false,
            message: "Invalid signature"
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
