"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = __importDefault(require("stripe"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Usamos la clave secreta de Stripe, cargada directamente aquí
const stripe = new stripe_1.default('sk_test_51RkahlFL65NjHwNQbqZ2GU4bvnXCj7D0um9XdLDBNn53RES7H6eHzXQpkDNXD6kR0cwBJQA5sZ35wMgf8KKFgdB500yYqDmUm5', {
    apiVersion: '2025-02-24.acacia',
});
// Controlador para crear el Payment Intent
const createPaymentIntent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { amount } = req.body; // Monto a cobrar
    if (!amount) {
        res.status(400).send({ error: 'Monto requerido' });
        return;
    }
    try {
        const paymentIntent = yield stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            description: 'Pago por Póliza',
        });
        // Enviamos el client_secret al frontend para el proceso de pago
        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    }
    catch (error) {
        res.status(500).send({ error: error.message });
    }
});
// Controlador para confirmar el pago
const confirmPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { paymentMethodId, clientSecret } = req.body;
    if (!paymentMethodId || !clientSecret) {
        res.status(400).json({ error: 'Faltan datos requeridos (paymentMethodId o clientSecret)' });
        return;
    }
    try {
        // Confirmar el PaymentIntent con el paymentMethodId
        const paymentIntent = yield stripe.paymentIntents.confirm(clientSecret, {
            payment_method: paymentMethodId,
        });
        if (paymentIntent.status === 'succeeded') {
            res.status(200).json({ success: true, paymentIntent });
            return;
        }
        else {
            res.status(400).json({ error: 'El pago no fue procesado correctamente' });
            return;
        }
    }
    catch (error) {
        console.error('Error al confirmar el pago:', error);
        res.status(500).json({ error: error.message || 'Error al confirmar el pago' });
        return;
    }
});
exports.default = { createPaymentIntent, confirmPayment };
