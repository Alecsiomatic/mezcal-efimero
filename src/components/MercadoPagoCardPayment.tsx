import { useEffect, useRef, useState } from 'react';
import api from '../api/client';

declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface MercadoPagoCardPaymentProps {
  orderId: string;
  amount: number;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  payerEmail: string;
}

export default function MercadoPagoCardPayment({ 
  orderId, 
  amount, 
  onSuccess, 
  onError,
  payerEmail 
}: MercadoPagoCardPaymentProps) {
  const cardPaymentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const mpInstanceRef = useRef<any>(null);
  const cardPaymentBrickRef = useRef<any>(null);

  // Fetch MercadoPago public key from settings
  useEffect(() => {
    const fetchPublicKey = async () => {
      try {
        const { data } = await api.get('/settings/public/mercadopago');
        if (data.settings?.mp_public_key) {
          setPublicKey(data.settings.mp_public_key);
        } else {
          onError('MercadoPago no está configurado. Contacta al administrador.');
        }
      } catch (err) {
        onError('Error al cargar configuración de pago');
      }
    };
    fetchPublicKey();
  }, []);

  // Load MercadoPago SDK
  useEffect(() => {
    if (!publicKey) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    
    script.onload = () => {
      initializeCardPayment();
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (cardPaymentBrickRef.current) {
        cardPaymentBrickRef.current.unmount?.();
      }
      const existingScript = document.querySelector('script[src="https://sdk.mercadopago.com/js/v2"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [publicKey]);

  const initializeCardPayment = async () => {
    if (!window.MercadoPago || !publicKey || !cardPaymentRef.current) return;

    try {
      mpInstanceRef.current = new window.MercadoPago(publicKey, {
        locale: 'es-MX'
      });

      const bricksBuilder = mpInstanceRef.current.bricks();

      // Card Payment Brick with flip card animation
      cardPaymentBrickRef.current = await bricksBuilder.create('cardPayment', 'cardPaymentBrick_container', {
        initialization: {
          amount: amount,
          payer: {
            email: payerEmail,
          },
        },
        customization: {
          visual: {
            style: {
              theme: 'dark',
              customVariables: {
                formBackgroundColor: 'rgba(15, 12, 8, 0.9)',
                baseColor: '#D4AF37',
                baseColorFirstVariant: '#B8962E',
                baseColorSecondVariant: '#FFD700',
                secondaryColor: '#FFFFFF',
                errorColor: '#EF4444',
                successColor: '#22C55E',
                outlinePrimaryColor: '#D4AF37',
                outlineSecondaryColor: 'rgba(212, 175, 55, 0.3)',
                buttonTextColor: '#0A0806',
                fontSizeExtraSmall: '12px',
                fontSizeSmall: '14px',
                fontSizeMedium: '16px',
                fontSizeLarge: '18px',
                fontSizeExtraLarge: '24px',
                fontWeightNormal: '400',
                fontWeightSemiBold: '600',
                formInputsTextColor: '#FFFFFF',
                formInputsBorderColor: 'rgba(212, 175, 55, 0.4)',
                formInputsBorderWidth: '1px',
                formInputsBorderFocusColor: '#D4AF37',
                formInputsBorderErrorColor: '#EF4444',
                formInputsBackgroundColor: 'rgba(26, 22, 16, 0.8)',
                formInputsErrorColor: '#EF4444',
                formInputsLabelColor: 'rgba(255, 255, 255, 0.8)',
                formInputsPlaceholderColor: 'rgba(255, 255, 255, 0.4)',
                formPadding: '20px',
                inputVerticalPadding: '14px',
                inputHorizontalPadding: '16px',
                inputBorderRadius: '12px',
                borderRadiusFull: '16px',
                borderRadiusMedium: '12px',
                borderRadiusSmall: '8px',
              }
            },
            texts: {
              formTitle: '',
              cardNumber: {
                label: 'Número de tarjeta',
                placeholder: '1234 5678 9012 3456'
              },
              expirationDate: {
                label: 'Vencimiento',
                placeholder: 'MM/AA'
              },
              securityCode: {
                label: 'CVV',
                placeholder: '123'
              },
              cardholderName: {
                label: 'Nombre en la tarjeta',
                placeholder: 'NOMBRE APELLIDO'
              },
              cardholderIdentification: {
                label: 'Documento',
              },
              installments: {
                label: 'Cuotas',
              },
            },
            hideFormTitle: true,
            hidePaymentButton: false,
            defaultPaymentOption: {
              cardForm: true,
            }
          },
          paymentMethods: {
            maxInstallments: 12,
            minInstallments: 1,
          },
        },
        callbacks: {
          onReady: () => {
            setLoading(false);
          },
          onSubmit: async (cardFormData: any) => {
            setProcessing(true);
            try {
              const { data } = await api.post('/payments/process-card', {
                orderId,
                token: cardFormData.token,
                issuerId: cardFormData.issuer_id,
                paymentMethodId: cardFormData.payment_method_id,
                transactionAmount: amount,
                installments: cardFormData.installments || 1,
                payer: {
                  email: payerEmail,
                  identification: cardFormData.payer?.identification || {}
                }
              });

              if (data.status === 'approved') {
                onSuccess(data.paymentId);
              } else if (data.status === 'in_process' || data.status === 'pending') {
                onError('El pago está pendiente de aprobación. Te notificaremos cuando se confirme.');
              } else {
                onError(data.statusDetail || 'El pago fue rechazado. Intenta con otra tarjeta.');
              }
            } catch (err: any) {
              console.error('Payment error:', err);
              onError(err.response?.data?.error || 'Error al procesar el pago');
            } finally {
              setProcessing(false);
            }
          },
          onError: (error: any) => {
            console.error('Brick error:', error);
            onError('Error en el formulario de pago');
          },
        },
      });

    } catch (error) {
      console.error('Error initializing MP:', error);
      onError('Error al inicializar el sistema de pago');
      setLoading(false);
    }
  };

  return (
    <div className="mp-card-payment-wrapper">
      {loading && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem',
          color: 'rgba(255,255,255,0.7)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(212, 175, 55, 0.3)',
            borderTopColor: '#D4AF37',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ marginTop: '1rem' }}>Cargando pasarela de pago...</p>
        </div>
      )}
      
      {processing && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(10, 8, 6, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          borderRadius: '16px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(212, 175, 55, 0.3)',
            borderTopColor: '#D4AF37',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ marginTop: '1rem', color: '#D4AF37', fontWeight: 600 }}>
            Procesando pago...
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
            No cierres esta ventana
          </p>
        </div>
      )}

      <div 
        id="cardPaymentBrick_container" 
        ref={cardPaymentRef}
        style={{ 
          display: loading ? 'none' : 'block',
          position: 'relative'
        }} 
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .mp-card-payment-wrapper {
          position: relative;
          min-height: 400px;
        }
        
        /* Override MercadoPago Brick styles to match our theme */
        #cardPaymentBrick_container {
          --mercadopago-baseColor: #D4AF37 !important;
        }
        
        #cardPaymentBrick_container button[type="submit"] {
          background: linear-gradient(135deg, #D4AF37 0%, #B8962E 100%) !important;
          color: #0A0806 !important;
          font-weight: 700 !important;
          border: none !important;
          border-radius: 12px !important;
          padding: 16px 32px !important;
          font-size: 16px !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          text-transform: uppercase !important;
          letter-spacing: 1px !important;
        }
        
        #cardPaymentBrick_container button[type="submit"]:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 25px rgba(212, 175, 55, 0.4) !important;
        }
        
        #cardPaymentBrick_container button[type="submit"]:disabled {
          opacity: 0.6 !important;
          cursor: not-allowed !important;
          transform: none !important;
        }
      `}</style>
    </div>
  );
}
