const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Проверка: есть ли вообще заголовок и начинается ли он с Bearer
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Нет токена, авторизация отклонена" });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_123');
    req.user = decoded; 
    next();
  } catch (error) {
    res.status(401).json({ message: "Токен невалиден или просрочен" });
  }
};