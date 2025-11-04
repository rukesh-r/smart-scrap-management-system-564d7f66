export const config = {
  // Get the current origin, fallback to localhost for development
  getRedirectUrl: () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'http://localhost:8082';
  },
  
  // OAuth redirect paths
  oauth: {
    redirectPath: '/',
    successPath: '/dashboard'
  }
};