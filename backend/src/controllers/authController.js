const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const { generateTokens } = require('../middleware/auth');
const emailService = require('../services/emailService');

const authController = {
  // Register new user
  async register(req, res) {
    try {
      const { email, password, firstName, lastName, lastName2, phone, country, state } = req.body;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'El email ya est\u00e1 registrado.' });
      }

      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        lastName2: lastName2 || null,
        phone,
        country: country || 'MX',
        state: state || null,
        role: 'customer'
      });

      const tokens = generateTokens(user);
      user.refreshToken = tokens.refreshToken;
      await user.save();

      // Enviar email de bienvenida (no bloqueante)
      emailService.sendWelcomeEmail(user).catch(err => {
        console.error('Error sending welcome email:', err);
      });

      res.status(201).json({
        message: 'Usuario registrado exitosamente.',
        user: user.toJSON(),
        ...tokens
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Error al registrar usuario.' });
    }
  },

  // Login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inv\u00e1lidas.' });
      }

      if (!user.isActive) {
        return res.status(401).json({ error: 'Cuenta desactivada. Contacta al administrador.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Credenciales inv\u00e1lidas.' });
      }

      const tokens = generateTokens(user);
      user.refreshToken = tokens.refreshToken;
      user.lastLogin = new Date();
      await user.save();

      res.json({
        message: 'Login exitoso.',
        user: user.toJSON(),
        ...tokens
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Error al iniciar sesi\u00f3n.' });
    }
  },

  // Refresh token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token requerido.' });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findByPk(decoded.id);

      if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json({ error: 'Refresh token inv\u00e1lido.' });
      }

      const tokens = generateTokens(user);
      user.refreshToken = tokens.refreshToken;
      await user.save();

      res.json(tokens);
    } catch (error) {
      return res.status(401).json({ error: 'Refresh token inv\u00e1lido o expirado.' });
    }
  },

  // Get current user
  async me(req, res) {
    res.json({ user: req.user.toJSON() });
  },

  // Logout
  async logout(req, res) {
    try {
      req.user.refreshToken = null;
      await req.user.save();
      res.json({ message: 'Sesi\u00f3n cerrada exitosamente.' });
    } catch (error) {
      res.status(500).json({ error: 'Error al cerrar sesi\u00f3n.' });
    }
  },

  // Update profile
  async updateProfile(req, res) {
    try {
      const { firstName, lastName, phone } = req.body;
      
      await req.user.update({ firstName, lastName, phone });
      
      res.json({ 
        message: 'Perfil actualizado.',
        user: req.user.toJSON() 
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar perfil.' });
    }
  },

  // Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      const isMatch = await req.user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ error: 'Contrase\u00f1a actual incorrecta.' });
      }

      req.user.password = newPassword;
      await req.user.save();

      res.json({ message: 'Contrase\u00f1a actualizada exitosamente.' });
    } catch (error) {
      res.status(500).json({ error: 'Error al cambiar contrase\u00f1a.' });
    }
  },

  // Forgot password - send reset email
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        // No revelar si el email existe (seguridad)
        return res.json({ message: 'Si el email existe, recibirás un link de recuperación.' });
      }

      // Generar token de reset con validez de 1 hora
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      user.resetToken = resetToken;
      user.resetTokenExpiry = resetTokenExpiry;
      await user.save();

      // Enviar email con link de reset (no bloqueante)
      emailService.sendPasswordResetEmail(user, resetToken).catch(err => {
        console.error('Error sending password reset email:', err);
      });

      res.json({ message: 'Si el email existe, recibirás un link de recuperación.' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Error al procesar la solicitud.' });
    }
  },

  // Reset password with token
  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: 'Token y contraseña son requeridos.' });
      }

      const user = await User.findOne({
        where: {
          resetToken: token
        }
      });

      if (!user) {
        return res.status(400).json({ error: 'Link de recuperación inválido.' });
      }

      // Verificar que el token no haya expirado
      if (new Date() > user.resetTokenExpiry) {
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();
        return res.status(400).json({ error: 'Link de recuperación expirado.' });
      }

      // Actualizar contraseña y limpiar tokens de reset
      user.password = password;
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save();

      res.json({ message: 'Contraseña restablecida exitosamente. Puedes iniciar sesión.' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Error al restablecer la contraseña.' });
    }
  }
};

module.exports = authController;
