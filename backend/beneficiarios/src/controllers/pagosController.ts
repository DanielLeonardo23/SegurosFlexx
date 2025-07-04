import { Request, Response } from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Usamos la clave secreta de Stripe, cargada desde las variables de entorno
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-02-24.acacia',
});

// Controlador para crear el Payment Intent
const createPaymentIntent = async (req: Request, res: Response) => {
  const { amount } = req.body;  // Monto a cobrar

  if (!amount) {
    res.status(400).send({ error: 'Monto requerido' });
    return;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      description: 'Pago por Póliza',
    });

    // Enviamos el client_secret al frontend para el proceso de pago
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).send({ error: (error as any).message });
  }
};

// Controlador para confirmar el pago
const confirmPayment = async (req: Request, res: Response) => {
  const { paymentMethodId, clientSecret } = req.body;

  if (!paymentMethodId || !clientSecret) {
    res.status(400).json({ error: 'Faltan datos requeridos (paymentMethodId o clientSecret)' });
    return;
  }

  try {
    // Confirmar el PaymentIntent con el paymentMethodId
    const paymentIntent = await stripe.paymentIntents.confirm(clientSecret, {
      payment_method: paymentMethodId,
    });

    if (paymentIntent.status === 'succeeded') {
      res.status(200).json({ success: true, paymentIntent });
      return;
    } else {
      res.status(400).json({ error: 'El pago no fue procesado correctamente' });
      return;
    }
  } catch (error) {
    console.error('Error al confirmar el pago:', error);
    res.status(500).json({ error: (error as any).message || 'Error al confirmar el pago' });
    return;
  }
};

export default { createPaymentIntent, confirmPayment };
