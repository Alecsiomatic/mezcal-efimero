const { User, Order } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const userController = {
  async getAll(req, res) {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const where = {};

      if (search) {
        where[Op.or] = [
          { email: { [Op.like]: `%${search}%` } },
          { firstName: { [Op.like]: `%${search}%` } },
          { lastName: { [Op.like]: `%${search}%` } }
        ];
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password', 'refreshToken'] },
        include: [{ model: Order, as: 'orders' }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        users: rows,
        pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener usuarios.' });
    }
  },

  async getById(req, res) {
    try {
      const user = await User.findByPk(req.params.id, {
        attributes: { exclude: ['password', 'refreshToken'] },
        include: [{ model: Order, as: 'orders', limit: 10, order: [['createdAt', 'DESC']] }]
      });
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener usuario.' });
    }
  },

  async update(req, res) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

      const { email, firstName, lastName, phone, isAdmin, isActive } = req.body;
      await user.update({ email, firstName, lastName, phone, isAdmin, isActive });

      res.json({ message: 'Usuario actualizado.', user: user.toJSON() });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar usuario.' });
    }
  },

  async updateRole(req, res) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

      const { isAdmin } = req.body;
      
      if (!isAdmin) {
        const adminCount = await User.count({ where: { isAdmin: true } });
        if (adminCount <= 1) {
          return res.status(400).json({ error: 'No puedes quitar permisos al unico admin.' });
        }
      }

      await user.update({ isAdmin });
      res.json({ message: 'Rol actualizado.', user: user.toJSON() });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar rol.' });
    }
  },

  async delete(req, res) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
      if (user.isAdmin) {
        const adminCount = await User.count({ where: { isAdmin: true } });
        if (adminCount <= 1) {
          return res.status(400).json({ error: 'No puedes eliminar el unico admin.' });
        }
      }
      await user.destroy();
      res.json({ message: 'Usuario eliminado.' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar usuario.' });
    }
  },

  async getStats(req, res) {
    try {
      const [totalUsers, newUsersMonth, totalAdmins] = await Promise.all([
        User.count(),
        User.count({ where: { createdAt: { [Op.gte]: new Date(new Date().setDate(1)) } } }),
        User.count({ where: { isAdmin: true } })
      ]);
      res.json({ totalUsers, newUsersMonth, totalAdmins });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener estadisticas.' });
    }
  },

  // User profile update (for logged in user)
  async updateProfile(req, res) {
    try {
      const user = await User.findByPk(req.userId);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

      const { firstName, lastName, phone } = req.body;
      await user.update({ firstName, lastName, phone });

      const userData = user.toJSON();
      delete userData.password;
      delete userData.refreshToken;

      res.json({ message: 'Perfil actualizado.', user: userData });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Error al actualizar perfil.' });
    }
  },

  // Change password (for logged in user)
  async changePassword(req, res) {
    try {
      const user = await User.findByPk(req.userId);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

      const { currentPassword, newPassword } = req.body;

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ error: 'Contraseña actual incorrecta.' });
      }

      // Update password (will be hashed by model hook)
      user.password = newPassword;
      await user.save();

      res.json({ message: 'Contraseña actualizada correctamente.' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Error al cambiar contraseña.' });
    }
  }
};

module.exports = userController;
