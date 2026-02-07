const { MercadoPagoConfig, Preference, Payment: MPPayment, MerchantOrder } = require('mercadopago');
const { Order, Payment, Setting, OrderItem, User } = require('../models');
const emailService = require('../services/emailService');

// Get MercadoPago client with dynamic config from settings
const getMPClient = async () => {
  const setting = await Setting.findOne({ where: { key: 'mp_access_token' } });
  if (!setting || !setting.value) {
    throw new Error('MercadoPago no configurado.');
  }
  return new MercadoPagoConfig({ accessToken: setting.value });
};

// Get access token directly
const getAccessToken = async () => {
  const setting = await Setting.findOne({ where: { key: 'mp_access_token' } });
  if (!setting || !setting.value) {
    throw new Error('MercadoPago no configurado.');
  }
  return setting.value;
};

const paymentController = {
  // Create payment preference for order
  async createPreference(req, res) {
    try {
      const { orderId } = req.body;
      
      const order = await Order.findByPk(orderId, {
        include: [{ model: OrderItem, as: 'items' }]
      });
      
      if (!order) return res.status(404).json({ error: 'Pedido no encontrado.' });
      if (order.paymentStatus === 'paid') {
        return res.status(400).json({ error: 'Este pedido ya fue pagado.' });
      }

      const client = await getMPClient();
      const preference = new Preference(client);

      const items = order.items.map(item => ({
        id: item.productId,
        title: item.productName,
        quantity: item.quantity,
        unit_price: parseFloat(item.price),
        currency_id: 'MXN'
      }));

      // Add shipping as item if exists
      if (parseFloat(order.shipping) > 0) {
        items.push({
          id: 'shipping',
          title: 'Env\u00edo',
          quantity: 1,
          unit_price: parseFloat(order.shipping),
          currency_id: 'MXN'
        });
      }

      const frontendUrl = process.env.FRONTEND_URL || 'https://mezcalefimero.com';
      
      const preferenceData = {
        items,
        payer: {
          email: order.shippingEmail,
          name: order.shippingFirstName,
          surname: order.shippingLastName,
          phone: { number: order.shippingPhone }
        },
        back_urls: {
          success: `${frontendUrl}/checkout/success?order=${order.id}`,
          failure: `${frontendUrl}/checkout/failure?order=${order.id}`,
          pending: `${frontendUrl}/checkout/pending?order=${order.id}`
        },
        auto_return: 'approved',
        external_reference: order.id,
        notification_url: `${process.env.BACKEND_URL || frontendUrl}/api/payments/webhook`,
        statement_descriptor: 'EFIMERO MEZCAL'
      };

      const result = await preference.create({ body: preferenceData });

      // Save preference ID
      await Payment.create({
        orderId: order.id,
        mpPreferenceId: result.id,
        amount: order.total,
        status: 'pending'
      });

      res.json({
        preferenceId: result.id,
        initPoint: result.init_point,
        sandboxInitPoint: result.sandbox_init_point
      });
    } catch (error) {
      console.error('Create preference error:', error);
      res.status(500).json({ error: error.message || 'Error al crear preferencia de pago.' });
    }
  },

  // Webhook for MercadoPago notifications
  async webhook(req, res) {
    try {
      const { type, data } = req.body;
      
      if (type === 'payment') {
        const client = await getMPClient();
        const mpPayment = new MPPayment(client);
        const paymentInfo = await mpPayment.get({ id: data.id });
        
        const externalReference = paymentInfo.external_reference;
        const payment = await Payment.findOne({
          where: { orderId: externalReference }
        });

        if (payment) {
          const status = paymentInfo.status === 'approved' ? 'approved' :
                        paymentInfo.status === 'rejected' ? 'rejected' :
                        paymentInfo.status === 'in_process' ? 'in_process' : 'pending';

          await payment.update({
            mpPaymentId: String(paymentInfo.id),
            status,
            statusDetail: paymentInfo.status_detail,
            paymentMethod: paymentInfo.payment_method_id,
            paymentType: paymentInfo.payment_type_id,
            paidAt: status === 'approved' ? new Date() : null,
            rawResponse: paymentInfo
          });

          // Update order payment status
          const order = await Order.findByPk(externalReference, {
            include: [
              { model: User, as: 'user' },
              { model: OrderItem, as: 'items' }
            ]
          });
          if (order) {
            await order.update({
              paymentStatus: status === 'approved' ? 'paid' : 
                           status === 'rejected' ? 'failed' : 'pending',
              status: status === 'approved' ? 'confirmed' : order.status
            });
            
            // Si el pago fue aprobado, enviar emails
            if (status === 'approved') {
              // Email de confirmación al cliente
              if (order.user) {
                const orderForEmail = {
                  ...order.toJSON(),
                  shippingAddress: {
                    street: order.shippingAddress,
                    city: order.shippingCity,
                    state: order.shippingState,
                    zipCode: order.shippingZip,
                    country: order.shippingCountry
                  },
                  shippingCost: order.shipping
                };
                emailService.sendOrderConfirmation(orderForEmail, order.user).catch(err => {
                  console.error('Error sending payment confirmation email:', err);
                });
              }
              
              // Notificar al admin
              emailService.sendAdminPaymentReceived(order, {
                paymentMethod: paymentInfo.payment_method_id,
                paymentId: paymentInfo.id
              }).catch(err => {
                console.error('Error sending admin payment notification:', err);
              });
            }
          }
        }
      }

      res.sendStatus(200);
    } catch (error) {
      console.error('Webhook error:', error);
      res.sendStatus(200); // Always return 200 to MP
    }
  },

  // Get payment status
  async getStatus(req, res) {
    try {
      const payment = await Payment.findOne({
        where: { orderId: req.params.orderId }
      });
      
      if (!payment) return res.status(404).json({ error: 'Pago no encontrado.' });
      res.json({ payment });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener estado del pago.' });
    }
  },

  // Verify payment (called from frontend after redirect)
  async verify(req, res) {
    try {
      const { payment_id, status, external_reference } = req.query;
      
      const order = await Order.findByPk(external_reference, {
        include: [{ model: Payment, as: 'payment' }]
      });

      if (!order) return res.status(404).json({ error: 'Pedido no encontrado.' });

      // If payment was successful, verify with MP
      if (status === 'approved' && payment_id) {
        const client = await getMPClient();
        const mpPayment = new MPPayment(client);
        const paymentInfo = await mpPayment.get({ id: payment_id });

        if (paymentInfo.status === 'approved') {
          await order.payment?.update({
            mpPaymentId: String(payment_id),
            status: 'approved',
            paidAt: new Date()
          });
          await order.update({ paymentStatus: 'paid', status: 'confirmed' });
        }
      }

      res.json({ order, status });
    } catch (error) {
      res.status(500).json({ error: 'Error al verificar pago.' });
    }
  },

  // Process card payment directly (Card Payment Brick)
  async processCard(req, res) {
    try {
      const { 
        orderId, 
        token, 
        issuerId, 
        paymentMethodId, 
        transactionAmount, 
        installments,
        payer 
      } = req.body;

      const order = await Order.findByPk(orderId, {
        include: [{ model: OrderItem, as: 'items' }]
      });

      if (!order) return res.status(404).json({ error: 'Pedido no encontrado.' });
      if (order.paymentStatus === 'paid') {
        return res.status(400).json({ error: 'Este pedido ya fue pagado.' });
      }

      const accessToken = await getAccessToken();

      // Create payment using MercadoPago REST API
      const paymentData = {
        transaction_amount: Number(transactionAmount),
        token: token,
        description: `Pedido ${order.orderNumber} - MEZCAL EFÍMERO`,
        installments: Number(installments) || 1,
        payment_method_id: paymentMethodId,
        issuer_id: issuerId ? Number(issuerId) : undefined,
        payer: {
          email: payer.email,
          identification: payer.identification?.type && payer.identification?.number ? {
            type: payer.identification.type,
            number: payer.identification.number
          } : undefined
        },
        external_reference: orderId,
        statement_descriptor: 'MEZCAL EFIMERO',
        notification_url: `${process.env.BACKEND_URL || 'https://mezcalefimero.com'}/api/payments/webhook`,
        metadata: {
          order_id: orderId,
          order_number: order.orderNumber
        }
      };

      // Clean undefined values
      Object.keys(paymentData).forEach(key => 
        paymentData[key] === undefined && delete paymentData[key]
      );
      if (paymentData.payer?.identification === undefined) {
        delete paymentData.payer.identification;
      }

      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Idempotency-Key': `${orderId}-${Date.now()}`
        },
        body: JSON.stringify(paymentData)
      });

      const paymentResult = await response.json();

      if (!response.ok) {
        console.error('MP Payment Error:', paymentResult);
        return res.status(400).json({ 
          error: paymentResult.message || 'Error al procesar el pago',
          status: 'rejected',
          statusDetail: paymentResult.cause?.[0]?.description || 'Error desconocido'
        });
      }

      // Save/update payment record
      const [payment] = await Payment.upsert({
        orderId: order.id,
        mpPaymentId: String(paymentResult.id),
        amount: order.total,
        status: paymentResult.status,
        statusDetail: paymentResult.status_detail,
        paymentMethod: paymentResult.payment_method_id,
        paymentType: paymentResult.payment_type_id,
        paidAt: paymentResult.status === 'approved' ? new Date() : null,
        rawResponse: paymentResult
      });

      // Update order status
      if (paymentResult.status === 'approved') {
        await order.update({
          paymentStatus: 'paid',
          status: 'confirmed'
        });
        
        // Obtener usuario y enviar emails
        const user = await User.findByPk(order.userId);
        
        if (user) {
          const orderForEmail = {
            ...order.toJSON(),
            items: order.items,
            shippingAddress: {
              street: order.shippingAddress,
              city: order.shippingCity,
              state: order.shippingState,
              zipCode: order.shippingZip,
              country: order.shippingCountry
            },
            shippingCost: order.shipping
          };
          
          // Email de confirmación al cliente
          emailService.sendOrderConfirmation(orderForEmail, user).catch(err => {
            console.error('Error sending payment confirmation email:', err);
          });
        }
        
        // Notificar al admin del pago
        emailService.sendAdminPaymentReceived(order, {
          paymentMethod: paymentResult.payment_method_id,
          paymentId: paymentResult.id
        }).catch(err => {
          console.error('Error sending admin payment notification:', err);
        });
        
      } else if (paymentResult.status === 'rejected') {
        await order.update({ paymentStatus: 'failed' });
      }

      // Map status detail to user-friendly message
      const statusMessages = {
        'accredited': 'Pago acreditado',
        'pending_contingency': 'Pago pendiente de revisión',
        'pending_review_manual': 'Pago en revisión',
        'cc_rejected_bad_filled_card_number': 'Número de tarjeta incorrecto',
        'cc_rejected_bad_filled_date': 'Fecha de vencimiento incorrecta',
        'cc_rejected_bad_filled_other': 'Datos de tarjeta incorrectos',
        'cc_rejected_bad_filled_security_code': 'Código de seguridad incorrecto',
        'cc_rejected_blacklist': 'Tarjeta no permitida',
        'cc_rejected_call_for_authorize': 'Debes autorizar el pago con tu banco',
        'cc_rejected_card_disabled': 'Tarjeta deshabilitada',
        'cc_rejected_card_error': 'Error en la tarjeta',
        'cc_rejected_duplicated_payment': 'Pago duplicado',
        'cc_rejected_high_risk': 'Pago rechazado por seguridad',
        'cc_rejected_insufficient_amount': 'Fondos insuficientes',
        'cc_rejected_invalid_installments': 'Cuotas no permitidas',
        'cc_rejected_max_attempts': 'Límite de intentos alcanzado',
        'cc_rejected_other_reason': 'Tarjeta rechazada'
      };

      res.json({
        status: paymentResult.status,
        statusDetail: statusMessages[paymentResult.status_detail] || paymentResult.status_detail,
        paymentId: paymentResult.id,
        orderId: order.id,
        orderNumber: order.orderNumber
      });

    } catch (error) {
      console.error('Process card error:', error);
      res.status(500).json({ 
        error: error.message || 'Error al procesar el pago',
        status: 'error'
      });
    }
  }
};

module.exports = paymentController;
