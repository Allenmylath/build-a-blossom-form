useEffect(() => {
    // Handle OAuth callbacks
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Extract actual user ID from state (remove timestamp if present)
    const actualUserId = state && state.includes('_') ? state.split('_')[0] : state;

    // Handle OAuth errors
    if (error) {
      toast({
        title: "OAuth Error",
        description: errorDescription || error,
        variant: "destructive",
      });
      // Clear URL parameters
      window.history.replaceState({}, '', '/integrations');
      return;
    }

    // Handle successful OAuth callback - use extracted user ID for comparison
    if (code && state && user?.id === actualUserId) {
      handleOAuthCallback(code, state);
    }