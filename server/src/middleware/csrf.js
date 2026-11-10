/**
 * CSRF Protection Middleware
 * Verifies custom header on state-changing requests when authenticated via cookies
 */
export const csrfProtection = (req, res, next) => {
  // Safe HTTP methods do not change state
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Exempt public auth routes (login, refresh, logout) where session isn't established yet
  const exemptPaths = [
    '/api/v1/auth/login',
    '/api/v1/auth/refresh',
    '/api/v1/auth/logout'
  ];
  if (exemptPaths.some((p) => req.path.startsWith(p))) {
    return next();
  }

  // If request uses Bearer token in Authorization header, CSRF via cookie is not an attack vector
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  // Verify custom client header
  const customHeader = req.headers['x-requested-with'] || req.headers['x-csrf-token'];
  if (!customHeader) {
    return res.status(403).json({
      success: false,
      message: 'Request verification failed (Missing security header).'
    });
  }

  next();
};
