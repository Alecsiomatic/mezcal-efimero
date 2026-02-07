const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

let client = null;

const initMercadoPago = (accessToken) => {
  if (accessToken) {
    client = new MercadoPagoConfig({ accessToken });
  }
  return client;
};

const getClient = () => client;

const createPreference = async (preferenceData) => {
  if (!client) throw new Error('Mercado Pago no está configurado');
  const preference = new Preference(client);
  return await preference.create({ body: preferenceData });
};

const getPayment = async (paymentId) => {
  if (!client) throw new Error('Mercado Pago no está configurado');
  const payment = new Payment(client);
  return await payment.get({ id: paymentId });
};

module.exports = {
  initMercadoPago,
  getClient,
  createPreference,
  getPayment
};
